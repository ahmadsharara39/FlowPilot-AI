import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { executionApi } from "../api/endpoints";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingScreen } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { durationMs, formatDate } from "../utils/format";

export default function ExecutionsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["executions"], queryFn: () => executionApi.list() });

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Executions</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Every workflow run, with status and timing.</p>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          icon="⚡"
          title="No executions yet"
          description="Run a workflow manually or via webhook to populate this history."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Workflow</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Trigger</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((ex) => (
                  <tr
                    key={ex.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => navigate(`/executions/${ex.id}`)}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-slate-400 dark:text-slate-500">#{ex.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{ex.workflow_name}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={ex.status} />
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Icon name={ex.trigger_source === "webhook" ? "webhook" : "play"} width={14} height={14} />
                        {ex.trigger_source}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{durationMs(ex.started_at, ex.finished_at)}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatDate(ex.started_at ?? ex.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
