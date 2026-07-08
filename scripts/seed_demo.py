"""Seed a demo user and the 'Customer Feedback Triage' workflow.

Run from the repo root (after installing API deps):

    cd apps/api
    python ../../scripts/seed_demo.py

Idempotent: re-running updates the demo workflow instead of duplicating it.
Prints demo login credentials and the webhook URL on success.
"""
from __future__ import annotations

import os
import sys

# Make the API package importable regardless of where this is run from.
API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api"))
sys.path.insert(0, API_DIR)

from sqlalchemy import select  # noqa: E402

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.core.security import hash_password  # noqa: E402
import app.models  # noqa: E402,F401
from app.models.user import User  # noqa: E402
from app.models.workflow import Workflow, WorkflowStep  # noqa: E402

DEMO_EMAIL = "demo@flowpilot.ai"
DEMO_PASSWORD = "demo1234"
DEMO_NAME = "Demo User"
WORKFLOW_NAME = "Customer Feedback Triage"


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == DEMO_EMAIL))
        if user is None:
            user = User(
                name=DEMO_NAME,
                email=DEMO_EMAIL,
                hashed_password=hash_password(DEMO_PASSWORD),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created demo user: {DEMO_EMAIL}")
        else:
            print(f"Demo user already exists: {DEMO_EMAIL}")

        wf = db.scalar(
            select(Workflow).where(
                Workflow.user_id == user.id, Workflow.name == WORKFLOW_NAME
            )
        )
        if wf is None:
            import secrets

            wf = Workflow(
                user_id=user.id,
                name=WORKFLOW_NAME,
                description=(
                    "Summarize incoming customer feedback, classify its urgency, "
                    "send a Slack-style notification, and store the result."
                ),
                trigger_type="webhook",
                status="active",
                webhook_token=secrets.token_urlsafe(24),
            )
            db.add(wf)
            db.commit()
            db.refresh(wf)
            print(f"Created workflow: {WORKFLOW_NAME}")
        else:
            # Reset steps so the demo is always in a known-good shape.
            for step in list(wf.steps):
                db.delete(step)
            db.commit()
            print(f"Reset steps on existing workflow: {WORKFLOW_NAME}")

        steps = [
            WorkflowStep(
                workflow_id=wf.id,
                step_order=0,
                step_type="ai_summarize",
                name="Summarize feedback",
                config={},
            ),
            WorkflowStep(
                workflow_id=wf.id,
                step_order=1,
                step_type="ai_classify",
                name="Classify urgency",
                config={
                    "categories": [
                        "urgent_bug",
                        "feature_request",
                        "billing_issue",
                        "general_feedback",
                    ]
                },
            ),
            WorkflowStep(
                workflow_id=wf.id,
                step_order=2,
                step_type="slack_webhook_mock",
                name="Notify support channel",
                config={
                    "channel": "#customer-support",
                    "message_template": "New feedback triaged as *{{ category }}* — {{ explanation }}",
                },
            ),
            WorkflowStep(
                workflow_id=wf.id,
                step_order=3,
                step_type="save_result",
                name="Save triage result",
                config={"label": "feedback_triage"},
            ),
        ]
        db.add_all(steps)
        db.commit()
        db.refresh(wf)

        print("\n" + "=" * 60)
        print("  FlowPilot AI — demo data ready")
        print("=" * 60)
        print(f"  Login email    : {DEMO_EMAIL}")
        print(f"  Login password : {DEMO_PASSWORD}")
        print(f"  Workflow       : {WORKFLOW_NAME} (id={wf.id})")
        print(f"  Webhook token  : {wf.webhook_token}")
        print(f"  Webhook URL    : http://localhost:8000/api/webhooks/{wf.webhook_token}")
        print("=" * 60)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
