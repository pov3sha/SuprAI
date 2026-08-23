from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Protocol

@dataclass
class UsageMetrics:
    input_tokens: int = 0
    output_tokens: int = 0
    estimated_cost: float = 0.0
    latency_ms: int = 0

@dataclass
class ModelResponse:
    content: str
    raw_json: Optional[Dict[str, Any]] = None
    usage: UsageMetrics = field(default_factory=UsageMetrics)
    model: str = ""
    provider: str = ""
    finish_reason: str = "stop"

class AIProvider(Protocol):
    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.2
    ) -> ModelResponse: ...
