"""AI provider package. Public entrypoint is `get_ai_provider`."""
from app.services.ai.base import AIProvider, AIResult
from app.services.ai.factory import get_ai_provider

__all__ = ["AIProvider", "AIResult", "get_ai_provider"]
