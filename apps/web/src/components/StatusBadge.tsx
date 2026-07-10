import clsx from "clsx";

const STYLES: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  running: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  paused: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const FALLBACK = "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

const DOT: Record<string, string> = {
  success: "bg-emerald-500",
  failed: "bg-red-500",
  running: "bg-blue-500",
  pending: "bg-amber-500",
  active: "bg-emerald-500",
  paused: "bg-slate-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("badge capitalize", STYLES[status] ?? FALLBACK)}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", DOT[status] ?? "bg-slate-400")} />
      {status}
    </span>
  );
}
