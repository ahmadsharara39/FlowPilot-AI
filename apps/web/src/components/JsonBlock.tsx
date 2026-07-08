import { prettyJson } from "../utils/format";

export function JsonBlock({ value, className }: { value: unknown; className?: string }) {
  const text = prettyJson(value);
  return (
    <pre
      className={
        "max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100 " +
        (className ?? "")
      }
    >
      <code>{text || "—"}</code>
    </pre>
  );
}
