"""Application configuration using Pydantic Settings."""
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv
import os
load_dotenv(override=True)

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "Agentic AI Drug Discovery Platform"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "sqlite:///./data/app.db"

    # Security
    secret_key: str = "dev-secret-key-change-in-production"

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:8081,http://localhost:19006"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # LLM Configuration
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    anthropic_api_key: str = ""
    llm_provider: str = "openai"  # or "anthropic"
    llm_model: str = "gpt-4o"

    # Qdrant Vector Database
    qdrant_host: str = os.getenv("QDRANT_HOST", "localhost")
    qdrant_port: int = int(os.getenv("QDRANT_PORT", "6333"))
    qdrant_collection: str = "company_documents"

    # SerpAPI for Google Patents
    serpapi_key: str = os.getenv("SERPAPI_KEY", "")

    # Tavily for web search
    tavily_api_key: str = os.getenv("TAVILY_API_KEY", "")

    # Document Processing
    max_file_size_mb: int = 50
    chunk_size: int = 500
    chunk_overlap: int = 50

    # Job Configuration
    job_polling_interval: int = 2  # seconds
    job_timeout: int = 300  # 5 minutes

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()


settings = get_settings()
