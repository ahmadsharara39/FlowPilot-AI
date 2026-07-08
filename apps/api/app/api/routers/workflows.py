"""Workflow + step CRUD and manual run routes."""
from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.workflow import Workflow, WorkflowStep
from app.schemas.execution import ExecutionDetail
from app.schemas.workflow import (
    RunRequest,
    StepCreate,
    StepOut,
    StepUpdate,
    WorkflowCreate,
    WorkflowOut,
    WorkflowSummary,
    WorkflowUpdate,
)
from app.services.dispatch import dispatch_execution

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


def _get_owned_workflow(db: Session, workflow_id: int, user: User) -> Workflow:
    wf = db.get(Workflow, workflow_id)
    if wf is None or wf.user_id != user.id:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


def _new_webhook_token() -> str:
    return secrets.token_urlsafe(24)


@router.get("", response_model=list[WorkflowSummary])
def list_workflows(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[WorkflowSummary]:
    workflows = db.scalars(
        select(Workflow).where(Workflow.user_id == user.id).order_by(Workflow.created_at.desc())
    ).all()
    return [
        WorkflowSummary(
            id=wf.id,
            name=wf.name,
            description=wf.description,
            trigger_type=wf.trigger_type,
            status=wf.status,
            webhook_token=wf.webhook_token,
            step_count=len(wf.steps),
            created_at=wf.created_at,
            updated_at=wf.updated_at,
        )
        for wf in workflows
    ]


@router.post("", response_model=WorkflowOut, status_code=status.HTTP_201_CREATED)
def create_workflow(
    payload: WorkflowCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Workflow:
    wf = Workflow(
        user_id=user.id,
        name=payload.name,
        description=payload.description,
        trigger_type=payload.trigger_type,
        status=payload.status,
        webhook_token=_new_webhook_token() if payload.trigger_type == "webhook" else None,
    )
    for idx, step in enumerate(payload.steps):
        wf.steps.append(
            WorkflowStep(
                step_type=step.step_type,
                name=step.name or step.step_type,
                config=step.config,
                step_order=step.step_order if step.step_order else idx,
            )
        )
    db.add(wf)
    db.commit()
    db.refresh(wf)
    return wf


@router.get("/{workflow_id}", response_model=WorkflowOut)
def get_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Workflow:
    return _get_owned_workflow(db, workflow_id, user)


@router.put("/{workflow_id}", response_model=WorkflowOut)
def update_workflow(
    workflow_id: int,
    payload: WorkflowUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Workflow:
    wf = _get_owned_workflow(db, workflow_id, user)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(wf, key, value)
    # Ensure webhook workflows always have a token; manual ones can keep theirs.
    if wf.trigger_type == "webhook" and not wf.webhook_token:
        wf.webhook_token = _new_webhook_token()
    db.commit()
    db.refresh(wf)
    return wf


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    wf = _get_owned_workflow(db, workflow_id, user)
    db.delete(wf)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{workflow_id}/regenerate-webhook", response_model=WorkflowOut)
def regenerate_webhook(
    workflow_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Workflow:
    wf = _get_owned_workflow(db, workflow_id, user)
    wf.webhook_token = _new_webhook_token()
    if wf.trigger_type != "webhook":
        wf.trigger_type = "webhook"
    db.commit()
    db.refresh(wf)
    return wf


# --------------------------------------------------------------------------- #
# Steps
# --------------------------------------------------------------------------- #
@router.post("/{workflow_id}/steps", response_model=StepOut, status_code=201)
def add_step(
    workflow_id: int,
    payload: StepCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> WorkflowStep:
    wf = _get_owned_workflow(db, workflow_id, user)
    order = payload.step_order if payload.step_order else len(wf.steps)
    step = WorkflowStep(
        workflow_id=wf.id,
        step_type=payload.step_type,
        name=payload.name or payload.step_type,
        config=payload.config,
        step_order=order,
    )
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


@router.put("/{workflow_id}/steps/{step_id}", response_model=StepOut)
def update_step(
    workflow_id: int,
    step_id: int,
    payload: StepUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> WorkflowStep:
    wf = _get_owned_workflow(db, workflow_id, user)
    step = db.get(WorkflowStep, step_id)
    if step is None or step.workflow_id != wf.id:
        raise HTTPException(status_code=404, detail="Step not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(step, key, value)
    db.commit()
    db.refresh(step)
    return step


@router.delete("/{workflow_id}/steps/{step_id}", status_code=204, response_class=Response)
def delete_step(
    workflow_id: int,
    step_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    wf = _get_owned_workflow(db, workflow_id, user)
    step = db.get(WorkflowStep, step_id)
    if step is None or step.workflow_id != wf.id:
        raise HTTPException(status_code=404, detail="Step not found")
    db.delete(step)
    db.commit()
    return Response(status_code=204)


# --------------------------------------------------------------------------- #
# Manual run
# --------------------------------------------------------------------------- #
@router.post("/{workflow_id}/run", response_model=ExecutionDetail)
def run_workflow(
    workflow_id: int,
    payload: RunRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ExecutionDetail:
    wf = _get_owned_workflow(db, workflow_id, user)
    if not wf.steps:
        raise HTTPException(status_code=400, detail="Workflow has no steps to run")
    execution = dispatch_execution(db, wf, payload.input, trigger_source="manual")
    detail = ExecutionDetail.model_validate(execution)
    detail.workflow_name = wf.name
    return detail
