import time
import json
from typing import Optional, Dict, Any
from loguru import logger
import openai
from app.core.config import settings, ConfigurationError
from app.services.ai.base import ModelResponse, UsageMetrics

class OpenAIProvider:
    def __init__(self, role_name: str = "manager", model_name: Optional[str] = None):
        if not settings.OPENAI_API_KEY:
            raise ConfigurationError("OPENAI_API_KEY is not configured.")
        
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.role_name = role_name
        self.provider = "OpenAI"
        self.model = model_name or settings.get_role_model(role_name, "openai")

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.2,
        execution_id: Optional[str] = None
    ) -> ModelResponse:
        start_time = time.time()

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        
        user_content = prompt
        if json_schema:
            user_content += f"\n\nRespond ONLY with a valid JSON object matching schema: {json.dumps(json_schema)}"

        messages.append({"role": "user", "content": user_content})

        kwargs: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }

        if json_schema or "json" in prompt.lower():
            kwargs["response_format"] = {"type": "json_object"}

        logger.info(f"OPENAI_REQUEST execution_id={execution_id} agent={self.role_name} model={self.model}")

        try:
            response = self.client.chat.completions.create(**kwargs)
            elapsed = int((time.time() - start_time) * 1000)

            text_content = response.choices[0].message.content or ""
            in_tokens = response.usage.prompt_tokens if response.usage else len(prompt) // 4
            out_tokens = response.usage.completion_tokens if response.usage else len(text_content) // 4

            logger.info(f"OPENAI_RESPONSE execution_id={execution_id} agent={self.role_name} model={self.model} latency_ms={elapsed} in_tokens={in_tokens} out_tokens={out_tokens}")

            parsed_json = None
            if json_schema or "{" in text_content:
                try:
                    start_idx = text_content.find("{")
                    end_idx = text_content.rfind("}") + 1
                    if start_idx != -1 and end_idx > start_idx:
                        parsed_json = json.loads(text_content[start_idx:end_idx])
                except Exception as e:
                    logger.warning(f"Could not parse JSON from OpenAI response: {e}")

            return ModelResponse(
                content=text_content,
                raw_json=parsed_json,
                usage=UsageMetrics(input_tokens=in_tokens, output_tokens=out_tokens, estimated_cost=0.0, latency_ms=elapsed),
                model=self.model,
                provider="OpenAI"
            )
        except Exception as e:
            elapsed = int((time.time() - start_time) * 1000)
            logger.error(f"OPENAI_ERROR execution_id={execution_id} agent={self.role_name} model={self.model} error={e}")
            if "401" in str(e) or "invalid_api_key" in str(e):
                logger.warning(f"OpenAI API key invalid (401), falling back to local Ollama provider for role '{self.role_name}'")
                from app.services.ai.ollama_provider import OllamaProvider
                return OllamaProvider(role_name=self.role_name).generate(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    json_schema=json_schema,
                    temperature=temperature,
                    execution_id=execution_id
                )
            raise RuntimeError(f"OpenAI execution failed for role '{self.role_name}' model '{self.model}': {e}")
