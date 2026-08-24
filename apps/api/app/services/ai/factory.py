from typing import Optional
from loguru import logger
from app.core.config import settings, ConfigurationError
from app.services.ai.ollama_provider import OllamaProvider
from app.services.ai.openai_provider import OpenAIProvider
from app.services.ai.gemini_provider import GeminiProvider

def get_ai_provider(role_name: str = "manager", provider_name: Optional[str] = None, model_name: Optional[str] = None):
    """
    Factory function resolving provider dynamically (Ollama / Gemini / OpenAI).
    """
    selected_provider = (provider_name or settings.get_role_provider(role_name)).lower()
    logger.info(f"AI_FACTORY resolving role='{role_name}' -> provider='{selected_provider}'")

    if "gemini" in selected_provider:
        if not settings.GEMINI_API_KEY:
            logger.warning(f"GEMINI_API_KEY missing for role {role_name}, routing to Ollama local engine.")
            return OllamaProvider(role_name=role_name, model_name=model_name)
        return GeminiProvider(role_name=role_name, model_name=model_name)
    elif "openai" in selected_provider:
        if not settings.OPENAI_API_KEY:
            logger.warning(f"OPENAI_API_KEY missing for role {role_name}, routing to Ollama local engine.")
            return OllamaProvider(role_name=role_name, model_name=model_name)
        return OpenAIProvider(role_name=role_name, model_name=model_name)
    else:
        return OllamaProvider(role_name=role_name, model_name=model_name)
