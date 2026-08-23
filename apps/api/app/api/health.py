from fastapi import APIRouter
from app.core.config import settings
from app.services.ai.ollama_provider import verify_configured_models

router = APIRouter()

@router.get("/health")
def health_check():
    openai_status = "configured" if bool(settings.OPENAI_API_KEY) else "missing"
    gemini_status = "configured" if bool(settings.GEMINI_API_KEY) else "missing"

    ollama_info = {}
    try:
        ollama_info = verify_configured_models()
    except Exception as e:
        ollama_info = {"status": "unavailable", "error": str(e)}

    return {
        "status": "healthy",
        "service": "SuprAI Core API",
        "providers": {
            "openai": openai_status,
            "gemini": gemini_status,
            "ollama": ollama_info.get("status", "unavailable")
        },
        "role_routing": {
            "manager": f"{settings.MANAGER_PROVIDER} ({settings.get_role_model('manager', settings.MANAGER_PROVIDER)})",
            "consultant": f"{settings.CONSULTANT_PROVIDER} ({settings.get_role_model('consultant', settings.CONSULTANT_PROVIDER)})",
            "analyst": f"{settings.ANALYST_PROVIDER} ({settings.get_role_model('analyst', settings.ANALYST_PROVIDER)})",
            "researcher": f"{settings.RESEARCHER_PROVIDER} ({settings.get_role_model('researcher', settings.RESEARCHER_PROVIDER)})"
        }
    }
