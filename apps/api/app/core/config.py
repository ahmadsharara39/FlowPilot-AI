"""Application configuration loaded from environment variables."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings object. Values come from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Core
    app_name: str = "FlowPilot AI"
    environment: str = "development"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Security
    secret_key: str = "change-me-in-production-please-use-a-long-random-string"
    access_token_expire_minutes: int = 1440
    jwt_algorithm: str = "HS256"

    # Database
    database_url: str = "sqlite:///./flowpilot.db"

    # Redis / background jobs
    redis_url: str = "redis://localhost:6379/0"
    execution_mode: str = "inline"  # inline | celery

    # AI provider
    ai_provider: str = "mock"  # openai | anthropic | openrouter | mock
    ai_model: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    openrouter_api_key: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        # Normalize: trim whitespace and strip trailing slashes so a value like
        # "https://app.vercel.app/" still matches the browser Origin header
        # "https://app.vercel.app" (a very common misconfiguration).
        origins = []
        for origin in self.cors_origins.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned:
                origins.append(cleaned)
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
