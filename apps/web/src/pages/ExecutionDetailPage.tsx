import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { executionApi } from "../api/endpoints";
import { LoadingScreen } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { JsonBlock } from "../components/JsonBlock";
import { Icon } from "../components/Icon";
import { stepMeta } from "../utils/stepMeta";
import { durationMs, formatDate } from "../utils/format";
import type { StepLog } from "../types";

export default function ExecutionDetailPage() {
  const { id } = useParams();
  const executionId = Number(id);
  const { data: ex, isLoading } = useQuery({
    queryKey: ["execution", executionId],
    queryFn: () => executionApi.get(executionId),
    enabled: Number.isFinite(executionId),
  });

  if (isLoading || !ex) return <LoadingScreen />;

  const logs = ex.step_logs ?? [];

  return (
    <div className="space-y-6">
      <Link to="/executions" className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
        ← Back to executions
      </Link>

      {/* Summary */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{ex.workflow_name || "Execution"}</h2>
              <StatusBadge status={ex.status} />
            </div>
            <p className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-500">Execution #{ex.id}</p>
          </div>
          <Link to={`/workflows/${ex.workflow_id}`} className="btn-secondary">
            <Icon name="workflows" width={16} height={16} />
            Open workflow
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Meta label="Trigger" value={ex.trigger_source} />
          <Meta label="Duration" value={durationMs(ex.started_at, ex.finished_at)} />
          <Meta label="Started" value={formatDate(ex.started_at)} />
          <Meta label="Finished" value={formatDate(ex.finished_at)} />
        </div>

        {ex.error_message && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span className="font-semibold">Error: </span>
            {ex.error_message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Input payload</h3>
          <JsonBlock value={ex.input_payload} />
        </div>
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Final output</h3>
          <JsonBlock value={ex.output_payload} />
        </div>
      </div>

      {/* Step logs timeline */}
      <div className="card">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Step-by-step logs</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">{logs.length} steps executed</p>
        </div>
        <ol className="divide-y divide-slate-100 dark:divide-slate-800">
          {logs.map((log, i) => (
            <StepLogRow key={log.id} log={log} index={i} />
          ))}
          {logs.length === 0 && (
            <li className="px-6 py-8 text-center text-sm text-slate-400 dark:text-slate-500">No step logs recorded.</li>
          )}
        </ol>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function StepLogRow({ log, index }: { log: StepLog; index: number }) {
  const meta = stepMeta(log.step_type);
  return (
    <li className="px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {index + 1}
        </span>
        <span className={clsx("badge shrink-0", meta.color)}>{meta.label}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{log.step_name}</span>
        <StatusBadge status={log.status} />
        <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">
          {durationMs(log.started_at, log.finished_at)}
        </span>
      </div>

      {log.error_message && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {log.error_message}
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Input</p>
          <JsonBlock value={log.input_snapshot} className="max-h-52" />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Output</p>
          <JsonBlock value={log.output_snapshot} className="max-h-52" />
        </div>
      </div>
    </li>
  );
}
