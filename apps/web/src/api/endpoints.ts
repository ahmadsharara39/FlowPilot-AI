import { api } from "./client";
import type {
  AuthResponse,
  Connector,
  DashboardStats,
  Execution,
  ExecutionListItem,
  StepType,
  User,
  Workflow,
  WorkflowSummary,
} from "../types";

// --- Auth ---
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>("/auth/register", data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data),
};

// --- Dashboard ---
export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/dashboard/stats").then((r) => r.data),
};

// --- Workflows ---
export interface WorkflowCreatePayload {
  name: string;
  description?: string;
  trigger_type: "manual" | "webhook";
  steps?: Array<{ step_type: StepType; name: string; config: Record<string, unknown>; step_order?: number }>;
}

export const workflowApi = {
  list: () => api.get<WorkflowSummary[]>("/workflows").then((r) => r.data),
  get: (id: number) => api.get<Workflow>(`/workflows/${id}`).then((r) => r.data),
  create: (data: WorkflowCreatePayload) =>
    api.post<Workflow>("/workflows", data).then((r) => r.data),
  update: (
    id: number,
    data: Partial<{ name: string; description: string; trigger_type: string; status: string }>
  ) => api.put<Workflow>(`/workflows/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/workflows/${id}`).then((r) => r.data),
  regenerateWebhook: (id: number) =>
    api.post<Workflow>(`/workflows/${id}/regenerate-webhook`).then((r) => r.data),
  run: (id: number, input: unknown) =>
    api.post<Execution>(`/workflows/${id}/run`, { input }).then((r) => r.data),
  addStep: (id: number, data: { step_type: StepType; name: string; config: Record<string, unknown>; step_order?: number }) =>
    api.post(`/workflows/${id}/steps`, data).then((r) => r.data),
  updateStep: (
    id: number,
    stepId: number,
    data: Partial<{ step_type: StepType; name: string; config: Record<string, unknown>; step_order: number }>
  ) => api.put(`/workflows/${id}/steps/${stepId}`, data).then((r) => r.data),
  removeStep: (id: number, stepId: number) =>
    api.delete(`/workflows/${id}/steps/${stepId}`).then((r) => r.data),
};

// --- Executions ---
export const executionApi = {
  list: (workflowId?: number) =>
    api
      .get<ExecutionListItem[]>("/executions", {
        params: workflowId ? { workflow_id: workflowId } : undefined,
      })
      .then((r) => r.data),
  get: (id: number) => api.get<Execution>(`/executions/${id}`).then((r) => r.data),
};

// --- Connectors ---
export const connectorApi = {
  list: () => api.get<Connector[]>("/connectors").then((r) => r.data),
};
