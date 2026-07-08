"""Execution history routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.execution import WorkflowExecution
from app.models.user import User
from app.models.workflow import Workflow
from app.schemas.execution import ExecutionDetail, ExecutionListItem

router = APIRouter(prefix="/api/executions", tags=["executions"])


@router.get("", response_model=list[ExecutionListItem])
def list_executions(
    workflow_id: int | None = Query(default=None),
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ExecutionListItem]:
    stmt = (
        select(WorkflowExecution, Workflow.name)
        .join(Workflow, Workflow.id == WorkflowExecution.workflow_id)
        .where(WorkflowExecution.user_id == user.id)
        .order_by(WorkflowExecution.created_at.desc())
        .limit(limit)
    )
    if workflow_id is not None:
        stmt = stmt.where(WorkflowExecution.workflow_id == workflow_id)

    rows = db.execute(stmt).all()
    return [
        ExecutionListItem(
            id=ex.id,
            workflow_id=ex.workflow_id,
            workflow_name=name,
            status=ex.status,
            trigger_source=ex.trigger_source,
            created_at=ex.created_at,
            started_at=ex.started_at,
            finished_at=ex.finished_at,
        )
        for ex, name in rows
    ]


@router.get("/{execution_id}", response_model=ExecutionDetail)
def get_execution(
    execution_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ExecutionDetail:
    execution = db.get(WorkflowExecution, execution_id)
    if execution is None or execution.user_id != user.id:
        raise HTTPException(status_code=404, detail="Execution not found")
    detail = ExecutionDetail.model_validate(execution)
    detail.workflow_name = execution.workflow.name if execution.workflow else ""
    return detail
