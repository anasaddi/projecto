from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "extra": "ignore"}

    database_url: str = "postgresql://km:km_secret@localhost:5432/km_db"
    redis_url: str = "redis://localhost:6379/0"
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "km_insights"
    environment: str = "development"
    log_level: str = "INFO"
    embedding_model: str = "all-MiniLM-L6-v2"
    # API keys per Transcript / LLM (prod: obbligatorie in .env)
    assemblyai_api_key: str = ""
    openrouter_api_key: str = ""
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"


    @property
    def sqlalchemy_database_url(self) -> str:
        # Railway fornisce spesso 'postgres://', ma SQLAlchemy vuole 'postgresql://'
        if self.database_url.startswith("postgres://"):
            return self.database_url.replace("postgres://", "postgresql://", 1)
        return self.database_url

@lru_cache
def get_settings() -> Settings:
    return Settings()
