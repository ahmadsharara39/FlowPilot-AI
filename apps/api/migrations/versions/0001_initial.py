"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-01-01 00:00:00
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "workflows",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("trigger_type", sa.String(length=20), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("webhook_token", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_workflows_user_id", "workflows", ["user_id"])
    op.create_index("ix_workflows_webhook_token", "workflows", ["webhook_token"], unique=True)

    op.create_table(
        "workflow_steps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("workflow_id", sa.Integer(), sa.ForeignKey("workflows.id", ondelete="CASCADE")),
        sa.Column("step_order", sa.Integer(), nullable=True),
        sa.Column("step_type", sa.String(length=40), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=True),
        sa.Column("config", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_workflow_steps_workflow_id", "workflow_steps", ["workflow_id"])

    op.create_table(
        "workflow_executions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("workflow_id", sa.Integer(), sa.ForeignKey("workflows.id", ondelete="CASCADE")),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("trigger_source", sa.String(length=20), nullable=True),
        sa.Column("input_payload", sa.JSON(), nullable=True),
        sa.Column("output_payload", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_workflow_executions_workflow_id", "workflow_executions", ["workflow_id"])
    op.create_index("ix_workflow_executions_user_id", "workflow_executions", ["user_id"])

    op.create_table(
        "workflow_step_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "execution_id",
            sa.Integer(),
            sa.ForeignKey("workflow_executions.id", ondelete="CASCADE"),
        ),
        sa.Column(
            "step_id", sa.Integer(), sa.ForeignKey("workflow_steps.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column("step_type", sa.String(length=40), nullable=True),
        sa.Column("step_name", sa.String(length=200), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("input_snapshot", sa.JSON(), nullable=True),
        sa.Column("output_snapshot", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_workflow_step_logs_execution_id", "workflow_step_logs", ["execution_id"]
    )


def downgrade() -> None:
    op.drop_table("workflow_step_logs")
    op.drop_table("workflow_executions")
    op.drop_table("workflow_steps")
    op.drop_table("workflows")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
