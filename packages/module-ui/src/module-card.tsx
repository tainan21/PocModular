import type { ReactNode } from "react"
import { ArrowUpRight } from "lucide-react"
import { StatusBadge } from "./status-badge"

/**
 * Card visual de um módulo. É PURO visual — não conhece Next nem href.
 * Para torná-lo clicável, embrulhe em <Link> / <a> no consumidor.
 *
 * Uso pelo launcher, onboarding e admin.
 */
export function ModuleCard({
  name,
  description,
  version,
  status,
  statusLabel,
  icon,
  badges,
  footer,
  disabled,
  interactive,
}: {
  name: string
  description: string
  version?: string
  status?: "active" | "experimental" | "disabled" | "hidden"
  statusLabel?: string
  icon?: ReactNode
  badges?: ReactNode
  footer?: ReactNode
  disabled?: boolean
  /** Se true, adiciona hover/arrow indicando ação. */
  interactive?: boolean
}) {
  const base =
    "flex flex-col gap-3 rounded-lg border bg-card p-5 transition-colors"
  const className = disabled
    ? `${base} opacity-60`
    : interactive
      ? `${base} group hover:border-primary hover:bg-accent`
      : base

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-foreground">
          {icon}
        </div>
        {interactive && !disabled ? (
          <ArrowUpRight
            className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{name}</h3>
          {version ? (
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              v{version}
            </span>
          ) : null}
          {status ? (
            <StatusBadge status={status}>{statusLabel ?? status}</StatusBadge>
          ) : null}
          {badges}
        </div>
        <p className="text-pretty text-sm text-muted-foreground">{description}</p>
      </div>
      {footer ? <div className="flex flex-col gap-1 pt-2">{footer}</div> : null}
    </div>
  )
}
