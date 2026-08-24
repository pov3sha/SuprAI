from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SuprAI Core API",
        "engine": "Ollama Engine",
        "providers": {
            "ollama": "verified",
            "model": settings.OLLAMA_DEFAULT_MODEL
        },
        "role_routing": {
            "manager": f"ollama ({settings.get_role_model('manager', 'ollama')})",
            "consultant": f"ollama ({settings.get_role_model('consultant', 'ollama')})",
            "analyst": f"ollama ({settings.get_role_model('analyst', 'ollama')})",
            "researcher": f"ollama ({settings.get_role_model('researcher', 'ollama')})"
        }
    }
