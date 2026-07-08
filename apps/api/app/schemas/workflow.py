"""Workflow & step schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

TriggerType = Literal["manual", "webhook"]
StepType = Literal[
    "ai_summarize",
    "ai_classify",
    "ai_extract_json",
    "http_request",
    "slack_webhook_mock",
    "save_result",
]


class StepBase(BaseModel):
    step_type: StepType
    name: str = Field(default="", max_length=200)
    config: dict[str, Any] = Field(default_factory=dict)
    step_order: int = 0


class StepCreate(StepBase):
    pass


class StepUpdate(BaseModel):
    step_type: StepType | None = None
    name: str | None = None
    config: dict[str, Any] | None = None
    step_order: int | None = None


class StepOut(StepBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workflow_id: int
    created_at: datetime


class WorkflowBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    trigger_type: TriggerType = "manual"
    status: Literal["active", "paused"] = "active"


class WorkflowCreate(WorkflowBase):
    steps: list[StepCreate] = Field(default_factory=list)


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    trigger_type: TriggerType | None = None
    status: Literal["active", "paused"] | None = None


class WorkflowOut(WorkflowBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    webhook_token: str | None = None
    created_at: datetime
    updated_at: datetime
    steps: list[StepOut] = Field(default_factory=list)


class WorkflowSummary(BaseModel):
    """Lightweight workflow listing item with run counts."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    trigger_type: TriggerType
    status: str
    webhook_token: str | None = None
    step_count: int = 0
    created_at: datetime
    updated_at: datetime


class RunRequest(BaseModel):
    """Manual run input. Accepts arbitrary JSON payload or raw text."""

    input: dict[str, Any] | str | None = None
