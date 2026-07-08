import type { ReactNode } from "react";
import type { StepType } from "../types";

type Config = Record<string, unknown>;

interface Props {
  stepType: StepType;
  config: Config;
  onChange: (config: Config) => void;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Renders the right config inputs for each step type. */
export function StepConfigFields({ stepType, config, onChange }: Props) {
  const set = (key: string, value: unknown) => onChange({ ...config, [key]: value });

  switch (stepType) {
    case "ai_summarize":
      return (
        <p className="text-sm text-slate-500">
          No configuration needed. This step summarizes whatever text or JSON reaches it.
        </p>
      );

    case "ai_classify":
      return (
        <Field label="Categories" hint="Comma-separated list of possible categories.">
          <input
            className="input"
            value={(config.categories as string[] | undefined)?.join(", ") ?? ""}
            placeholder="urgent_bug, feature_request, billing_issue, general_feedback"
            onChange={(e) =>
              set(
                "categories",
                e.target.value.split(",").map((c) => c.trim()).filter(Boolean)
              )
            }
          />
        </Field>
      );

    case "ai_extract_json":
      return (
        <Field label="Fields to extract" hint="Describe the fields / schema for the AI to pull out.">
          <input
            className="input"
            value={(config.schema_description as string) ?? ""}
            placeholder="name, email, order_id, sentiment"
            onChange={(e) => set("schema_description", e.target.value)}
          />
        </Field>
      );

    case "http_request":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Method">
              <select
                className="input"
                value={(config.method as string) ?? "POST"}
                onChange={(e) => set("method", e.target.value)}
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="URL">
                <input
                  className="input"
                  value={(config.url as string) ?? ""}
                  placeholder="https://api.example.com/endpoint"
                  onChange={(e) => set("url", e.target.value)}
                />
              </Field>
            </div>
          </div>
          <Field label="Body template" hint="Use {{ input }} to inject the incoming payload.">
            <textarea
              className="input min-h-[70px] font-mono text-xs"
              value={(config.body_template as string) ?? ""}
              placeholder="{{ input }}"
              onChange={(e) => set("body_template", e.target.value)}
            />
          </Field>
        </div>
      );

    case "slack_webhook_mock":
      return (
        <div className="space-y-4">
          <Field label="Channel">
            <input
              className="input"
              value={(config.channel as string) ?? ""}
              placeholder="#general"
              onChange={(e) => set("channel", e.target.value)}
            />
          </Field>
          <Field label="Message template" hint="Supports {{ field }} placeholders from the previous step.">
            <textarea
              className="input min-h-[60px]"
              value={(config.message_template as string) ?? ""}
              placeholder="New event: {{ input }}"
              onChange={(e) => set("message_template", e.target.value)}
            />
          </Field>
          <Field label="Real webhook URL (optional)" hint="Leave blank to run in mock mode.">
            <input
              className="input"
              value={(config.webhook_url as string) ?? ""}
              placeholder="https://hooks.slack.com/services/..."
              onChange={(e) => set("webhook_url", e.target.value)}
            />
          </Field>
        </div>
      );

    case "save_result":
      return (
        <Field label="Label" hint="A name for the saved result.">
          <input
            className="input"
            value={(config.label as string) ?? ""}
            placeholder="result"
            onChange={(e) => set("label", e.target.value)}
          />
        </Field>
      );

    default:
      return null;
  }
}
