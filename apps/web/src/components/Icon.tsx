import type { SVGProps } from "react";

type IconName =
  | "dashboard"
  | "workflows"
  | "executions"
  | "connectors"
  | "settings"
  | "plus"
  | "play"
  | "logout"
  | "copy"
  | "trash"
  | "webhook"
  | "globe"
  | "sparkles"
  | "message"
  | "monitor"
  | "mail"
  | "table"
  | "check"
  | "arrow-up"
  | "arrow-down"
  | "bolt"
  | "sun"
  | "moon"
  | "grip";

const PATHS: Record<IconName, string> = {
  dashboard: "M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z",
  workflows: "M4 6h6M4 12h10M4 18h6M17 4v6m0 0l3-3m-3 3l-3-3M17 14v6m0 0l3-3m-3 3l-3-3",
  executions: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  connectors: "M13 10V3L4 14h7v7l9-11h-7z",
  settings:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  plus: "M12 4v16m8-8H4",
  play: "M14.752 11.168l-5.197-3.03A1 1 0 008 9.03v5.94a1 1 0 001.555.832l5.197-3.03a1 1 0 000-1.664z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  copy: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  webhook: "M12 2a5 5 0 015 5c0 1.5-.7 2.9-1.8 3.8l2.3 4A3 3 0 1114 18h-4M9 9l-3 5.2A3 3 0 106 20",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-2.5 3-6.5 3-9s-.5-6.5-3-9m0 18c-2.5-2.5-3-6.5-3-9s.5-6.5 3-9M3.5 9h17M3.5 15h17",
  sparkles: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z",
  message: "M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z M3 12a9 9 0 019-9m0 18a8.96 8.96 0 01-4.5-1.2L3 21l1.2-4.5",
  monitor: "M9 17v2m6-2v2M8 21h8M3 4h18v12H3V4z",
  mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  table: "M3 10h18M3 14h18m-9-8v16M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  check: "M5 13l4 4L19 7",
  "arrow-up": "M5 15l7-7 7 7",
  "arrow-down": "M19 9l-7 7-7-7",
  bolt: "M13 10V3L4 14h7v7l9-11h-7z",
  sun: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  moon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
  grip: "M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01",
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={20}
      height={20}
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export type { IconName };
