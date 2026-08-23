from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/health")
def health_check():
    openai_status = "configured" if bool(settings.OPENAI_API_KEY) else "missing"
    gemini_status = "configured" if bool(settings.GEMINI_API_KEY) else "missing"

    return {
        "status": "healthy",
        "service": "SuprAI Core API",
        "engine": "Multi-Model Cloud Engine (OpenAI + Gemini)",
        "providers": {
            "openai": openai_status,
            "gemini": gemini_status
        },
        "role_routing": {
            "manager": f"openai ({settings.get_role_model('manager', 'openai')})",
            "consultant": f"gemini ({settings.get_role_model('consultant', 'gemini')})",
            "analyst": f"openai ({settings.get_role_model('analyst', 'openai')})",
            "researcher": f"gemini ({settings.get_role_model('researcher', 'gemini')})"
        }
    }
