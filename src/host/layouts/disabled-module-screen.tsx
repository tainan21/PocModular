import Link from "next/link"
import { PowerOff, Link as LinkIcon } from "lucide-react"
import { PageShell, StatusBadge } from "@poc/module-ui"
import type { ModuleRuntimeInfo } from "@host/core/contracts"

/**
 * Fallback quando uma rota foi resolvida mas o módulo está indisponível
 * (hard-disabled, desabilitado pelo usuário ou bloqueado por dependência).
 */
export function DisabledModuleScreen({ info }: { info: ModuleRuntimeInfo }) {
  const isBlocked = info.effectiveState === "blocked-by-dependency"
  const Icon = isBlocked ? LinkIcon : PowerOff

  return (
    <PageShell
      title={info.manifest.name}
      description="Módulo indisponível no momento."
      actions={
        <StatusBadge tone="warning">
          {isBlocked ? "Dependência quebrada" : "Desabilitado"}
        </StatusBadge>
      }
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-4 rounded-lg border bg-card p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-base font-medium">Este módulo não pode ser aberto</p>
          <p className="max-w-prose text-sm text-muted-foreground">
            {info.reason ?? "O módulo está desabilitado."}
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          <Link
            href="/"
            className="inline-flex items-center rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted"
          >
            Voltar para Home
          </Link>
          <Link
            href="/m/settings-demo"
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Abrir configurações
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
