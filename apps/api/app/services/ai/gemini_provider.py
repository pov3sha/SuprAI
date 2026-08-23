import time
import json
from typing import Optional, Dict, Any
from loguru import logger
import google.generativeai as genai
from app.core.config import settings, ConfigurationError
from app.services.ai.base import ModelResponse, UsageMetrics

class GeminiProvider:
    def __init__(self, role_name: str = "consultant", model_name: Optional[str] = None):
        if not settings.GEMINI_API_KEY:
            raise ConfigurationError("GEMINI_API_KEY is not configured.")

        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.role_name = role_name
        self.provider = "Gemini"
        self.model = model_name or settings.get_role_model(role_name, "gemini")

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.2,
        execution_id: Optional[str] = None
    ) -> ModelResponse:
        start_time = time.time()

        system_prompt = system_instruction or "You are a professional AI assistant."
        full_prompt = prompt
        if json_schema:
            full_prompt += f"\n\nRespond ONLY with a valid JSON object matching schema: {json.dumps(json_schema)}"

        logger.info(f"GEMINI_REQUEST execution_id={execution_id} agent={self.role_name} model={self.model}")

        try:
            model = genai.GenerativeModel(
                model_name=self.model,
                system_instruction=system_prompt
            )

            response = model.generate_content(
                full_prompt,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    response_mime_type="application/json" if (json_schema or "json" in prompt.lower()) else "text/plain"
                )
            )

            elapsed = int((time.time() - start_time) * 1000)
            text_content = response.text if response and response.text else ""

            in_tokens = len(prompt) // 4
            out_tokens = len(text_content) // 4
            if hasattr(response, "usage_metadata") and response.usage_metadata:
                in_tokens = getattr(response.usage_metadata, "prompt_token_count", in_tokens)
                out_tokens = getattr(response.usage_metadata, "candidates_token_count", out_tokens)

            logger.info(f"GEMINI_RESPONSE execution_id={execution_id} agent={self.role_name} model={self.model} latency_ms={elapsed} in_tokens={in_tokens} out_tokens={out_tokens}")

            parsed_json = None
            if json_schema or "{" in text_content:
                try:
                    start_idx = text_content.find("{")
                    end_idx = text_content.rfind("}") + 1
                    if start_idx != -1 and end_idx > start_idx:
                        parsed_json = json.loads(text_content[start_idx:end_idx])
                except Exception as e:
                    logger.warning(f"Could not parse JSON from Gemini response: {e}")

            return ModelResponse(
                content=text_content,
                raw_json=parsed_json,
                usage=UsageMetrics(input_tokens=in_tokens, output_tokens=out_tokens, estimated_cost=0.0, latency_ms=elapsed),
                model=self.model,
                provider="Gemini"
            )
        except Exception as e:
            elapsed = int((time.time() - start_time) * 1000)
            logger.error(f"GEMINI_ERROR execution_id={execution_id} agent={self.role_name} model={self.model} error={e}")
            raise RuntimeError(f"Gemini execution failed for role '{self.role_name}' model '{self.model}': {e}")
