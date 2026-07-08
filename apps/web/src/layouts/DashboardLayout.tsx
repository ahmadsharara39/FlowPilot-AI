import { NavLink, Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../hooks/useAuth";
import { Icon, type IconName } from "../components/Icon";

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/workflows", label: "Workflows", icon: "workflows" },
  { to: "/executions", label: "Executions", icon: "executions" },
  { to: "/connectors", label: "Connectors", icon: "connectors" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/workflows": "Workflows",
  "/executions": "Executions",
  "/connectors": "Connectors",
  "/settings": "Settings",
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const title =
    Object.entries(TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] ??
    "FlowPilot AI";

  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Icon name="bolt" width={18} height={18} />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">FlowPilot AI</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          <button onClick={logout} className="btn-secondary">
            <Icon name="logout" width={16} height={16} />
            Logout
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
