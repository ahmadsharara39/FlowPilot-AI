import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardApi, executionApi, workflowApi } from "../api/endpoints";
import { apiError } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { formatDate, formatRelative } from "../utils/format";
import { DEMO_WORKFLOW_NAME, ensureDemoWorkflow, DEMO_INPUT } from "../utils/demo";

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  tone: string;
  icon: ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [runningDemo, setRunningDemo] = useState(false);

  const stats = useQuery({ queryKey: ["dashboard-stats"], queryFn: dashboardApi.stats });
  const executions = useQuery({ queryKey: ["executions"], queryFn: () => executionApi.list() });
  const workflows = useQuery({ queryKey: ["workflows"], queryFn: workflowApi.list });

  const chartData = useMemo(() => {
    const s = stats.data;
    if (!s) return [];
    return [
      { name: "Success", value: s.successful_runs, fill: "#10b981" },
      { name: "Failed", value: s.failed_runs, fill: "#ef4444" },
      { name: "Pending", value: s.pending_runs, fill: "#f59e0b" },
    ];
  }, [stats.data]);

  const runDemo = useMutation({
    mutationFn: async () => {
      const wf = await ensureDemoWorkflow(qc);
      return workflowApi.run(wf.id, DEMO_INPUT);
    },
    onSuccess: (execution) => {
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["executions"] });
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Demo workflow executed!");
      navigate(`/executions/${execution.id}`);
    },
    onError: (e) => toast.error(apiError(e, "Could not run demo workflow")),
    onSettled: () => setRunningDemo(false),
  });

  if (stats.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={1} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  const s = stats.data!;
  const recent = executions.data?.slice(0, 6) ?? [];

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="flex flex-col justify-between gap-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-700 p-6 text-white sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold">Welcome to FlowPilot AI 👋</h2>
          <p className="mt-1 text-sm text-brand-100">
            Build automations that connect triggers, AI processing, and actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/workflows/new" className="btn bg-white text-brand-700 hover:bg-brand-50">
            <Icon name="plus" width={16} height={16} />
            Create Workflow
          </Link>
          <button
            className="btn bg-brand-500/40 text-white ring-1 ring-inset ring-white/30 hover:bg-brand-500/60"
            disabled={runningDemo || runDemo.isPending}
            onClick={() => {
              setRunningDemo(true);
              runDemo.mutate();
            }}
          >
            {runDemo.isPending ? (
              <Spinner className="h-4 w-4 text-white" />
            ) : (
              <Icon name="play" width={16} height={16} />
            )}
            Run Demo Workflow
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Workflows"
          value={s.workflow_count}
          tone="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
          icon={<Icon name="workflows" width={18} height={18} />}
        />
        <StatCard
          label="Successful Runs"
          value={s.successful_runs}
          tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
          icon={<Icon name="check" width={18} height={18} />}
        />
        <StatCard
          label="Failed Runs"
          value={s.failed_runs}
          tone="bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300"
          icon={<Icon name="executions" width={18} height={18} />}
        />
        <StatCard
          label="Success Rate"
          value={`${s.success_rate}%`}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
          icon={<Icon name="sparkles" width={18} height={18} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent executions */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Executions</h3>
            <Link to="/executions" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="⚡"
                title="No executions yet"
                description="Run the demo workflow or create your own to see execution history here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Workflow</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Trigger</th>
                    <th className="px-5 py-3 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recent.map((ex) => (
                    <tr
                      key={ex.id}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      onClick={() => navigate(`/executions/${ex.id}`)}
                    >
                      <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{ex.workflow_name}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={ex.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{ex.trigger_source}</td>
                      <td
                        className="px-5 py-3 text-slate-500 dark:text-slate-400"
                        title={formatDate(ex.created_at)}
                      >
                        {formatRelative(ex.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Run Breakdown</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Across {s.total_runs} total runs</p>
          <div className="mt-4 h-56">
            {s.total_runs === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip cursor={{ fill: "rgba(100,116,139,0.15)" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Workflows quick list */}
      {workflows.data && workflows.data.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Your Workflows</h3>
            <Link to="/workflows" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Manage
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {workflows.data.slice(0, 5).map((wf) => (
              <li key={wf.id}>
                <Link
                  to={`/workflows/${wf.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon name="workflows" width={16} height={16} />
                    </span>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{wf.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {wf.step_count} steps · {wf.trigger_type}
                        {wf.name === DEMO_WORKFLOW_NAME ? " · demo" : ""}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={wf.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
