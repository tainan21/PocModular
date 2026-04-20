import type { ReactNode } from "react"

type Tone = "neutral" | "info" | "success" | "warning" | "muted"
type ModuleStatus = "active" | "experimental" | "disabled" | "hidden"

const toneMap: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground ring-secondary/40",
  info: "bg-primary/10 text-primary ring-primary/20",
  success:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  warning:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  muted: "bg-muted text-muted-foreground ring-muted/40",
}

const statusToTone: Record<ModuleStatus, Tone> = {
  active: "info",
  experimental: "warning",
  disabled: "muted",
  hidden: "neutral",
}

type Props =
  | { tone?: Tone; children: ReactNode; status?: never }
  | { status: ModuleStatus; children?: ReactNode; tone?: never }

/**
 * Badge pequeno e reutilizável.
 * - Passe `status` para rotular um módulo (active/experimental/…).
 * - Passe `tone + children` para qualquer outro uso livre.
 */
export function StatusBadge(props: Props) {
  const tone =
    "status" in props && props.status
      ? statusToTone[props.status]
      : (props.tone ?? "neutral")
  const content =
    "status" in props && props.status ? (props.children ?? props.status) : props.children
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${toneMap[tone]}`}
    >
      {content}
    </span>
  )
}
