import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { workflowApi } from "../api/endpoints";
import { StatusBadge } from "../components/StatusBadge";
import { SkeletonCard } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Icon } from "../components/Icon";
import { apiError } from "../api/client";
import { formatDate } from "../utils/format";

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["workflows"], queryFn: workflowApi.list });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Workflows</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage your automation workflows.</p>
        </div>
        <Link to="/workflows/new" className="btn-primary">
          <Icon name="plus" width={16} height={16} />
          New Workflow
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Couldn't load workflows"
          description={apiError(error, "Please try again.")}
          onRetry={() => refetch()}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon="🛠️"
          title="No workflows yet"
          description="Workflows connect a trigger to a sequence of AI and action steps."
          action={
            <Link to="/workflows/new" className="btn-primary">
              <Icon name="plus" width={16} height={16} />
              Create your first workflow
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((wf) => (
            <button
              key={wf.id}
              onClick={() => navigate(`/workflows/${wf.id}`)}
              className="card group p-5 text-left transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon name="workflows" />
                </span>
                <StatusBadge status={wf.status} />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400">
                {wf.name}
              </h3>
              <p className="mt-1 line-clamp-2 h-10 text-sm text-slate-500 dark:text-slate-400">
                {wf.description || "No description"}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-400 dark:text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Icon name={wf.trigger_type === "webhook" ? "webhook" : "play"} width={14} height={14} />
                  {wf.trigger_type}
                </span>
                <span>{wf.step_count} steps</span>
                <span>{formatDate(wf.updated_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
