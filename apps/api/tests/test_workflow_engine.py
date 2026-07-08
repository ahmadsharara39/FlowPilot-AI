def _feedback_workflow_payload():
    return {
        "name": "Feedback Triage",
        "description": "test",
        "trigger_type": "webhook",
        "steps": [
            {"step_type": "ai_summarize", "name": "Summarize", "config": {}},
            {
                "step_type": "ai_classify",
                "name": "Classify",
                "config": {"categories": ["urgent_bug", "billing_issue", "general_feedback"]},
            },
            {"step_type": "slack_webhook_mock", "name": "Notify", "config": {}},
            {"step_type": "save_result", "name": "Save", "config": {}},
        ],
    }


def test_create_and_run_workflow(auth_client):
    created = auth_client.post("/api/workflows", json=_feedback_workflow_payload())
    assert created.status_code == 201
    wf = created.json()
    assert wf["webhook_token"]
    assert len(wf["steps"]) == 4

    run = auth_client.post(
        f"/api/workflows/{wf['id']}/run",
        json={"input": {"customer": "Sarah", "message": "I was charged twice, fix today!"}},
    )
    assert run.status_code == 200
    detail = run.json()
    assert detail["status"] == "success"
    assert len(detail["step_logs"]) == 4
    assert detail["output_payload"]["final"] is not None


def test_webhook_trigger(auth_client, client):
    created = auth_client.post("/api/workflows", json=_feedback_workflow_payload())
    token = created.json()["webhook_token"]

    resp = client.post(f"/api/webhooks/{token}", json={"message": "This is broken and urgent!"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert body["execution_id"]


def test_failing_step_marks_execution_failed(auth_client):
    payload = {
        "name": "Bad classify",
        "trigger_type": "manual",
        "steps": [{"step_type": "ai_classify", "name": "no categories", "config": {}}],
    }
    wf = auth_client.post("/api/workflows", json=payload).json()
    run = auth_client.post(f"/api/workflows/{wf['id']}/run", json={"input": "hello"})
    detail = run.json()
    assert detail["status"] == "failed"
    assert detail["error_message"]
