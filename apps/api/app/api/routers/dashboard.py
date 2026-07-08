"""Dashboard aggregate stats."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.execution import WorkflowExecution
from app.models.user import User
from app.models.workflow import Workflow

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> dict:
    workflow_count = db.scalar(
        select(func.count(Workflow.id)).where(Workflow.user_id == user.id)
    )
    status_rows = db.execute(
        select(WorkflowExecution.status, func.count(WorkflowExecution.id))
        .where(WorkflowExecution.user_id == user.id)
        .group_by(WorkflowExecution.status)
    ).all()
    by_status = {status: count for status, count in status_rows}

    total_runs = sum(by_status.values())
    success = by_status.get("success", 0)

    return {
        "workflow_count": workflow_count or 0,
        "total_runs": total_runs,
        "successful_runs": success,
        "failed_runs": by_status.get("failed", 0),
        "pending_runs": by_status.get("pending", 0) + by_status.get("running", 0),
        "success_rate": round(success / total_runs * 100, 1) if total_runs else 0.0,
    }
