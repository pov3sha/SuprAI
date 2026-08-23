from fastapi import APIRouter
from app.core.config import settings
from app.services.ai.ollama_provider import verify_configured_models

router = APIRouter()

@router.get("/health")
def health_check():
    ollama_info = {}
    try:
        ollama_info = verify_configured_models()
    except Exception as e:
        ollama_info = {"status": "unavailable", "error": str(e)}

    return {
        "status": "healthy",
        "service": "SuprAI Core API",
        "engine": "Ollama Engine",
        "providers": {
            "ollama": ollama_info.get("status", "unavailable"),
            "model": settings.OLLAMA_DEFAULT_MODEL
        },
        "role_routing": {
            "manager": f"ollama ({settings.get_role_model('manager', 'ollama')})",
            "consultant": f"ollama ({settings.get_role_model('consultant', 'ollama')})",
            "analyst": f"ollama ({settings.get_role_model('analyst', 'ollama')})",
            "researcher": f"ollama ({settings.get_role_model('researcher', 'ollama')})"
        }
    }
