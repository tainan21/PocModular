import type { ReactNode } from "react"

/**
 * Seção de admin com duas colunas: `primary` à esquerda (mais larga)
 * e `side` à direita (metadados/side-cards). Usada pelo Control Center
 * quando uma linha do catálogo tem muito contexto a mostrar.
 */
export function AdminSplitSection({
  title,
  description,
  primary,
  side,
  actions,
}: {
  title: string
  description?: string
  primary: ReactNode
  side?: ReactNode
  actions?: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground text-pretty">
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </header>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div>{primary}</div>
        {side ? <aside className="flex flex-col gap-3">{side}</aside> : null}
      </div>
    </section>
  )
}
