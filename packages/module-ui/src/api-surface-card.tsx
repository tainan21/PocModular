import type { ReactNode } from "react"
import { cn } from "./cn"

export interface ApiEndpointRow {
  method: "GET" | "POST" | "PATCH" | "DELETE"
  path: string
  description?: string
}

const methodTone: Record<ApiEndpointRow["method"], string> = {
  GET: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  POST: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  PATCH: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  DELETE: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
}

export interface ApiSurfaceCardProps {
  title: string
  description?: string
  baseUrl?: string
  endpoints: ApiEndpointRow[]
  actions?: ReactNode
}

export function ApiSurfaceCard({
  title,
  description,
  baseUrl,
  endpoints,
  actions,
}: ApiSurfaceCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? (
            <p className="text-sm text-muted-foreground text-pretty">{description}</p>
          ) : null}
          {baseUrl ? (
            <code className="w-fit rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              {baseUrl}
            </code>
          ) : null}
        </div>
        {actions}
      </div>
      <ul className="flex flex-col divide-y rounded-md border">
        {endpoints.map((e, i) => (
          <li key={`${e.method}-${e.path}-${i}`} className="flex items-start gap-3 p-2.5">
            <span
              className={cn(
                "inline-flex w-14 shrink-0 justify-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
                methodTone[e.method],
              )}
            >
              {e.method}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <code className="font-mono text-xs text-foreground">{e.path}</code>
              {e.description ? (
                <p className="text-xs text-muted-foreground">{e.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
