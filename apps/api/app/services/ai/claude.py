import time
import json
from typing import Optional, Dict, Any
from loguru import logger
from anthropic import Anthropic
from app.core.config import settings
from app.services.ai.base import ModelResponse, UsageMetrics

class ClaudeProvider:
    def __init__(self, model_name: Optional[str] = None):
        self.model = model_name or settings.ANTHROPIC_MODEL
        self.api_key = settings.ANTHROPIC_API_KEY
        self.client = Anthropic(api_key=self.api_key) if self.api_key else None

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.2
    ) -> ModelResponse:
        start_time = time.time()
        
        if settings.MOCK_AI_PROVIDERS or not self.client:
            logger.info(f"Using mock mode for Claude ({self.model})")
            elapsed = int((time.time() - start_time) * 1000)
            return ModelResponse(
                content=prompt,
                usage=UsageMetrics(input_tokens=100, output_tokens=200, estimated_cost=0.001, latency_ms=elapsed),
                model=self.model,
                provider="Anthropic"
            )

        try:
            messages = [{"role": "user", "content": prompt}]
            sys_prompt = system_instruction or "You are an expert AI orchestrator."
            
            if json_schema:
                sys_prompt += f"\nRespond ONLY with a valid JSON object matching this schema: {json.dumps(json_schema)}"

            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                temperature=temperature,
                system=sys_prompt,
                messages=messages
            )

            text_content = response.content[0].text if response.content else ""
            elapsed = int((time.time() - start_time) * 1000)
            
            in_tokens = getattr(response.usage, "input_tokens", 0)
            out_tokens = getattr(response.usage, "output_tokens", 0)
            cost = (in_tokens * 0.000003) + (out_tokens * 0.000015)

            parsed_json = None
            if json_schema or "{" in text_content:
                try:
                    start_idx = text_content.find("{")
                    end_idx = text_content.rfind("}") + 1
                    if start_idx != -1 and end_idx > start_idx:
                        parsed_json = json.loads(text_content[start_idx:end_idx])
                except Exception as e:
                    logger.warning(f"Could not parse JSON from Claude response: {e}")

            return ModelResponse(
                content=text_content,
                raw_json=parsed_json,
                usage=UsageMetrics(input_tokens=in_tokens, output_tokens=out_tokens, estimated_cost=cost, latency_ms=elapsed),
                model=self.model,
                provider="Anthropic"
            )
        except Exception as e:
            logger.error(f"Claude API invocation error: {e}")
            elapsed = int((time.time() - start_time) * 1000)
            return ModelResponse(
                content=f"Error calling Claude API: {e}",
                usage=UsageMetrics(latency_ms=elapsed),
                model=self.model,
                provider="Anthropic",
                finish_reason="error"
            )
