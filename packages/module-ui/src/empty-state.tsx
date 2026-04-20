import type { ReactNode } from "react"

/**
 * EmptyState reutilizável pelos módulos. Mantém o vocabulário visual
 * consistente em qualquer lista/feature sem domínio vazio.
 */
export function EmptyState(props: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-card px-6 py-12 text-center">
      <p className="text-base font-medium">{props.title}</p>
      {props.description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{props.description}</p>
      ) : null}
      {props.action ? <div className="mt-3">{props.action}</div> : null}
    </div>
  )
}
