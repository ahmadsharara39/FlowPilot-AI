interface Props {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/** Inline error card with an optional retry — used when a query fails. */
export function ErrorState({ title = "Something went wrong", description, onRetry }: Props) {
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl dark:bg-red-500/10">
        ⚠️
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-4">
          Retry
        </button>
      )}
    </div>
  );
}
