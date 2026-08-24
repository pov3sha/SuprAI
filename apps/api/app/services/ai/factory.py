from typing import Optional
from loguru import logger
from app.core.config import settings
from app.services.ai.ollama_provider import OllamaProvider

def get_ai_provider(role_name: str = "manager", provider_name: Optional[str] = None, model_name: Optional[str] = None):
    """
    Factory function dynamically resolving Ollama Provider for all organization roles.
    """
    model = model_name or settings.get_role_model(role_name, "ollama")
    logger.info(f"AI_FACTORY resolving role='{role_name}' -> Ollama ({model})")
    return OllamaProvider(role_name=role_name, model_name=model)
