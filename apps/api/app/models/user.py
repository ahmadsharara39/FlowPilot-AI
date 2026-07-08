"""User model."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    workflows: Mapped[list["Workflow"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    executions: Mapped[list["WorkflowExecution"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
