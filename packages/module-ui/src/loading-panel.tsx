/**
 * LoadingPanel — placeholder visual para Suspense/Loading boundaries.
 * Simples e silencioso. Sem spinners gigantes.
 */
export function LoadingPanel({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-3 rounded-lg border bg-card p-5 animate-pulse"
    >
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  )
}
