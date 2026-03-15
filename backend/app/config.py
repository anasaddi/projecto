from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "extra": "ignore"}

    database_url: str = "sqlite+aiosqlite:///./km_db.sqlite"
    redis_url: str = "redis://localhost:6379/0"
    environment: str = "development"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    admin_access_key: str = "change-me-in-env"
    secret_key: str = "your-secret-key-for-jwt" # Change in .env
    assemblyai_api_key: str = ""
    openrouter_api_key: str = ""

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
