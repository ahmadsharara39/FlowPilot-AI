import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { connectorApi } from "../api/endpoints";
import { LoadingScreen } from "../components/Spinner";
import { Icon, type IconName } from "../components/Icon";
import type { Connector } from "../types";

const ICONS: Record<string, IconName> = {
  webhook: "webhook",
  globe: "globe",
  sparkles: "sparkles",
  message: "message",
  monitor: "monitor",
  mail: "mail",
  table: "table",
};

export default function ConnectorsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["connectors"], queryFn: connectorApi.list });

  if (isLoading) return <LoadingScreen />;

  const active = data?.filter((c) => c.status === "active") ?? [];
  const soon = data?.filter((c) => c.status === "coming_soon") ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Connectors</h2>
        <p className="text-sm text-slate-500">
          Integrations that power your workflow triggers and actions.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Active</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((c) => (
            <ConnectorCard key={c.key} connector={c} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Coming soon</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {soon.map((c) => (
            <ConnectorCard key={c.key} connector={c} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ConnectorCard({ connector }: { connector: Connector }) {
  const isActive = connector.status === "active";
  return (
    <div className={clsx("card p-5", !isActive && "opacity-70")}>
      <div className="flex items-start justify-between">
        <span
          className={clsx(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            isActive ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-400"
          )}
        >
          <Icon name={ICONS[connector.icon] ?? "connectors"} />
        </span>
        {isActive ? (
          <span className="badge bg-emerald-100 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <span className="badge bg-slate-100 text-slate-500">Coming soon</span>
        )}
      </div>
      <h4 className="mt-4 font-semibold text-slate-900">{connector.name}</h4>
      <p className="mt-1 text-sm text-slate-500">{connector.description}</p>
      {connector.detail && (
        <p
          className={clsx(
            "mt-3 rounded-lg px-3 py-2 text-xs",
            connector.using_mock ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
          )}
        >
          {connector.detail}
        </p>
      )}
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
        <span className="capitalize">{connector.category}</span>
      </div>
    </div>
  );
}
