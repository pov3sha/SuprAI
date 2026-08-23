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

    def get_role_model(self, role_name: str) -> str:
        r = role_name.lower()
        role_model = None
        if "manager" in r:
            role_model = self.OLLAMA_MANAGER_MODEL
        elif "consultant" in r:
            role_model = self.OLLAMA_CONSULTANT_MODEL
        elif "analyst" in r:
            role_model = self.OLLAMA_ANALYST_MODEL
        elif "researcher" in r:
            role_model = self.OLLAMA_RESEARCHER_MODEL

        resolved = role_model or self.OLLAMA_DEFAULT_MODEL
        if not resolved or not resolved.strip():
            raise ConfigurationError(f"OLLAMA_{role_name.upper()}_MODEL is not configured.")
        return resolved.strip()

settings = Settings()
