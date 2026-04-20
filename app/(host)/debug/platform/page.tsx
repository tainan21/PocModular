import { Suspense } from "react"
import {
  PageShell,
  ApiSurfaceCard,
  LoadingPanel,
  Card,
} from "@poc/module-ui"
import { PlatformEndpoints } from "@poc/platform-contracts/endpoints"
import { getPlatformClient } from "@server/platform/client"

export const dynamic = "force-dynamic"

export default function PlatformDebugPage() {
  return (
    <PageShell
      title="Platform explorer"
      description="Superfície pública da plataforma. Esta mesma API alimentará o admin separado no futuro."
    >
      <Suspense fallback={<LoadingPanel label="Consultando /api/platform..." />}>
        <DebugBody />
      </Suspense>
    </PageShell>
  )
}

async function DebugBody() {
  const platform = getPlatformClient()
  const [health, modulesPage, catalogPage, featuresPage, routes, dashboard, onboarding] =
    await Promise.all([
      platform.getHealth(),
      platform.listModules({ pageSize: 200 }),
      platform.listCatalog({ pageSize: 200 }),
      platform.listFeatures({ pageSize: 200 }),
      platform.listRoutes(),
      platform.getDashboard(),
      platform.getOnboarding(),
    ])
  const modules = modulesPage.items
  const catalog = catalogPage.items
  const features = featuresPage.items

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-3">
          <header className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold">Health</h3>
            <p className="text-sm text-muted-foreground">
              Ponto de sanidade. Quem está atendendo agora e com qual store.
            </p>
          </header>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-4">
            <HealthItem label="Platform version" value={health.platformVersion} />
            <HealthItem
              label="Store"
              value={health.degraded ? `${health.store} (degraded)` : health.store}
            />
            <HealthItem
              label="Módulos"
              value={`${health.registry.moduleCount} (${health.registry.issueCount} issues)`}
            />
            <HealthItem
              label="Serviços"
              value={Object.entries(health.services)
                .map(([k, v]) => `${k}:${v}`)
                .join(" · ")}
            />
          </dl>
        </div>
      </Card>

      <ApiSurfaceCard
        title="Leitura"
        description="Endpoints de leitura usados por home, admin e dashboards."
        baseUrl="/api/platform"
        endpoints={[
          { method: "GET", path: PlatformEndpoints.health, description: "Sanidade da plataforma" },
          { method: "GET", path: PlatformEndpoints.modules, description: `Módulos com manifest resolvido (${modules.length})` },
          { method: "GET", path: "/api/platform/modules/:id", description: "Detalhe de um módulo específico" },
          { method: "GET", path: PlatformEndpoints.features, description: `Features declaradas (${features.length})` },
          { method: "GET", path: PlatformEndpoints.catalog, description: `Catálogo administrativo (${catalog.length} entradas)` },
          { method: "GET", path: PlatformEndpoints.runtime, description: "Estado efetivo derivado do runtime" },
          { method: "GET", path: PlatformEndpoints.routes, description: `Rotas reais agregadas (${routes.length})` },
          { method: "GET", path: PlatformEndpoints.dashboard, description: `Dashboard composto (${dashboard.kpis.length} kpis, ${dashboard.widgets.length} widgets)` },
          { method: "GET", path: PlatformEndpoints.onboarding, description: `Onboarding do usuário (${onboarding.state.completed ? "completo" : "pendente"})` },
        ]}
      />

      <ApiSurfaceCard
        title="Escrita"
        description="Endpoints usados pelo Control Center e pelo próprio fluxo de onboarding. Qualquer app externo pode chamá-los do mesmo jeito."
        baseUrl="/api/platform"
        endpoints={[
          { method: "POST", path: PlatformEndpoints.onboardingIntent, description: "Persiste intenção declarada no passo 1" },
          { method: "POST", path: PlatformEndpoints.onboardingSelection, description: "Substitui a seleção de módulos" },
          { method: "POST", path: PlatformEndpoints.onboardingFinish, description: "Marca onboarding como concluído e monta dashboard inicial" },
          { method: "POST", path: PlatformEndpoints.adminCatalog, description: "Upsert de entrada do catálogo (pricing, visibilidade, enabled)" },
          { method: "POST", path: PlatformEndpoints.adminFlag, description: "Toggle granular de feature flag declarada" },
          { method: "POST", path: PlatformEndpoints.adminReset, description: "Reset do demo user (apaga onboarding/seleção/dashboard)" },
        ]}
      />

      <Card>
        <div className="flex flex-col gap-3">
          <header className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold">Como outro app consumiria</h3>
            <p className="text-sm text-muted-foreground">
              A única alteração para sair de in-process para HTTP: definir POC_PLATFORM_API_URL.
            </p>
          </header>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed text-muted-foreground">
{`# monorepo, mesmo processo (hoje):
import { getPlatformClient } from "@server/platform/client"
const platform = getPlatformClient()
const { items, meta } = await platform.listModules({ page: 1, pageSize: 50 })

# outro app / outro repo (amanhã):
import { createHttpPlatformClient } from "@poc/platform-client"
const platform = createHttpPlatformClient({
  baseUrl: process.env.POC_PLATFORM_API_URL,
  actor: "admin:alice", // -> X-Platform-Actor
})
const { items, meta } = await platform.listModules({ q: "not", area: "main" })
`}
          </pre>
        </div>
      </Card>
    </div>
  )
}

function HealthItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border bg-background p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="font-mono text-xs">{value}</dd>
    </div>
  )
}
