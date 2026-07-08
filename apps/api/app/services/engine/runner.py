"""Workflow execution orchestrator.

Loads a workflow's steps, runs them in order, passes each step's output to the
next, and records a full audit trail (execution status + per-step logs). If a
step fails, the execution is marked failed, the error is stored, and remaining
steps are skipped.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.execution import WorkflowExecution, WorkflowStepLog
from app.models.workflow import Workflow, WorkflowStep
from app.services.engine.context import StepError
from app.services.engine.handlers import get_handler

logger = logging.getLogger("flowpilot.engine")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _snapshot(value: Any) -> Any:
    """Wrap non-dict values so JSON columns always store an object."""
    if value is None or isinstance(value, (dict, list)):
        return value
    return {"value": value}


def create_and_run(
    db: Session,
    workflow: Workflow,
    input_payload: Any,
    trigger_source: str = "manual",
) -> WorkflowExecution:
    """Create a pending execution then run it. Returns the finished execution."""
    execution = WorkflowExecution(
        workflow_id=workflow.id,
        user_id=workflow.user_id,
        status="pending",
        trigger_source=trigger_source,
        input_payload=_snapshot(input_payload),
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    return run_execution(db, execution.id)


def run_execution(db: Session, execution_id: int) -> WorkflowExecution:
    """Run a previously-created execution by id."""
    execution = db.get(WorkflowExecution, execution_id)
    if execution is None:
        raise ValueError(f"Execution {execution_id} not found")

    steps = list(
        db.scalars(
            select(WorkflowStep)
            .where(WorkflowStep.workflow_id == execution.workflow_id)
            .order_by(WorkflowStep.step_order, WorkflowStep.id)
        )
    )

    execution.status = "running"
    execution.started_at = _utcnow()
    db.commit()

    data: Any = execution.input_payload
    step_outputs: list[dict] = []

    try:
        for step in steps:
            log = WorkflowStepLog(
                execution_id=execution.id,
                step_id=step.id,
                step_type=step.step_type,
                step_name=step.name or step.step_type,
                status="running",
                input_snapshot=_snapshot(data),
                started_at=_utcnow(),
            )
            db.add(log)
            db.commit()

            try:
                handler = get_handler(step.step_type)
                output = handler(step.config or {}, data)
            except StepError as exc:
                _fail_step(db, log, str(exc))
                raise
            except Exception as exc:  # unexpected handler error
                logger.exception("Step %s crashed", step.id)
                _fail_step(db, log, f"Unexpected error: {exc}")
                raise StepError(str(exc)) from exc

            log.status = "success"
            log.output_snapshot = _snapshot(output)
            log.finished_at = _utcnow()
            db.commit()

            step_outputs.append({"step": step.name or step.step_type, "output": output})
            data = output  # pass forward to the next step

        execution.status = "success"
        execution.output_payload = {
            "final": _snapshot(data),
            "steps": step_outputs,
        }
    except StepError as exc:
        execution.status = "failed"
        execution.error_message = str(exc)
        execution.output_payload = {"partial_steps": step_outputs, "error": str(exc)}
    finally:
        execution.finished_at = _utcnow()
        db.commit()
        db.refresh(execution)

    return execution


def _fail_step(db: Session, log: WorkflowStepLog, message: str) -> None:
    log.status = "failed"
    log.error_message = message
    log.finished_at = _utcnow()
    db.commit()
