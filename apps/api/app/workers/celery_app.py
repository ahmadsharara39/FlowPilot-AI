"""Celery application (used when EXECUTION_MODE=celery)."""
from __future__ import annotations

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "flowpilot",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    timezone="UTC",
)
