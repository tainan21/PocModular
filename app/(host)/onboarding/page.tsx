import { redirect } from "next/navigation"
import {
  OnboardingStepShell,
  OnboardingChoiceCard,
  OnboardingProgress,
} from "@poc/module-ui"
import { Button } from "@/components/ui/button"
import { Briefcase, Rocket, User, Wrench } from "lucide-react"
import { setOnboardingIntentAction } from "./actions"
import { getPlatformClient } from "@server/platform/client"
import { stepLabels } from "@domains/onboarding/application/onboarding-rules"

const INTENTS = [
  {
    id: "pessoal" as const,
    title: "Organização pessoal",
    description: "Notas, tarefas e foco no dia-a-dia.",
    icon: User,
  },
  {
    id: "time" as const,
    title: "Time pequeno",
    description: "Colaboração leve, compartilhamento e visão de grupo.",
    icon: Briefcase,
  },
  {
    id: "operacao" as const,
    title: "Operação simples",
    description: "Catálogo, tarefas recorrentes, tudo em um lugar.",
    icon: Wrench,
  },
  {
    id: "explorar" as const,
    title: "Explorar a plataforma",
    description: "Sem compromisso — só quero ver o que tem.",
    icon: Rocket,
  },
]

export default async function OnboardingIntentPage() {
  const { state } = await getPlatformClient().getOnboarding()
  if (state.completed) redirect("/home")
  const preselected = state.intent ?? "pessoal"

  return (
    <OnboardingStepShell
      eyebrow="Passo 1 de 3"
      title="Como você pretende usar?"
      description="Sua escolha ajusta a recomendação de apps no próximo passo. Nenhum bloqueio: você pode mudar tudo depois no Control Center."
    >
      <OnboardingProgress total={3} current={1} labels={stepLabels()} />
      <form action={setOnboardingIntentAction} className="flex flex-col gap-6">
        <div className="grid gap-3 md:grid-cols-2">
          {INTENTS.map((it) => {
            const Icon = it.icon
            return (
              <OnboardingChoiceCard
                key={it.id}
                name="intent"
                value={it.id}
                title={it.title}
                description={it.description}
                selected={it.id === preselected}
                icon={<Icon className="size-4" />}
              />
            )
          })}
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Continuar
          </Button>
        </div>
      </form>
    </OnboardingStepShell>
  )
}
