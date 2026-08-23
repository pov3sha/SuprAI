from typing import Optional
from loguru import logger
from app.core.config import settings, ConfigurationError
from app.services.ai.gemini_provider import GeminiProvider

def get_ai_provider(role_name: str = "manager", provider_name: Optional[str] = None, model_name: Optional[str] = None):
    """
    Factory function dynamically resolving Gemini Provider for all organization roles.
    """
    model = model_name or settings.get_role_model(role_name, "gemini")
    logger.info(f"AI_FACTORY resolving role='{role_name}' -> Gemini ({model})")
    
    if not settings.GEMINI_API_KEY:
        raise ConfigurationError("GEMINI_API_KEY is not configured.")
        
    return GeminiProvider(role_name=role_name, model_name=model)
