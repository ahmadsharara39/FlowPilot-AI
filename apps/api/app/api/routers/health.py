"""Health & metadata routes."""
from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings
from app.services.ai.factory import get_ai_provider
from app.services.engine.handlers import registered_step_types

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health() -> dict:
    provider = get_ai_provider()
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.environment,
        "execution_mode": settings.execution_mode,
        "ai_provider": provider.name,
        "ai_is_mock": provider.is_mock,
        "step_types": registered_step_types(),
    }
