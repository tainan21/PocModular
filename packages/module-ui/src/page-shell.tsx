import type { ReactNode } from "react"

/**
 * PageShell é o wrapper padrão de qualquer screen de módulo.
 * Entrega estrutura previsível (title + description + actions) sem
 * conhecer nada do domínio, do framework de roteamento ou do host.
 */
export function PageShell(props: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2 border-b pb-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-pretty text-2xl font-semibold tracking-tight">{props.title}</h1>
          {props.description ? (
            <p className="text-pretty text-sm text-muted-foreground">{props.description}</p>
          ) : null}
        </div>
        {props.actions ? <div className="flex shrink-0 items-center gap-2">{props.actions}</div> : null}
      </header>
      <div className="flex flex-col gap-6">{props.children}</div>
    </div>
  )
}
