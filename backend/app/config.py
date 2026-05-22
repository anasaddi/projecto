from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "extra": "ignore"}

    database_url: str = "sqlite+aiosqlite:///./km_db.sqlite"
    redis_url: str = "redis://localhost:6379/0"
    environment: str = "development"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://localhost:5174,https://projecto-indol.vercel.app,https://projecto-frontend.vercel.app"
    admin_access_key: str = "change-me-in-env"
    training_access_key: str = ""  # Se impostata, solo chi fa login con questa chiave vede Training (es. Flavio)
    secret_key: str = "your-secret-key-for-jwt"  # Change in .env
    assemblyai_api_key: str = ""
    openrouter_api_key: str = ""
    seed_on_start: bool = True  # prod: set SEED_ON_START=false after first deploy (faster cold start)
    shared_dashboards_enabled: bool = True  # SHARED_DASHBOARDS_ENABLED=false disables shared routes
    debug: bool = False  # DEBUG=true exposes tracebacks in API error responses

    # AI & Vector Search
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "km_chunks"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in ("production", "prod")

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("sqlite:///"):
            url = url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        return url

@lru_cache
def get_settings() -> Settings:
    return Settings()
