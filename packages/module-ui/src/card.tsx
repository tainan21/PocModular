import type { ReactNode } from "react"

/**
 * Card neutro. Substitui "div + classes repetidas" que viviam espalhadas.
 * Existe dentro do package porque todos os módulos precisam dele.
 */
export function Card(props: { children: ReactNode; className?: string }) {
  const extra = props.className ? ` ${props.className}` : ""
  return (
    <div className={`rounded-lg border bg-card p-4 text-card-foreground shadow-sm${extra}`}>
      {props.children}
    </div>
  )
}

export function CardRow(props: { children: ReactNode; className?: string }) {
  const extra = props.className ? ` ${props.className}` : ""
  return <div className={`flex items-center justify-between gap-4${extra}`}>{props.children}</div>
}
