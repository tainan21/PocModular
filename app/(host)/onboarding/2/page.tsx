import Link from "next/link"
import { redirect } from "next/navigation"
import {
  OnboardingStepShell,
  OnboardingProgress,
  OnboardingModulePick,
  PricingBadge,
} from "@poc/module-ui"
import { Button } from "@/components/ui/button"
import { ManifestIcon } from "@host/navigation/icon"
import { getPlatformClient } from "@server/platform/client"
import {
  stepLabels,
  suggestedModulesForIntent,
  type OnboardingIntent,
} from "@domains/onboarding/application/onboarding-rules"
import { setOnboardingSelectionAction } from "../actions"

export default async function OnboardingSelectionPage() {
  const snapshot = await getPlatformClient().getOnboarding()
  const { state, availableModules } = snapshot
  if (state.intent === undefined) redirect("/onboarding")
  if (state.completed) redirect("/home")

  const suggestion = state.selectedModuleIds.length
    ? state.selectedModuleIds
    : suggestedModulesForIntent(
        state.intent as OnboardingIntent,
        availableModules.map((c) => c.moduleId),
      )
  const preselected = new Set(suggestion)

  return (
    <OnboardingStepShell
      eyebrow="Passo 2 de 3"
      title="Quais apps você quer montar?"
      description="Começamos com nossa sugestão com base no que você escolheu. Você pode ligar/desligar no Control Center a qualquer momento."
    >
      <OnboardingProgress total={3} current={2} labels={stepLabels()} />
      <form action={setOnboardingSelectionAction} className="flex flex-col gap-6">
        <div className="grid gap-3 md:grid-cols-2">
          {availableModules.map((m) => (
            <OnboardingModulePick
              key={m.moduleId}
              name="moduleId"
              value={m.moduleId}
              title={m.name}
              description={m.description}
              icon={<ManifestIcon name={m.icon} className="size-4" />}
              selected={preselected.has(m.moduleId)}
              badges={<PricingBadge model={m.pricingModel} priceCents={m.priceCents} />}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Link
            href="/onboarding"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Voltar
          </Link>
          <Button type="submit" size="lg">
            Continuar
          </Button>
        </div>
      </form>
    </OnboardingStepShell>
  )
}
