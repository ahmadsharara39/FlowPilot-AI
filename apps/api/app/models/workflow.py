"""Workflow and WorkflowStep models."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    trigger_type: Mapped[str] = mapped_column(String(20), default="manual")  # manual | webhook
    status: Mapped[str] = mapped_column(String(20), default="active")  # active | paused
    webhook_token: Mapped[str | None] = mapped_column(
        String(64), unique=True, index=True, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    user: Mapped["User"] = relationship(back_populates="workflows")  # noqa: F821
    steps: Mapped[list["WorkflowStep"]] = relationship(
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowStep.step_order",
    )
    executions: Mapped[list["WorkflowExecution"]] = relationship(  # noqa: F821
        back_populates="workflow", cascade="all, delete-orphan"
    )


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id: Mapped[int] = mapped_column(primary_key=True)
    workflow_id: Mapped[int] = mapped_column(
        ForeignKey("workflows.id", ondelete="CASCADE"), index=True
    )
    step_order: Mapped[int] = mapped_column(Integer, default=0)
    step_type: Mapped[str] = mapped_column(String(40), nullable=False)
    name: Mapped[str] = mapped_column(String(200), default="")
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    workflow: Mapped["Workflow"] = relationship(back_populates="steps")
