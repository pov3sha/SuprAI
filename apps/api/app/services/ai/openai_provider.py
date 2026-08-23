import time
import json
from typing import Optional, Dict, Any
from loguru import logger
from openai import OpenAI
from app.core.config import settings
from app.services.ai.base import ModelResponse, UsageMetrics

class OpenAIProvider:
    def __init__(self, model_name: Optional[str] = None):
        self.model = model_name or settings.OPENAI_MODEL
        self.api_key = settings.OPENAI_API_KEY
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.2
    ) -> ModelResponse:
        start_time = time.time()

        if settings.MOCK_AI_PROVIDERS or not self.client:
            logger.info(f"Using mock mode for OpenAI ({self.model})")
            elapsed = int((time.time() - start_time) * 1000)
            return ModelResponse(
                content=prompt,
                usage=UsageMetrics(input_tokens=150, output_tokens=250, estimated_cost=0.002, latency_ms=elapsed),
                model=self.model,
                provider="OpenAI"
            )

        try:
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            if json_schema:
                messages.append({"role": "system", "content": f"Respond strictly in JSON matching this schema: {json.dumps(json_schema)}"})
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                response_format={"type": "json_object"} if json_schema else None
            )

            text_content = response.choices[0].message.content or ""
            elapsed = int((time.time() - start_time) * 1000)
            
            usage = response.usage
            in_tokens = usage.prompt_tokens if usage else 0
            out_tokens = usage.completion_tokens if usage else 0
            cost = (in_tokens * 0.0000025) + (out_tokens * 0.00001)

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
                usage=UsageMetrics(input_tokens=in_tokens, output_tokens=out_tokens, estimated_cost=cost, latency_ms=elapsed),
                model=self.model,
                provider="OpenAI"
            )
        except Exception as e:
            logger.error(f"OpenAI API invocation error: {e}")
            elapsed = int((time.time() - start_time) * 1000)
            return ModelResponse(
                content=f"Error calling OpenAI API: {e}",
                usage=UsageMetrics(latency_ms=elapsed),
                model=self.model,
                provider="OpenAI",
                finish_reason="error"
            )
