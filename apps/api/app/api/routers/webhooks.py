"""Public webhook trigger route (no auth — validated by unguessable token)."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.workflow import Workflow
from app.services.dispatch import dispatch_execution

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/{token}")
async def trigger_webhook(
    token: str, request: Request, db: Session = Depends(get_db)
) -> dict[str, Any]:
    workflow = db.scalar(select(Workflow).where(Workflow.webhook_token == token))
    if workflow is None or workflow.trigger_type != "webhook":
        raise HTTPException(status_code=404, detail="Webhook not found")
    if workflow.status != "active":
        raise HTTPException(status_code=409, detail="Workflow is paused")

    try:
        payload: Any = await request.json()
    except Exception:
        raw = (await request.body()).decode("utf-8", errors="replace")
        payload = {"raw": raw} if raw else {}

    execution = dispatch_execution(db, workflow, payload, trigger_source="webhook")
    return {
        "execution_id": execution.id,
        "status": execution.status,
        "workflow_id": workflow.id,
    }
