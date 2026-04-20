import Link from "next/link"
import { redirect } from "next/navigation"
import {
  OnboardingStepShell,
  OnboardingProgress,
  DashboardGrid,
  DashboardWidgetCard,
} from "@poc/module-ui"
import { Button } from "@/components/ui/button"
import { getPlatformClient } from "@server/platform/client"
import { stepLabels } from "@domains/onboarding/application/onboarding-rules"
import { finishOnboardingAction } from "../actions"

export default async function OnboardingReviewPage() {
  const platform = getPlatformClient()
  const { state } = await platform.getOnboarding()
  if (state.intent === undefined) redirect("/onboarding")
  if (state.selectedModuleIds.length === 0) redirect("/onboarding/2")
  if (state.completed) redirect("/home")

  // Preview do dashboard: o próprio service compõe a seleção que o step 2
  // já persistiu, então este preview é real, não simulado.
  const dashboard = await platform.getDashboard()

  return (
    <OnboardingStepShell
      eyebrow="Passo 3 de 3"
      title="Pronto? Este é o seu dashboard inicial."
      description="Você pode reorganizar e esconder itens no Control Center depois."
    >
      <OnboardingProgress total={3} current={3} labels={stepLabels()} />

      {dashboard.widgets.length === 0 ? (
        <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
          Os apps escolhidos ainda não expõem widgets — o dashboard começa
          vazio e você compõe depois.
        </p>
      ) : (
        <DashboardGrid>
          {dashboard.widgets.slice(0, 4).map((w) => (
            <DashboardWidgetCard
              key={w.id}
              title={w.title}
              description={w.description}
              size={w.size}
              eyebrow={w.moduleName}
            >
              <p className="text-sm text-muted-foreground">
                Preview — o widget real será renderizado pelo módulo
                {" "}
                <span className="font-medium text-foreground">{w.moduleName}</span>.
              </p>
            </DashboardWidgetCard>
          ))}
        </DashboardGrid>
      )}

      <form
        action={finishOnboardingAction}
        className="flex items-center justify-between pt-2"
      >
        <Link
          href="/onboarding/2"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Voltar
        </Link>
        <Button type="submit" size="lg">
          Entrar no workspace
        </Button>
      </form>
    </OnboardingStepShell>
  )
}
