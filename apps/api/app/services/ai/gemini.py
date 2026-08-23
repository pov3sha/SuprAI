import time
import json
from typing import Optional, Dict, Any
from loguru import logger
import google.generativeai as genai
from app.core.config import settings
from app.services.ai.base import ModelResponse, UsageMetrics

class GeminiProvider:
    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.GEMINI_MODEL
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.2
    ) -> ModelResponse:
        start_time = time.time()

        if settings.MOCK_AI_PROVIDERS or not self.api_key:
            logger.info(f"Using mock mode for Gemini ({self.model_name})")
            elapsed = int((time.time() - start_time) * 1000)
            return ModelResponse(
                content=prompt,
                usage=UsageMetrics(input_tokens=120, output_tokens=220, estimated_cost=0.0015, latency_ms=elapsed),
                model=self.model_name,
                provider="Google Gemini"
            )

        try:
            full_prompt = ""
            if system_instruction:
                full_prompt += f"System: {system_instruction}\n\n"
            if json_schema:
                full_prompt += f"Respond ONLY with a valid JSON object matching this schema: {json.dumps(json_schema)}\n\n"
            full_prompt += f"User: {prompt}"

            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(temperature=temperature)
            )

            text_content = response.text if hasattr(response, "text") else ""
            elapsed = int((time.time() - start_time) * 1000)

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
                usage=UsageMetrics(input_tokens=150, output_tokens=250, estimated_cost=0.001, latency_ms=elapsed),
                model=self.model_name,
                provider="Google Gemini"
            )
        except Exception as e:
            logger.error(f"Gemini API invocation error: {e}")
            elapsed = int((time.time() - start_time) * 1000)
            return ModelResponse(
                content=f"Error calling Gemini API: {e}",
                usage=UsageMetrics(latency_ms=elapsed),
                model=self.model_name,
                provider="Google Gemini",
                finish_reason="error"
            )
