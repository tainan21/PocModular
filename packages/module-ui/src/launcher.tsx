import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "./cn"

export type LauncherTone = "default" | "system" | "experimental" | "debug"

const toneMap: Record<LauncherTone, string> = {
  default:
    "bg-card hover:bg-accent/60 border-border hover:border-primary/40",
  system:
    "bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/40",
  experimental:
    "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20",
  debug:
    "bg-muted/40 hover:bg-muted border-dashed border-muted-foreground/30",
}

export interface LauncherCardProps {
  href: string
  title: string
  description?: string
  badge?: string
  icon?: ReactNode
  tone?: LauncherTone
  disabled?: boolean
  reason?: string
}

export function LauncherCard({
  href,
  title,
  description,
  badge,
  icon,
  tone = "default",
  disabled,
  reason,
}: LauncherCardProps) {
  const body = (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon ? (
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-md bg-background/80 text-foreground"
            >
              {icon}
            </span>
          ) : null}
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
        </div>
        {badge ? (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {badge}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
          {description}
        </p>
      ) : null}
      {disabled && reason ? (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{reason}</p>
      ) : null}
    </div>
  )

  const className = cn(
    "group relative block rounded-lg border p-4 transition-colors",
    toneMap[tone],
    disabled && "opacity-60 pointer-events-none",
  )

  if (disabled) return <div className={className}>{body}</div>
  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  )
}

export interface RouteLauncherGridProps {
  children: ReactNode
}

export function RouteLauncherGrid({ children }: RouteLauncherGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  )
}

export interface LauncherSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export function LauncherSection({
  title,
  description,
  children,
}: LauncherSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  )
}
