import type { ReactNode } from "react"
import { Check } from "lucide-react"

/**
 * Shell visual de um passo do onboarding. Anima sutilmente a entrada.
 * Mantido sem Next e sem lógica: quem usa define o título/descrição/footer.
 */
export function OnboardingStepShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </span>
        <h1 className="text-pretty text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        ) : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
      {footer ? <div className="mt-2 flex items-center justify-between border-t pt-4">{footer}</div> : null}
    </div>
  )
}

/**
 * Indicador de progresso (x de N) para o onboarding.
 */
export function OnboardingProgress({
  total,
  current,
  labels,
}: {
  total: number
  current: number
  labels?: string[]
}) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progresso do onboarding">
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1
        const isDone = step < current
        const isActive = step === current
        const label = labels?.[i]
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={[
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                isDone
                  ? "border-primary bg-primary text-primary-foreground"
                  : isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground",
              ].join(" ")}
              aria-current={isActive ? "step" : undefined}
            >
              {isDone ? <Check className="size-3.5" aria-hidden /> : step}
            </span>
            {label ? (
              <span
                className={[
                  "text-sm",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {label}
              </span>
            ) : null}
            {step < total ? (
              <span className="mx-1 h-px w-6 bg-border" aria-hidden />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Card de escolha clicável (radio-like). Aceita selecionado ou não.
 * Usa <button> puro: o consumidor cuida do submit/form.
 */
export function OnboardingChoiceCard({
  title,
  description,
  icon,
  selected,
  name,
  value,
  tone = "default",
}: {
  title: string
  description?: string
  icon?: ReactNode
  selected?: boolean
  name: string
  value: string
  tone?: "default" | "primary"
}) {
  return (
    <label
      className={[
        "group relative flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-all",
        selected
          ? tone === "primary"
            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
            : "border-primary bg-accent"
          : "hover:border-primary/60 hover:bg-accent/50",
      ].join(" ")}
    >
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={selected}
        className="sr-only"
      />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-primary">{icon}</span> : null}
          <span className="font-medium">{title}</span>
        </div>
        <span
          className={[
            "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
          ].join(" ")}
          aria-hidden
        >
          {selected ? <Check className="size-3" /> : null}
        </span>
      </div>
      {description ? (
        <p className="text-pretty text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      ) : null}
    </label>
  )
}

/**
 * Card de módulo selecionável em checklist (multi-select).
 * Para o passo 2 do onboarding.
 */
export function OnboardingModulePick({
  title,
  description,
  icon,
  selected,
  disabled,
  name,
  value,
  badges,
}: {
  title: string
  description?: string
  icon?: ReactNode
  selected?: boolean
  disabled?: boolean
  name: string
  value: string
  badges?: ReactNode
}) {
  return (
    <label
      className={[
        "relative flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-all",
        disabled ? "cursor-not-allowed opacity-60" : "",
        selected
          ? "border-primary bg-accent ring-2 ring-primary/20"
          : "hover:border-primary/60 hover:bg-accent/50",
      ].join(" ")}
    >
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={selected}
        disabled={disabled}
        className="sr-only"
      />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-primary">{icon}</span> : null}
          <span className="font-medium">{title}</span>
        </div>
        <span
          className={[
            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
          ].join(" ")}
          aria-hidden
        >
          {selected ? <Check className="size-3" /> : null}
        </span>
      </div>
      {description ? (
        <p className="text-pretty text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      ) : null}
      {badges ? <div className="flex flex-wrap items-center gap-1.5">{badges}</div> : null}
    </label>
  )
}
