import { useState } from "react";
import { prettyJson } from "../utils/format";
import { Icon } from "./Icon";

export function JsonBlock({ value, className }: { value: unknown; className?: string }) {
  const text = prettyJson(value);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div className="group relative">
      <button
        onClick={copy}
        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-slate-700/70 px-2 py-1 text-[11px] font-medium text-slate-100 opacity-60 transition-opacity hover:bg-slate-600 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
        title="Copy JSON"
        aria-label="Copy JSON to clipboard"
      >
        <Icon name={copied ? "check" : "copy"} width={13} height={13} />
        {copied ? "Copied" : "Copy"}
      </button>
      <pre
        className={
          "max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100 ring-1 ring-slate-800 " +
          (className ?? "")
        }
      >
        <code>{text || "—"}</code>
      </pre>
    </div>
  );
}
