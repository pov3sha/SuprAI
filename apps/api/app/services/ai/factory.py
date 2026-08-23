from typing import Optional
from loguru import logger
from app.core.config import settings, ConfigurationError
from app.services.ai.openai_provider import OpenAIProvider
from app.services.ai.gemini_provider import GeminiProvider

def get_ai_provider(role_name: str = "manager", provider_name: Optional[str] = None, model_name: Optional[str] = None):
    """
    Factory function dynamically resolving OpenAI (GPT) and Gemini providers per role.
    """
    selected_provider = (provider_name or settings.get_role_provider(role_name)).lower()
    logger.info(f"AI_FACTORY resolving role='{role_name}' -> provider='{selected_provider}'")

    if "gemini" in selected_provider:
        if not settings.GEMINI_API_KEY:
            raise ConfigurationError("GEMINI_API_KEY is not configured.")
        return GeminiProvider(role_name=role_name, model_name=model_name)
    else:
        # Default to OpenAI (GPT)
        if not settings.OPENAI_API_KEY:
            raise ConfigurationError("OPENAI_API_KEY is not configured.")
        return OpenAIProvider(role_name=role_name, model_name=model_name)
