from fastapi import APIRouter
from app.services.ai.ollama_provider import verify_configured_models

router = APIRouter()

@router.get("/health")
def health_check():
    ollama_info = {}
    try:
        ollama_info = verify_configured_models()
    except Exception as e:
        ollama_info = {"status": "error", "error": str(e)}

    return {
        "status": "healthy",
        "service": "SuprAI Core API",
        "ollama_diagnostics": ollama_info
    }
