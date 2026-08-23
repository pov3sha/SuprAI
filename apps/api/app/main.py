import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api import health, projects, files, objectives, events, conversations
from app.db.base import Base, engine
from app.core.config import settings

app = FastAPI(
    title="SuprAI Engine API",
    version="0.1.0",
    description="Autonomous AI Work Organization Engine API"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenTelemetry Instrumentation (Safe)
try:
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    FastAPIInstrumentor.instrument_app(app)
except Exception as e:
    logger.warning(f"OpenTelemetry instrumentation warning: {e}")

# Register API Routers
app.include_router(health.router)
app.include_router(projects.router)
app.include_router(files.router)
app.include_router(objectives.router)
app.include_router(events.router)
app.include_router(conversations.router)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

@app.get("/health/ollama", tags=["Health"])
def check_ollama_health():
    """
    Checks if Ollama service is reachable and returns connected status & configured model.
    """
    try:
        with httpx.Client(timeout=3.0) as client:
            res = client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if res.status_code == 200:
                models = [m.get("name") for m in res.json().get("models", [])]
                return {
                    "status": "connected",
                    "base_url": settings.OLLAMA_BASE_URL,
                    "default_model": settings.MANAGER_MODEL,
                    "available_models": models
                }
    except Exception as e:
        logger.warning(f"Ollama connection check failed: {e}")
    
    return {
        "status": "disconnected",
        "base_url": settings.OLLAMA_BASE_URL,
        "default_model": settings.MANAGER_MODEL,
        "available_models": []
    }

@app.get("/")
def root():
    return {"app": "SuprAI", "status": "running", "engine": "Ollama Local"}
