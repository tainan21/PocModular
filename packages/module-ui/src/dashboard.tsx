import type { ReactNode } from "react"

/**
 * Grid que hospeda widgets do dashboard. Responsivo.
 */
export function DashboardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
  )
}

/**
 * Card de widget. Suporta tamanhos sm/md/lg e um eyebrow do módulo.
 */
export function DashboardWidgetCard({
  title,
  description,
  eyebrow,
  size = "md",
  footer,
  children,
}: {
  title: string
  description?: string
  eyebrow?: string
  size?: "sm" | "md" | "lg"
  footer?: ReactNode
  children: ReactNode
}) {
  const span =
    size === "lg"
      ? "md:col-span-2 xl:col-span-3"
      : size === "md"
        ? "xl:col-span-1"
        : ""
  return (
    <section
      className={`flex flex-col gap-3 rounded-lg border bg-card p-5 ${span}`}
    >
      <header className="flex flex-col gap-1">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </span>
        ) : null}
        <h3 className="text-pretty font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="text-pretty text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        ) : null}
      </header>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
      {footer ? (
        <footer className="border-t pt-3 text-xs text-muted-foreground">{footer}</footer>
      ) : null}
    </section>
  )
}

/**
 * Indicador curto label + valor, pensado para o topo do dashboard.
 */
export function DashboardKpiCard({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

/**
 * Faixa de KPIs horizontal.
 */
export function DashboardKpiRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  )
}
