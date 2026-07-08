"""Workflow execution and step log models."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id: Mapped[int] = mapped_column(primary_key=True)
    workflow_id: Mapped[int] = mapped_column(
        ForeignKey("workflows.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending"
    )  # pending | running | success | failed
    trigger_source: Mapped[str] = mapped_column(String(20), default="manual")  # manual | webhook
    input_payload: Mapped[dict | None] = mapped_column(JSON, default=dict)
    output_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    workflow: Mapped["Workflow"] = relationship(back_populates="executions")  # noqa: F821
    user: Mapped["User"] = relationship(back_populates="executions")  # noqa: F821
    step_logs: Mapped[list["WorkflowStepLog"]] = relationship(
        back_populates="execution",
        cascade="all, delete-orphan",
        order_by="WorkflowStepLog.id",
    )


class WorkflowStepLog(Base):
    __tablename__ = "workflow_step_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    execution_id: Mapped[int] = mapped_column(
        ForeignKey("workflow_executions.id", ondelete="CASCADE"), index=True
    )
    step_id: Mapped[int | None] = mapped_column(
        ForeignKey("workflow_steps.id", ondelete="SET NULL"), nullable=True
    )
    step_type: Mapped[str] = mapped_column(String(40), default="")
    step_name: Mapped[str] = mapped_column(String(200), default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    input_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    output_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    execution: Mapped["WorkflowExecution"] = relationship(back_populates="step_logs")
