import { Suspense } from "react"
import Link from "next/link"
import {
  PageShell,
  DashboardGrid,
  DashboardWidgetCard,
  DashboardKpiCard,
  EmptyState,
  LoadingPanel,
} from "@poc/module-ui"
import { Button } from "@/components/ui/button"
import type { ScreenComponent } from "@host/core/contracts"
import { loadUserDashboard } from "../../application/queries"

/**
 * Dashboard componível do usuário.
 *
 * O módulo workspace-home não conhece notes/tasks/catalog:
 * - lê CONTRIBUIÇÕES publicadas pelos manifests
 * - monta a UI a partir delas
 * - cada widget é renderizado como uma ilha RSC independente (Suspense)
 */
export const WorkspaceHomeScreen: ScreenComponent = async () => {
  const { kpis, widgets } = await loadUserDashboard()

  if (kpis.length === 0 && widgets.length === 0) {
    return (
      <PageShell title="Dashboard" description="Nenhum widget ativo para o seu usuário demo.">
        <EmptyState
          title="Dashboard vazio"
          description="Nenhum módulo disponível publicou widgets. Passe pelo onboarding ou habilite módulos no Control Center."
          action={
            <Button asChild>
              <Link href="/onboarding">Ir para onboarding</Link>
            </Button>
          }
        />
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Bom te ver de novo"
      description="Seu dashboard é montado a partir das contribuições dos módulos ativos."
    >
      {kpis.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map((k) => {
            const Widget = k.Component
            return (
              <DashboardKpiCard
                key={`${k.moduleId}::${k.key}`}
                label={k.label}
                value={
                  <Suspense fallback={<span className="text-muted-foreground">…</span>}>
                    <Widget />
                  </Suspense>
                }
                hint={k.moduleName}
              />
            )
          })}
        </div>
      ) : null}

      {widgets.length > 0 ? (
        <DashboardGrid>
          {widgets.map((w) => {
            const Widget = w.Component
            return (
              <DashboardWidgetCard
                key={`${w.moduleId}::${w.key}`}
                title={w.title}
                description={w.description}
                eyebrow={w.moduleName}
                size={w.size}
              >
                <Suspense fallback={<LoadingPanel label="" />}>
                  <Widget />
                </Suspense>
              </DashboardWidgetCard>
            )
          })}
        </DashboardGrid>
      ) : null}
    </PageShell>
  )
}
