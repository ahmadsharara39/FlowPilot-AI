"""Celery tasks for background workflow execution."""
from __future__ import annotations

from app.core.database import SessionLocal
from app.services.engine import run_execution
from app.workers.celery_app import celery_app


@celery_app.task(name="run_execution")
def run_execution_task(execution_id: int) -> dict:
    """Run a pending execution in a worker process."""
    db = SessionLocal()
    try:
        execution = run_execution(db, execution_id)
        return {"execution_id": execution.id, "status": execution.status}
    finally:
        db.close()
