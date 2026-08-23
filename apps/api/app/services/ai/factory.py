from typing import Optional
from app.core.config import settings
from app.services.ai.base import AIProvider
from app.services.ai.claude import ClaudeProvider
from app.services.ai.openai_provider import OpenAIProvider
from app.services.ai.gemini import GeminiProvider
from app.services.ai.ollama_provider import OllamaProvider

def get_ai_provider(provider_name: str, model_name: Optional[str] = None) -> AIProvider:
    name_lower = provider_name.lower()
    
    if "ollama" in name_lower or "local" in name_lower or settings.OLLAMA_BASE_URL:
        return OllamaProvider(model_name=model_name or settings.MANAGER_MODEL)
    elif "claude" in name_lower or "anthropic" in name_lower:
        return ClaudeProvider(model_name=model_name)
    elif "openai" in name_lower or "gpt" in name_lower:
        return OpenAIProvider(model_name=model_name)
    elif "gemini" in name_lower or "google" in name_lower:
        return GeminiProvider(model_name=model_name)
    else:
        return OllamaProvider(model_name=model_name or settings.MANAGER_MODEL)
