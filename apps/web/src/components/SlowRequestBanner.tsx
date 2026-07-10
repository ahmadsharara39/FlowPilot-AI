import { useSyncExternalStore } from "react";
import { isSlow, subscribeSlow } from "../api/slowRequest";
import { Spinner } from "./Spinner";

/**
 * Fixed top banner shown when an API call runs long — typically a Render
 * free-tier cold start (~50s) or a free-AI workflow run. Reassures the user
 * that the app is working rather than frozen.
 */
export function SlowRequestBanner() {
  const slow = useSyncExternalStore(subscribeSlow, isSlow, () => false);
  if (!slow) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-3">
      <div className="flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 shadow-md dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <Spinner className="h-4 w-4 text-amber-500" />
        <span>
          Still working… the free-tier server may be waking up or running AI — this can take up to a minute.
        </span>
      </div>
    </div>
  );
}
