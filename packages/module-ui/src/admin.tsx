import type { ReactNode } from "react"

/**
 * Seção do admin: título + descrição + conteúdo. Uma "fatia" coesa da tela.
 */
export function AdminSection({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card">
      <header className="flex flex-col gap-1 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

/**
 * Linha de listagem tipo admin/table row. Título à esquerda, badges e
 * actions à direita. Stack em mobile.
 */
export function AdminRow({
  title,
  description,
  meta,
  badges,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  meta?: ReactNode
  badges?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b px-5 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{title}</span>
          {badges}
        </div>
        {description ? (
          <p className="text-pretty text-sm text-muted-foreground">{description}</p>
        ) : null}
        {meta ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {meta}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/**
 * Empty state compacto para dentro de uma AdminSection.
 */
export function AdminEmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 border-b px-5 py-10 text-center last:border-b-0">
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="max-w-md text-pretty text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}
