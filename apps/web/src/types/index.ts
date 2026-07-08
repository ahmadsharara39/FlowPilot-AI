export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type TriggerType = "manual" | "webhook";

export type StepType =
  | "ai_summarize"
  | "ai_classify"
  | "ai_extract_json"
  | "http_request"
  | "slack_webhook_mock"
  | "save_result";

export interface WorkflowStep {
  id: number;
  workflow_id: number;
  step_order: number;
  step_type: StepType;
  name: string;
  config: Record<string, unknown>;
  created_at: string;
}

export interface Workflow {
  id: number;
  user_id: number;
  name: string;
  description: string;
  trigger_type: TriggerType;
  status: string;
  webhook_token: string | null;
  created_at: string;
  updated_at: string;
  steps: WorkflowStep[];
}

export interface WorkflowSummary {
  id: number;
  name: string;
  description: string;
  trigger_type: TriggerType;
  status: string;
  webhook_token: string | null;
  step_count: number;
  created_at: string;
  updated_at: string;
}

export type ExecutionStatus = "pending" | "running" | "success" | "failed";

export interface StepLog {
  id: number;
  step_id: number | null;
  step_type: string;
  step_name: string;
  status: ExecutionStatus;
  input_snapshot: unknown;
  output_snapshot: unknown;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface Execution {
  id: number;
  workflow_id: number;
  user_id: number;
  status: ExecutionStatus;
  trigger_source: string;
  input_payload: unknown;
  output_payload: unknown;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  workflow_name?: string;
  step_logs?: StepLog[];
}

export interface ExecutionListItem {
  id: number;
  workflow_id: number;
  workflow_name: string;
  status: ExecutionStatus;
  trigger_source: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface DashboardStats {
  workflow_count: number;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  pending_runs: number;
  success_rate: number;
}

export interface Connector {
  key: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "coming_soon";
  icon: string;
  detail?: string;
  using_mock?: boolean;
}
