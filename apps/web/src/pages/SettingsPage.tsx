import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { LoadingScreen } from "../components/Spinner";
import { Icon } from "../components/Icon";
import clsx from "clsx";

interface Health {
  status: string;
  app: string;
  environment: string;
  execution_mode: string;
  ai_provider: string;
  ai_is_mock: boolean;
  step_types: string[];
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: health, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<Health>("/health").then((r) => r.data),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Your account and platform configuration.</p>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">Account</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
            {(user?.name || "U").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">Platform</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Row label="Environment" value={health?.environment} />
          <Row label="Execution mode" value={health?.execution_mode} />
          <Row
            label="AI provider"
            value={
              <span className="flex items-center gap-2">
                {health?.ai_provider}
                {health?.ai_is_mock && (
                  <span className="badge bg-amber-100 text-amber-700">mock</span>
                )}
              </span>
            }
          />
          <Row
            label="API status"
            value={
              <span className="flex items-center gap-1 text-emerald-600">
                <Icon name="check" width={14} height={14} /> {health?.status}
              </span>
            }
          />
        </dl>

        {health?.ai_is_mock && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            The platform is using the built-in <strong>deterministic mock AI</strong>. Set
            <code className="mx-1 rounded bg-amber-100 px-1">OPENAI_API_KEY</code> or
            <code className="mx-1 rounded bg-amber-100 px-1">ANTHROPIC_API_KEY</code> in the API
            <code className="mx-1 rounded bg-amber-100 px-1">.env</code> to use a real provider.
          </div>
        )}
      </div>

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">Available step types</h3>
        <div className="flex flex-wrap gap-2">
          {health?.step_types.map((t) => (
            <span key={t} className={clsx("badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium capitalize text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  );
}
