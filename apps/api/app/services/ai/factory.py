from typing import Optional
from loguru import logger
from app.core.config import settings, ConfigurationError
from app.services.ai.openai_provider import OpenAIProvider
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.ollama_provider import OllamaProvider

def get_ai_provider(role_name: str = "manager", provider_name: Optional[str] = None, model_name: Optional[str] = None):
    """
    Factory function dynamically resolving provider and model for a given role (Manager, Consultant, Analyst, Researcher).
    """
    selected_provider = (provider_name or settings.get_role_provider(role_name)).lower()

    logger.info(f"AI_FACTORY resolving role='{role_name}' -> provider='{selected_provider}'")

    if "openai" in selected_provider:
        if not settings.OPENAI_API_KEY:
            logger.warning(f"OPENAI_API_KEY missing for role {role_name}, falling back to AI_DEFAULT_PROVIDER")
            if settings.GEMINI_API_KEY:
                return GeminiProvider(role_name=role_name, model_name=model_name)
            raise ConfigurationError("OPENAI_API_KEY is not configured.")
        return OpenAIProvider(role_name=role_name, model_name=model_name)

    elif "gemini" in selected_provider:
        if not settings.GEMINI_API_KEY:
            logger.warning(f"GEMINI_API_KEY missing for role {role_name}, falling back to OpenAI")
            if settings.OPENAI_API_KEY:
                return OpenAIProvider(role_name=role_name, model_name=model_name)
            raise ConfigurationError("GEMINI_API_KEY is not configured.")
        return GeminiProvider(role_name=role_name, model_name=model_name)

    elif "ollama" in selected_provider:
        return OllamaProvider(role_name=role_name, model_name=model_name)

    else:
        # Fallback based on available API keys
        if settings.OPENAI_API_KEY:
            return OpenAIProvider(role_name=role_name, model_name=model_name)
        elif settings.GEMINI_API_KEY:
            return GeminiProvider(role_name=role_name, model_name=model_name)
        else:
            return OllamaProvider(role_name=role_name, model_name=model_name)
