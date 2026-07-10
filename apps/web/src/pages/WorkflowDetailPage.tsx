import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import clsx from "clsx";
import { workflowApi } from "../api/endpoints";
import { apiError, webhookUrl } from "../api/client";
import { LoadingScreen, Spinner } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { StatusBadge } from "../components/StatusBadge";
import { StepConfigFields } from "../components/StepConfigFields";
import { useConfirm } from "../hooks/useConfirm";
import { STEP_TYPES, defaultConfig, stepMeta } from "../utils/stepMeta";
import { prettyJson } from "../utils/format";
import type { StepType, Workflow, WorkflowStep } from "../types";

export default function WorkflowDetailPage() {
  const { id } = useParams();
  const workflowId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: wf, isLoading } = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => workflowApi.get(workflowId),
    enabled: Number.isFinite(workflowId),
  });

  if (isLoading || !wf) return <LoadingScreen />;

  return <WorkflowEditor wf={wf} onRefetch={() => qc.invalidateQueries({ queryKey: ["workflow", workflowId] })} navigate={navigate} qc={qc} />;
}

function WorkflowEditor({
  wf,
  onRefetch,
  navigate,
  qc,
}: {
  wf: Workflow;
  onRefetch: () => void;
  navigate: ReturnType<typeof useNavigate>;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const confirm = useConfirm();
  const [name, setName] = useState(wf.name);
  const [description, setDescription] = useState(wf.description);
  const [status, setStatus] = useState(wf.status);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setName(wf.name);
    setDescription(wf.description);
    setStatus(wf.status);
  }, [wf.id]); // reset when navigating between workflows

  const dirty = name !== wf.name || description !== wf.description || status !== wf.status;

  const saveMeta = useMutation({
    mutationFn: () => workflowApi.update(wf.id, { name, description, status }),
    onSuccess: () => {
      onRefetch();
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow saved");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const addStep = useMutation({
    mutationFn: (type: StepType) =>
      workflowApi.addStep(wf.id, {
        step_type: type,
        name: stepMeta(type).label,
        config: defaultConfig(type),
        step_order: wf.steps.length,
      }),
    onSuccess: () => {
      onRefetch();
      setAdding(false);
      toast.success("Step added");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const removeWorkflow = useMutation({
    mutationFn: () => workflowApi.remove(wf.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted");
      navigate("/workflows");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  // Reorder by swapping step_order with the adjacent step (integer-safe).
  const moveStep = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const a = wf.steps[index];
      const b = wf.steps[index + dir];
      if (!a || !b) return;
      await workflowApi.updateStep(wf.id, a.id, { step_order: b.step_order });
      await workflowApi.updateStep(wf.id, b.id, { step_order: a.step_order });
    },
    onSuccess: onRefetch,
    onError: (e) => toast.error(apiError(e)),
  });

  // Drag-and-drop reorder: persist the new order as sequential step_order values.
  const reorder = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const step = wf.steps.find((s) => s.id === orderedIds[i]);
        if (step && step.step_order !== i) {
          await workflowApi.updateStep(wf.id, step.id, { step_order: i });
        }
      }
    },
    onSuccess: onRefetch,
    onError: (e) => toast.error(apiError(e)),
  });

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDrop = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const ids = wf.steps.map((s) => s.id);
      const [moved] = ids.splice(dragIndex, 1);
      ids.splice(overIndex, 0, moved);
      reorder.mutate(ids);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/workflows" className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          ← Back to workflows
        </Link>
        <div className="flex items-center gap-2">
          <button
            className="btn-danger"
            onClick={async () => {
              const ok = await confirm({
                title: "Delete workflow?",
                message: "This permanently deletes the workflow and all its executions.",
                confirmLabel: "Delete",
                danger: true,
              });
              if (ok) removeWorkflow.mutate();
            }}
          >
            <Icon name="trash" width={16} height={16} />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: settings + steps */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Workflow settings</h2>
              <StatusBadge status={status} />
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input min-h-[70px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Status</span>
                  <button
                    onClick={() => setStatus(status === "active" ? "paused" : "active")}
                    className={clsx(
                      "badge cursor-pointer",
                      status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {status === "active" ? "Active" : "Paused"} · toggle
                  </button>
                </div>
                <button
                  className="btn-primary"
                  disabled={!dirty || saveMeta.isPending}
                  onClick={() => saveMeta.mutate()}
                >
                  {saveMeta.isPending ? <Spinner className="h-4 w-4 text-white" /> : <Icon name="check" width={16} height={16} />}
                  Save changes
                </button>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">Steps</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">Runs top to bottom; drag to reorder. Each step's output feeds the next.</p>
              </div>
              <button className="btn-secondary" onClick={() => setAdding((v) => !v)}>
                <Icon name="plus" width={16} height={16} />
                Add step
              </button>
            </div>

            {adding && (
              <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {STEP_TYPES.map((s) => (
                    <button
                      key={s.type}
                      onClick={() => addStep.mutate(s.type)}
                      className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-3 text-left hover:border-brand-300 hover:bg-brand-50/40"
                    >
                      <span className={clsx("badge shrink-0", s.color)}>{s.category}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {wf.steps.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon="➕"
                  title="No steps yet"
                  description="Add AI or action steps to build your automation."
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {wf.steps.map((step, idx) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={idx}
                    total={wf.steps.length}
                    workflowId={wf.id}
                    onChanged={onRefetch}
                    onMove={(dir) => moveStep.mutate({ index: idx, dir })}
                    moving={moveStep.isPending}
                    dragging={dragIndex === idx}
                    isOver={overIndex === idx && dragIndex !== idx}
                    onDragStart={() => setDragIndex(idx)}
                    onDragOver={() => setOverIndex(idx)}
                    onDrop={handleDrop}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: webhook + run */}
        <div className="space-y-6">
          {wf.trigger_type === "webhook" && <WebhookCard wf={wf} onRefetch={onRefetch} />}
          <RunPanel wf={wf} navigate={navigate} qc={qc} />
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  index,
  total,
  workflowId,
  onChanged,
  onMove,
  moving,
  dragging,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  step: WorkflowStep;
  index: number;
  total: number;
  workflowId: number;
  onChanged: () => void;
  onMove: (dir: -1 | 1) => void;
  moving: boolean;
  dragging: boolean;
  isOver: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<Record<string, unknown>>(step.config ?? {});
  const meta = stepMeta(step.step_type);

  useEffect(() => setConfig(step.config ?? {}), [step.id, JSON.stringify(step.config)]);

  const save = useMutation({
    mutationFn: () => workflowApi.updateStep(workflowId, step.id, { config }),
    onSuccess: () => {
      onChanged();
      toast.success("Step updated");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: () => workflowApi.removeStep(workflowId, step.id),
    onSuccess: () => {
      onChanged();
      toast.success("Step removed");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <li
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={onDrop}
      className={clsx(
        "px-6 py-4 transition-colors",
        dragging && "opacity-40",
        isOver && "bg-brand-50/60 dark:bg-brand-500/10"
      )}
    >
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="flex items-center gap-3"
      >
        <span
          className="hidden cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-400 sm:block"
          title="Drag to reorder"
        >
          <Icon name="grip" width={16} height={16} />
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {index + 1}
        </span>
        <span className={clsx("badge shrink-0", meta.color)}>{meta.label}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{step.name}</span>
        <div className="flex items-center gap-1">
          <button
            disabled={index === 0 || moving}
            onClick={() => onMove(-1)}
            className="rounded p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 disabled:opacity-30"
            title="Move up"
          >
            <Icon name="arrow-up" width={16} height={16} />
          </button>
          <button
            disabled={index === total - 1 || moving}
            onClick={() => onMove(1)}
            className="rounded p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 disabled:opacity-30"
            title="Move down"
          >
            <Icon name="arrow-down" width={16} height={16} />
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600"
            title="Configure"
          >
            <Icon name="settings" width={16} height={16} />
          </button>
          <button
            onClick={async () => {
              const ok = await confirm({
                title: "Remove step?",
                message: `Remove "${step.name}" from this workflow?`,
                confirmLabel: "Remove",
                danger: true,
              });
              if (ok) remove.mutate();
            }}
            className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            title="Delete step"
          >
            <Icon name="trash" width={16} height={16} />
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
          <StepConfigFields stepType={step.step_type} config={config} onChange={setConfig} />
          <div className="mt-4 flex justify-end">
            <button className="btn-primary" disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? <Spinner className="h-4 w-4 text-white" /> : <Icon name="check" width={16} height={16} />}
              Save step
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function WebhookCard({ wf, onRefetch }: { wf: Workflow; onRefetch: () => void }) {
  const url = wf.webhook_token ? webhookUrl(wf.webhook_token) : "";

  const regenerate = useMutation({
    mutationFn: () => workflowApi.regenerateWebhook(wf.id),
    onSuccess: () => {
      onRefetch();
      toast.success("New webhook token generated");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const copy = () => {
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied");
  };

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon name="webhook" width={18} height={18} />
        </span>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Webhook trigger</h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">POST any JSON payload to this URL to run the workflow.</p>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2">
        <code className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">{url}</code>
        <button onClick={copy} className="rounded p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:hover:text-slate-200" title="Copy">
          <Icon name="copy" width={16} height={16} />
        </button>
      </div>
      <button
        onClick={() => regenerate.mutate()}
        className="mt-3 text-xs font-medium text-brand-600 hover:text-brand-700"
      >
        Regenerate token
      </button>
    </div>
  );
}

function RunPanel({
  wf,
  navigate,
  qc,
}: {
  wf: Workflow;
  navigate: ReturnType<typeof useNavigate>;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const defaultInput = useMemo(
    () =>
      prettyJson({
        customer: "Sarah",
        message: "I was charged twice this month and I need this fixed today.",
      }),
    []
  );
  const [input, setInput] = useState(defaultInput);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const run = useMutation({
    mutationFn: () => {
      let payload: unknown = input;
      const trimmed = input.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          payload = JSON.parse(trimmed);
        } catch {
          throw new Error("Input is not valid JSON");
        }
      }
      return workflowApi.run(wf.id, payload);
    },
    onSuccess: (execution) => {
      qc.invalidateQueries({ queryKey: ["executions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(`Execution ${execution.status}`);
      navigate(`/executions/${execution.id}`);
    },
    onError: (e) => toast.error(apiError(e, (e as Error).message)),
  });

  const validate = (value: string) => {
    setInput(value);
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        JSON.parse(trimmed);
        setJsonError(null);
      } catch {
        setJsonError("Invalid JSON");
      }
    } else {
      setJsonError(null);
    }
  };

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icon name="play" width={18} height={18} />
        </span>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Run manually</h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">Provide a test payload (JSON or plain text).</p>
      <textarea
        className="input mt-3 min-h-[160px] font-mono text-xs"
        value={input}
        onChange={(e) => validate(e.target.value)}
      />
      {jsonError && <p className="mt-1 text-xs text-red-600">{jsonError}</p>}
      <button
        className="btn-primary mt-3 w-full"
        disabled={wf.steps.length === 0 || !!jsonError || run.isPending}
        onClick={() => run.mutate()}
      >
        {run.isPending ? <Spinner className="h-4 w-4 text-white" /> : <Icon name="play" width={16} height={16} />}
        {run.isPending ? "Running… (~15s on free AI)" : "Run workflow"}
      </button>
      {wf.steps.length === 0 && (
        <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">Add at least one step to run.</p>
      )}
    </div>
  );
}
