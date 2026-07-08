"""Execution dispatch: run inline or enqueue to Celery based on config."""
from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.execution import WorkflowExecution
from app.models.workflow import Workflow
from app.services.engine import create_and_run

logger = logging.getLogger("flowpilot.dispatch")


def dispatch_execution(
    db: Session, workflow: Workflow, input_payload, trigger_source: str = "manual"
) -> WorkflowExecution:
    """Create an execution and either run it inline or hand it to a worker.

    In ``celery`` mode we create a pending execution, enqueue the task, and
    return immediately (status stays ``pending`` until the worker picks it up).
    In ``inline`` mode (default) we run it synchronously so the app is fully
    functional without a running worker.
    """
    if settings.execution_mode == "celery":
        execution = WorkflowExecution(
            workflow_id=workflow.id,
            user_id=workflow.user_id,
            status="pending",
            trigger_source=trigger_source,
            input_payload=input_payload if isinstance(input_payload, (dict, list)) else {"value": input_payload},
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)
        try:
            from app.workers.tasks import run_execution_task

            run_execution_task.delay(execution.id)
        except Exception as exc:  # pragma: no cover - worker/broker not available
            logger.warning("Celery enqueue failed (%s); running inline instead.", exc)
            from app.services.engine import run_execution

            return run_execution(db, execution.id)
        return execution

    return create_and_run(db, workflow, input_payload, trigger_source=trigger_source)
