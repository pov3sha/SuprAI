import time
import json
import httpx
from typing import Optional, Dict, Any, List
from loguru import logger
from app.core.config import settings, ConfigurationError
from app.services.ai.base import ModelResponse, UsageMetrics

class OllamaModelNotFoundError(Exception):
    pass

def verify_configured_models() -> Dict[str, Any]:
    """
    Verifies that every model configured across manager, consultant, analyst, researcher roles exists in Ollama.
    Raises ConfigurationError if variable is unconfigured, or OllamaModelNotFoundError if missing from Ollama.
    """
    roles = ["manager", "consultant", "analyst", "researcher"]
    role_models = {}
    
    for r in roles:
        model = settings.get_role_model(r)
        role_models[r] = model

    # Deduplicate models for query
    unique_models = set(role_models.values())
    
    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if res.status_code != 200:
                raise OllamaModelNotFoundError(f"Could not connect to Ollama at {settings.OLLAMA_BASE_URL}")
            
            installed_models = [m.get("name") for m in res.json().get("models", [])]
            for model_name in unique_models:
                # Check exact or family match (e.g. qwen2.5:0.5b vs qwen2.5:0.5b-instruct)
                if not any(model_name in installed or installed in model_name for installed in installed_models):
                    raise OllamaModelNotFoundError(f"Configured Ollama model '{model_name}' is not installed.")
    except (httpx.RequestError, httpx.HTTPStatusError) as e:
        logger.error(f"Ollama connection check error: {e}")
        raise OllamaModelNotFoundError(f"Ollama connection failed: {e}")

    return {
        "status": "verified",
        "base_url": settings.OLLAMA_BASE_URL,
        "role_models": role_models
    }

class OllamaProvider:
    def __init__(self, role_name: str = "manager", model_name: Optional[str] = None, base_url: Optional[str] = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.role_name = role_name
        self.model = model_name or settings.get_role_model(role_name)

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.2,
        execution_id: Optional[str] = None
    ) -> ModelResponse:
        start_time = time.time()
        
        full_prompt = prompt
        if system_instruction:
            full_prompt = f"System: {system_instruction}\n\nUser: {prompt}"
        if json_schema:
            full_prompt += f"\n\nRespond ONLY with a valid JSON object matching schema: {json.dumps(json_schema)}"

        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": temperature
            }
        }

        if json_schema or "json" in prompt.lower():
            payload["format"] = "json"

        logger.info(f"OLLAMA_REQUEST execution_id={execution_id} agent={self.role_name} model={self.model} url={self.base_url}/api/generate")

        try:
            with httpx.Client(timeout=180.0) as client:
                resp = client.post(f"{self.base_url}/api/generate", json=payload)
                resp.raise_for_status()
                data = resp.json()

            text_content = data.get("response", "")
            elapsed = int((time.time() - start_time) * 1000)

            in_tokens = data.get("prompt_eval_count", len(prompt) // 4)
            out_tokens = data.get("eval_count", len(text_content) // 4)

            logger.info(f"OLLAMA_RESPONSE execution_id={execution_id} agent={self.role_name} model={self.model} latency_ms={elapsed} in_tokens={in_tokens} out_tokens={out_tokens}")

            parsed_json = None
            if json_schema or "{" in text_content:
                try:
                    start_idx = text_content.find("{")
                    end_idx = text_content.rfind("}") + 1
                    if start_idx != -1 and end_idx > start_idx:
                        parsed_json = json.loads(text_content[start_idx:end_idx])
                except Exception as e:
                    logger.warning(f"Could not parse JSON from Ollama response: {e}")

            return ModelResponse(
                content=text_content,
                raw_json=parsed_json,
                usage=UsageMetrics(input_tokens=in_tokens, output_tokens=out_tokens, estimated_cost=0.0, latency_ms=elapsed),
                model=self.model,
                provider="Ollama"
            )
        except Exception as e:
            elapsed = int((time.time() - start_time) * 1000)
            logger.error(f"OLLAMA_ERROR execution_id={execution_id} agent={self.role_name} model={self.model} error={e}")
            raise RuntimeError(f"Ollama execution failed for role '{self.role_name}' model '{self.model}': {e}")
