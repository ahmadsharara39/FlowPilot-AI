"""AI provider factory.

FlowPilot uses OpenRouter as its single external LLM backend and transparently
falls back to the deterministic mock provider when no key is configured — so the
whole app stays demoable without any paid keys.
"""
from __future__ import annotations

import logging

from app.core.config import settings
from app.services.ai.base import AIProvider
from app.services.ai.mock_provider import MockAIProvider

logger = logging.getLogger("flowpilot.ai")


def get_ai_provider() -> AIProvider:
    provider = (settings.ai_provider or "mock").lower()
    model = settings.ai_model or ""

    if provider == "openrouter" and settings.openrouter_api_key:
        try:
            from app.services.ai.openrouter_provider import OpenRouterProvider

            return OpenRouterProvider(api_key=settings.openrouter_api_key, model=model)
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("OpenRouter provider init failed (%s); using mock AI.", exc)

    if provider not in ("mock", "openrouter"):
        logger.warning("Unknown AI_PROVIDER '%s'; using mock AI.", provider)
    elif provider == "openrouter":
        logger.info("No OPENROUTER_API_KEY set; using deterministic mock AI.")

    return MockAIProvider(model=model or "mock-1")
