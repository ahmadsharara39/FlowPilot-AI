import type { QueryClient } from "@tanstack/react-query";
import { workflowApi, type WorkflowCreatePayload } from "../api/endpoints";
import type { Workflow } from "../types";

export const DEMO_WORKFLOW_NAME = "Customer Feedback Triage";

export const DEMO_INPUT = {
  customer: "Sarah",
  message:
    "I was charged twice this month and I need this fixed today. I already emailed support twice.",
};

const DEMO_PAYLOAD: WorkflowCreatePayload = {
  name: DEMO_WORKFLOW_NAME,
  description:
    "Summarize incoming customer feedback, classify its urgency, send a Slack-style notification, and store the result.",
  trigger_type: "webhook",
  steps: [
    { step_type: "ai_summarize", name: "Summarize feedback", config: {}, step_order: 0 },
    {
      step_type: "ai_classify",
      name: "Classify urgency",
      config: {
        categories: ["urgent_bug", "feature_request", "billing_issue", "general_feedback"],
      },
      step_order: 1,
    },
    {
      step_type: "slack_webhook_mock",
      name: "Notify support channel",
      config: {
        channel: "#customer-support",
        message_template: "New feedback triaged as *{{ category }}* — {{ explanation }}",
      },
      step_order: 2,
    },
    { step_type: "save_result", name: "Save triage result", config: { label: "feedback_triage" }, step_order: 3 },
  ],
};

/**
 * Return the demo workflow, creating it if the user doesn't have one yet.
 * Used by the "Run Demo Workflow" button so it works for any account.
 */
export async function ensureDemoWorkflow(qc: QueryClient): Promise<Workflow> {
  const list = await workflowApi.list();
  const existing = list.find((w) => w.name === DEMO_WORKFLOW_NAME);
  if (existing) {
    return workflowApi.get(existing.id);
  }
  const created = await workflowApi.create(DEMO_PAYLOAD);
  qc.invalidateQueries({ queryKey: ["workflows"] });
  return created;
}
