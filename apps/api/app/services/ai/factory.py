"""AI provider factory.

Chooses a provider based on settings, and transparently falls back to the
deterministic mock provider when the requested provider has no API key. This
keeps the whole app demoable without paid keys.
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

    if provider == "openai" and settings.openai_api_key:
        try:
            from app.services.ai.openai_provider import OpenAIProvider

            return OpenAIProvider(api_key=settings.openai_api_key, model=model)
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("OpenAI provider init failed (%s); using mock AI.", exc)

    if provider == "anthropic" and settings.anthropic_api_key:
        try:
            from app.services.ai.anthropic_provider import AnthropicProvider

            return AnthropicProvider(api_key=settings.anthropic_api_key, model=model)
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Anthropic provider init failed (%s); using mock AI.", exc)

    if provider not in ("mock", "openai", "anthropic"):
        logger.warning("Unknown AI_PROVIDER '%s'; using mock AI.", provider)
    elif provider != "mock":
        logger.info("No API key for '%s'; using deterministic mock AI.", provider)

    return MockAIProvider(model=model or "mock-1")
