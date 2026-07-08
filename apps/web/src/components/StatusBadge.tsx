import clsx from "clsx";

const STYLES: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  running: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-slate-100 text-slate-600",
};

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
    <span className={clsx("badge", STYLES[status] ?? "bg-slate-100 text-slate-600")}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", DOT[status] ?? "bg-slate-400")} />
      {status}
    </span>
  );
}
