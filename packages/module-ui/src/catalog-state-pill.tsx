import { cn } from "./cn"

export type EffectiveState =
  | "available"
  | "disabled"
  | "user-opt-out"
  | "blocked-by-dependency"
  | "blocked-by-context"

const labelMap: Record<EffectiveState, string> = {
  available: "Disponível",
  disabled: "Desligado",
  "user-opt-out": "Não selecionado",
  "blocked-by-dependency": "Dep. bloqueada",
  "blocked-by-context": "Contexto incompatível",
}

const toneMap: Record<EffectiveState, string> = {
  available:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  disabled: "bg-muted text-muted-foreground ring-muted/40",
  "user-opt-out":
    "bg-sky-500/10 text-sky-700 dark:text-sky-400 ring-sky-500/20",
  "blocked-by-dependency":
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  "blocked-by-context":
    "bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-500/20",
}

export function CatalogStatePill({
  state,
  className,
}: {
  state: EffectiveState
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1",
        toneMap[state],
        className,
      )}
    >
      {labelMap[state]}
    </span>
  )
}
