import type { StepType } from "../types";

export interface StepTypeMeta {
  type: StepType;
  label: string;
  description: string;
  color: string; // tailwind classes for the badge/icon chip
  category: "ai" | "action";
}

export const STEP_TYPES: StepTypeMeta[] = [
  {
    type: "ai_summarize",
    label: "AI Summarize",
    description: "Summarize the incoming text or JSON payload.",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    category: "ai",
  },
  {
    type: "ai_classify",
    label: "AI Classify",
    description: "Classify the input into one of your categories.",
    color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
    category: "ai",
  },
  {
    type: "ai_extract_json",
    label: "AI Extract JSON",
    description: "Extract structured fields as a JSON object.",
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    category: "ai",
  },
  {
    type: "http_request",
    label: "HTTP Request",
    description: "Call an external REST API endpoint.",
    color: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    category: "action",
  },
  {
    type: "slack_webhook_mock",
    label: "Slack Notification",
    description: "Send a Slack-style notification (mock or real webhook).",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    category: "action",
  },
  {
    type: "save_result",
    label: "Save Result",
    description: "Persist the current data as the final output.",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    category: "action",
  },
];

export function stepMeta(type: string): StepTypeMeta {
  return (
    STEP_TYPES.find((s) => s.type === type) ?? {
      type: type as StepType,
      label: type,
      description: "",
      color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
      category: "action",
    }
  );
}

// Default config templates so new steps come pre-filled with useful fields.
export function defaultConfig(type: StepType): Record<string, unknown> {
  switch (type) {
    case "ai_classify":
      return { categories: ["urgent_bug", "feature_request", "billing_issue", "general_feedback"] };
    case "ai_extract_json":
      return { schema_description: "name, email, order_id, sentiment" };
    case "http_request":
      return { method: "POST", url: "https://httpbin.org/post", headers: {}, body_template: "{{ input }}" };
    case "slack_webhook_mock":
      return { channel: "#general", message_template: "New event: {{ input }}" };
    case "save_result":
      return { label: "result" };
    default:
      return {};
  }
}
