import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Icon name="bolt" width={20} height={20} />
          </div>
          <span className="text-xl font-bold">FlowPilot AI</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold leading-tight">
            Connect triggers, AI, and actions into one flow.
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            Summarize, classify, extract, and route data automatically. Build Zapier-style
            automations supercharged with AI — no glue code required.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-50">
            {["Webhook & manual triggers", "AI summarize / classify / extract", "Full execution history & logs"].map(
              (f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                    <Icon name="check" width={14} height={14} />
                  </span>
                  {f}
                </li>
              )
            )}
          </ul>
        </div>
        <p className="text-xs text-brand-200">© 2026 FlowPilot AI · Portfolio project</p>
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Icon name="bolt" width={18} height={18} />
            </div>
            <span className="text-lg font-bold text-slate-900">FlowPilot AI</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
