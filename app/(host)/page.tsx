import { Suspense } from "react"
import {
  PageShell,
  LauncherSection,
  RouteLauncherGrid,
  LauncherCard,
  LoadingPanel,
} from "@poc/module-ui"
import { getPlatformClient } from "@server/platform/client"

export const dynamic = "force-dynamic"

/**
 * LAUNCHER — rota `/`
 *
 * É a prova concreta de que um app separado (admin, mobile, Tauri)
 * conseguiria montar as mesmas seções consumindo apenas a Platform API.
 *
 * Aqui, DELIBERADAMENTE, não tocamos em Prisma, em `getRegistry()`
 * nem em runtime interno. Tudo vem do `PlatformClient` — que hoje
 * resolve para local in-process, e amanhã pode ser HTTP remoto.
 */
export default function LauncherPage() {
  return (
    <PageShell
      title="Launcher"
      description="Rotas disponíveis no host. Esta tela consome a Platform API como um app externo consumiria."
    >
      <Suspense fallback={<LoadingPanel label="Carregando plataforma..." />}>
        <LauncherBody />
      </Suspense>
    </PageShell>
  )
}

async function LauncherBody() {
  const platform = getPlatformClient()
  const [modulesPage, runtimePage, onboarding, health] = await Promise.all([
    platform.listModules({ pageSize: 200 }),
    platform.listRuntime({ pageSize: 200 }),
    platform.getOnboarding(),
    platform.getHealth(),
  ])
  const modules = modulesPage.items
  const runtime = runtimePage.items

  const runtimeById = new Map(runtime.map((r) => [r.moduleId, r]))
  const mainApps = modules.filter((m) => m.area === "main")
  const system = modules.filter((m) => m.area === "system")

  const onboardingDone = onboarding.state.completed

  return (
    <div className="flex flex-col gap-8">
      <LauncherSection
        title="Fluxo principal"
        description="Pontos de entrada do usuário demo."
      >
        <RouteLauncherGrid>
          <LauncherCard
            href="/home"
            title="Workspace"
            badge="Home"
            tone="system"
            description={
              onboardingDone
                ? "Seu dashboard composto com os apps escolhidos."
                : "Requer onboarding concluído."
            }
            disabled={!onboardingDone}
            reason={!onboardingDone ? "Termine o onboarding primeiro." : undefined}
          />
          <LauncherCard
            href="/onboarding"
            title="Onboarding"
            badge={onboardingDone ? "Ok" : "Pendente"}
            tone={onboardingDone ? "default" : "experimental"}
            description="Fluxo de 3 passos que monta o dashboard inicial."
          />
          <LauncherCard
            href="/admin"
            title="Control Center"
            badge="Sistema"
            tone="system"
            description="Admin do catálogo, flags, visibilidade. Mesmo conteúdo que um admin separado consumiria via API."
          />
          <LauncherCard
            href="/admin-preview"
            title="Admin Preview"
            badge="HTTP"
            tone="debug"
            description="Mesmas telas, mas consumindo só a Platform API via HTTP. Prova de que um admin em outro repo funcionaria."
          />
        </RouteLauncherGrid>
      </LauncherSection>

      <LauncherSection
        title={`Apps do catálogo (${mainApps.length})`}
        description="Módulos com área 'main'. O launcher respeita o estado efetivo retornado pela API."
      >
        <RouteLauncherGrid>
          {mainApps.map((m) => {
            const rt = runtimeById.get(m.id)
            const effective = rt?.effectiveState ?? "disabled-by-catalog"
            const blocked = effective !== "available"
            return (
              <LauncherCard
                key={m.id}
                href={m.basePath}
                title={m.name}
                badge={m.status}
                description={m.description}
                tone={m.status === "experimental" ? "experimental" : "default"}
                disabled={blocked}
                reason={blocked ? rt?.reason ?? effective : undefined}
              />
            )
          })}
        </RouteLauncherGrid>
      </LauncherSection>

      {system.length > 0 ? (
        <LauncherSection title="Módulos de sistema" description="Área 'system'.">
          <RouteLauncherGrid>
            {system.map((m) => (
              <LauncherCard
                key={m.id}
                href={m.basePath}
                title={m.name}
                badge={m.id}
                tone="system"
                description={m.description}
              />
            ))}
          </RouteLauncherGrid>
        </LauncherSection>
      ) : null}

      <LauncherSection
        title="Debug / Platform"
        description="Rotas que provam, sozinhas, que a plataforma está exposta como API."
      >
        <RouteLauncherGrid>
          <LauncherCard
            href="/debug/platform"
            title="Platform explorer"
            badge="Debug"
            tone="debug"
            description={`Store atual: ${health.store}${health.degraded ? " (degraded)" : ""}. Exemplos de chamadas, endpoints e payloads reais.`}
          />
          <LauncherCard
            href="/api/platform/health"
            title="GET /api/platform/health"
            badge="API"
            tone="debug"
            description="Endpoint cru. Abra em outra aba para ver o JSON."
          />
          <LauncherCard
            href="/api/platform/modules"
            title="GET /api/platform/modules"
            badge="API"
            tone="debug"
            description="Lista de módulos completa. Mesmo payload usado por esta home."
          />
        </RouteLauncherGrid>
      </LauncherSection>
    </div>
  )
}
