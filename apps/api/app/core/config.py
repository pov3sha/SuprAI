import os
from pydantic_settings import BaseSettings

class ConfigurationError(Exception):
    pass

class Settings(BaseSettings):
    PROJECT_NAME: str = "SuprAI Core API"
    VERSION: str = "0.1.0"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://suprai_user:suprai_pass@postgres:5432/suprai_db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "minio:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "suprai-documents")
    MINIO_USE_SSL: bool = os.getenv("MINIO_USE_SSL", "false").lower() == "true"
    
    # Provider API Credentials (auto-strip whitespace)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    
    # Default Provider Handoff
    AI_DEFAULT_PROVIDER: str = os.getenv("AI_DEFAULT_PROVIDER", "openai")
    
    # Role Provider Routing
    MANAGER_PROVIDER: str = os.getenv("MANAGER_PROVIDER", "openai")
    CONSULTANT_PROVIDER: str = os.getenv("CONSULTANT_PROVIDER", "gemini")
    ANALYST_PROVIDER: str = os.getenv("ANALYST_PROVIDER", "openai")
    RESEARCHER_PROVIDER: str = os.getenv("RESEARCHER_PROVIDER", "gemini")
    
    # OpenAI Configurable Models
    OPENAI_MANAGER_MODEL: str = os.getenv("OPENAI_MANAGER_MODEL", "gpt-4o-mini")
    OPENAI_CONSULTANT_MODEL: str = os.getenv("OPENAI_CONSULTANT_MODEL", "gpt-4o-mini")
    OPENAI_ANALYST_MODEL: str = os.getenv("OPENAI_ANALYST_MODEL", "gpt-4o-mini")
    OPENAI_RESEARCHER_MODEL: str = os.getenv("OPENAI_RESEARCHER_MODEL", "gpt-4o-mini")
    
    # Gemini Configurable Models
    GEMINI_MANAGER_MODEL: str = os.getenv("GEMINI_MANAGER_MODEL", "gemini-1.5-flash")
    GEMINI_CONSULTANT_MODEL: str = os.getenv("GEMINI_CONSULTANT_MODEL", "gemini-1.5-flash")
    GEMINI_ANALYST_MODEL: str = os.getenv("GEMINI_ANALYST_MODEL", "gemini-1.5-flash")
    GEMINI_RESEARCHER_MODEL: str = os.getenv("GEMINI_RESEARCHER_MODEL", "gemini-1.5-flash")
    
    # Ollama Configurable Models
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
    OLLAMA_DEFAULT_MODEL: str = os.getenv("OLLAMA_DEFAULT_MODEL", "qwen2.5:0.5b")
    OLLAMA_MANAGER_MODEL: str = os.getenv("OLLAMA_MANAGER_MODEL", "")
    OLLAMA_CONSULTANT_MODEL: str = os.getenv("OLLAMA_CONSULTANT_MODEL", "")
    OLLAMA_ANALYST_MODEL: str = os.getenv("OLLAMA_ANALYST_MODEL", "")
    OLLAMA_RESEARCHER_MODEL: str = os.getenv("OLLAMA_RESEARCHER_MODEL", "")
    
    DEFAULT_ORG_ID: str = os.getenv("DEFAULT_ORG_ID", "default-org-uuid")
    DEFAULT_PROJECT_ID: str = os.getenv("DEFAULT_PROJECT_ID", "default-project-uuid")

    class Config:
        case_sensitive = True

    def get_role_provider(self, role_name: str) -> str:
        r = role_name.lower()
        provider = None
        if "manager" in r:
            provider = self.MANAGER_PROVIDER
        elif "consultant" in r:
            provider = self.CONSULTANT_PROVIDER
        elif "analyst" in r:
            provider = self.ANALYST_PROVIDER
        elif "researcher" in r:
            provider = self.RESEARCHER_PROVIDER

        return (provider or self.AI_DEFAULT_PROVIDER or "openai").lower()

    def get_role_model(self, role_name: str, provider_name: str) -> str:
        r = role_name.lower()
        p = provider_name.lower()

        if "openai" in p:
            if "manager" in r: return self.OPENAI_MANAGER_MODEL or "gpt-4o-mini"
            if "consultant" in r: return self.OPENAI_CONSULTANT_MODEL or "gpt-4o-mini"
            if "analyst" in r: return self.OPENAI_ANALYST_MODEL or "gpt-4o-mini"
            if "researcher" in r: return self.OPENAI_RESEARCHER_MODEL or "gpt-4o-mini"
            return "gpt-4o-mini"
        elif "gemini" in p:
            if "manager" in r: return self.GEMINI_MANAGER_MODEL or "gemini-1.5-flash"
            if "consultant" in r: return self.GEMINI_CONSULTANT_MODEL or "gemini-1.5-flash"
            if "analyst" in r: return self.GEMINI_ANALYST_MODEL or "gemini-1.5-flash"
            if "researcher" in r: return self.GEMINI_RESEARCHER_MODEL or "gemini-1.5-flash"
            return "gemini-1.5-flash"
        elif "ollama" in p:
            role_model = None
            if "manager" in r: role_model = self.OLLAMA_MANAGER_MODEL
            elif "consultant" in r: role_model = self.OLLAMA_CONSULTANT_MODEL
            elif "analyst" in r: role_model = self.OLLAMA_ANALYST_MODEL
            elif "researcher" in r: role_model = self.OLLAMA_RESEARCHER_MODEL
            return (role_model or self.OLLAMA_DEFAULT_MODEL or "qwen2.5:0.5b").strip()

        return "gpt-4o-mini"

settings = Settings()
