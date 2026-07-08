"""Execution & step log schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class StepLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    step_id: int | None
    step_type: str
    step_name: str
    status: str
    input_snapshot: Any | None = None
    output_snapshot: Any | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None


class ExecutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workflow_id: int
    user_id: int
    status: str
    trigger_source: str
    input_payload: Any | None = None
    output_payload: Any | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    created_at: datetime


class ExecutionDetail(ExecutionOut):
    workflow_name: str = ""
    step_logs: list[StepLogOut] = []


class ExecutionListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workflow_id: int
    workflow_name: str = ""
    status: str
    trigger_source: str
    created_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
