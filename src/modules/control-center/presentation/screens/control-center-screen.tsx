import Link from "next/link"
import {
  PageShell,
  AdminSection,
  AdminRow,
  AdminSplitSection,
  AdminEmptyState,
  StatusBadge,
  PricingBadge,
  CatalogStatePill,
  ModuleMetaPanel,
  FeatureMetaTable,
  type FeatureRow,
} from "@poc/module-ui"
import type {
  ModuleDTO,
  RuntimeInfoDTO,
  CatalogEntryDTO,
  RouteEntryDTO,
  FeatureDTO,
  FeatureFlagDTO,
} from "@poc/platform-contracts"
import { loadAdminOverview } from "../../application/queries"
import {
  saveCatalogEntryAction,
  saveFlagsAction,
  resetOnboardingAction,
} from "../../application/actions"

/**
 * Control Center v4 — consome 100% a Platform API (DTOs serializáveis).
 * Cruzamento: ModuleDTO (manifest) × RuntimeInfoDTO (estado efetivo) × CatalogEntryDTO (pricing/visibility).
 *
 * Quando existir um admin rodando separado, esta mesma tela funciona sem mudança
 * de shape — só alterando POC_PLATFORM_API_URL.
 */
export async function ControlCenterScreen() {
  const { modules, runtime, catalog, features, routes } = await loadAdminOverview()

  const runtimeById = new Map(runtime.map((r) => [r.moduleId, r]))
  const routesByModule = new Map<string, RouteEntryDTO[]>()
  for (const r of routes) {
    const list = routesByModule.get(r.moduleId) ?? []
    list.push(r)
    routesByModule.set(r.moduleId, list)
  }
  const featuresByModule = new Map<string, FeatureDTO[]>()
  for (const f of features) {
    const list = featuresByModule.get(f.moduleId) ?? []
    list.push(f)
    featuresByModule.set(f.moduleId, list)
  }

  const main = modules.filter((m) => m.area === "main")
  const system = modules.filter((m) => m.area === "system")
  const other = modules.filter((m) => m.area !== "main" && m.area !== "system")

  return (
    <PageShell
      title="Control Center"
      description="Admin da plataforma. Toda leitura e escrita aqui passa por /api/platform — o mesmo contrato que um admin futuro usará."
    >
      <AdminSection
        title="Demo"
        description="Reset do estado do demo user. Útil para rodar o onboarding de novo."
      >
        <AdminRow
          title="Refazer onboarding"
          description="Apaga onboarding, seleção de apps e dashboard do demo user."
          actions={
            <form action={resetOnboardingAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
              >
                Resetar e começar de novo
              </button>
            </form>
          }
        />
      </AdminSection>

      <AdminSection
        title={`Visão geral (${modules.length} módulos)`}
        description="Estado efetivo derivado do catálogo, da seleção do usuário e das dependências."
      >
        {modules.length === 0 ? (
          <AdminEmptyState
            title="Nenhum módulo registrado"
            description="Adicione manifests em src/modules/all-manifests.ts."
          />
        ) : (
          <ModuleOverviewBlock
            heading="Apps"
            list={main}
            runtimeById={runtimeById}
            catalog={catalog}
          />
        )}
        {system.length > 0 ? (
          <ModuleOverviewBlock
            heading="Sistema"
            list={system}
            runtimeById={runtimeById}
            catalog={catalog}
          />
        ) : null}
        {other.length > 0 ? (
          <ModuleOverviewBlock
            heading="Outras áreas"
            list={other}
            runtimeById={runtimeById}
            catalog={catalog}
          />
        ) : null}
      </AdminSection>

      {modules.map((mod) => {
        const rt = runtimeById.get(mod.id)
        const cat = catalog[mod.id]
        const modRoutes = routesByModule.get(mod.id) ?? []
        const modFeatures = featuresByModule.get(mod.id) ?? []

        return (
          <AdminSplitSection
            key={`detail-${mod.id}`}
            title={`${mod.name} · ${mod.id}`}
            description={mod.description}
            actions={
              <Link
                href={`/admin/flags/${mod.id}`}
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Abrir tela de flags →
              </Link>
            }
            primary={
              <div className="flex flex-col gap-4">
                <ModuleMetaPanel
                  moduleId={mod.id}
                  version={mod.version}
                  area={mod.area}
                  basePath={mod.basePath}
                  routes={modRoutes.map((r) => ({
                    path: r.href,
                    fullPath: r.href,
                    label: r.label,
                  }))}
                  capabilities={mod.capabilities}
                  contexts={mod.supportedContexts}
                  dependencies={mod.dependencies}
                />

                <CatalogForm moduleId={mod.id} catalog={cat} />
                <FlagsForm moduleId={mod.id} flags={mod.featureFlags} />

                {modFeatures.length > 0 ? (
                  <FeatureMetaTable
                    rows={modFeatures.map<FeatureRow>((f) => ({
                      key: f.key,
                      label: f.label,
                      description: f.description,
                      moduleId: f.moduleId,
                      current: f.administrable,
                      default: f.default,
                      actions: null,
                    }))}
                  />
                ) : null}
              </div>
            }
            side={
              <div className="flex flex-col gap-3">
                <SideChip label="Estado efetivo">
                  {rt ? (
                    <>
                      <CatalogStatePill state={rt.effectiveState} />
                      {rt.reason ? (
                        <span className="text-xs text-muted-foreground">{rt.reason}</span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </SideChip>
                <SideChip label="Status do manifest">
                  <StatusBadge status={mod.status}>{mod.status}</StatusBadge>
                </SideChip>
                <SideChip label="Pricing">
                  {cat ? (
                    <PricingBadge
                      model={cat.pricingModel}
                      priceCents={cat.priceCents}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      sem entrada no catálogo
                    </span>
                  )}
                </SideChip>
                <SideChip label="Visibilidade">
                  <span className="text-xs text-muted-foreground">
                    onboarding {cat?.visibleInOnboarding ? "on" : "off"} · dashboard{" "}
                    {cat?.visibleInDashboard ? "on" : "off"}
                  </span>
                </SideChip>
              </div>
            }
          />
        )
      })}
    </PageShell>
  )
}

function ModuleOverviewBlock({
  heading,
  list,
  runtimeById,
  catalog,
}: {
  heading: string
  list: ModuleDTO[]
  runtimeById: Map<string, RuntimeInfoDTO>
  catalog: Record<string, CatalogEntryDTO>
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {heading}
      </span>
      {list.map((mod) => {
        const rt = runtimeById.get(mod.id)
        const cat = catalog[mod.id]
        return (
          <AdminRow
            key={mod.id}
            title={
              <span className="flex items-center gap-2">
                {mod.name}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {mod.id}
                </code>
              </span>
            }
            description={mod.description}
            badges={
              <>
                {rt ? <CatalogStatePill state={rt.effectiveState} /> : null}
                <StatusBadge status={mod.status}>{mod.status}</StatusBadge>
                {cat ? (
                  <PricingBadge
                    model={cat.pricingModel}
                    priceCents={cat.priceCents}
                  />
                ) : null}
              </>
            }
            meta={
              <>
                <span>v{mod.version}</span>
                <span>{mod.routes.length} rotas</span>
                <span>{mod.contributions.length} contribs</span>
                {mod.dependencies.length > 0 ? (
                  <span>deps: {mod.dependencies.join(", ")}</span>
                ) : null}
              </>
            }
            actions={
              <Link
                href={mod.basePath}
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Abrir →
              </Link>
            }
          />
        )
      })}
    </div>
  )
}

function SideChip({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-3">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

function CatalogForm({
  moduleId,
  catalog,
}: {
  moduleId: string
  catalog: CatalogEntryDTO | undefined
}) {
  const c = catalog
  return (
    <form
      action={saveCatalogEntryAction}
      className="flex flex-col gap-3 rounded-lg border bg-card p-4"
    >
      <input type="hidden" name="moduleId" value={moduleId} />
      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Catálogo
      </h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Pricing model
          <select
            name="pricingModel"
            defaultValue={c?.pricingModel ?? "free"}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="free">free</option>
            <option value="paid">paid</option>
            <option value="internal">internal</option>
            <option value="experimental">experimental</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Preço (centavos)
          <input
            type="number"
            name="priceCents"
            defaultValue={c?.priceCents ?? ""}
            placeholder="ex: 1990"
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Ordem
          <input
            type="number"
            name="displayOrder"
            defaultValue={c?.displayOrder ?? 0}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="globallyEnabled"
            defaultChecked={c?.globallyEnabled ?? true}
          />
          Globalmente habilitado
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="visibleInOnboarding"
            defaultChecked={c?.visibleInOnboarding ?? true}
          />
          Visível no onboarding
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="visibleInDashboard"
            defaultChecked={c?.visibleInDashboard ?? true}
          />
          Visível no dashboard
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="featureFlagged"
            defaultChecked={c?.featureFlagged ?? false}
          />
          Feature-flagged (rollout gradual)
        </label>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Salvar catálogo
        </button>
      </div>
    </form>
  )
}

function FlagsForm({
  moduleId,
  flags,
}: {
  moduleId: string
  flags: FeatureFlagDTO[]
}) {
  if (flags.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card p-4 text-center text-sm text-muted-foreground">
        Este módulo não declara feature flags.
      </div>
    )
  }
  return (
    <form
      action={saveFlagsAction}
      className="flex flex-col gap-3 rounded-lg border bg-card p-4"
    >
      <input type="hidden" name="moduleId" value={moduleId} />
      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Feature flags ({flags.length})
      </h4>
      <div className="flex flex-col gap-2 text-sm">
        {flags.map((flag) => (
          <label key={flag.key} className="flex items-start gap-2">
            <input
              type="checkbox"
              name={`flag:${flag.key}`}
              defaultChecked={flag.current}
              className="mt-0.5"
            />
            <span className="flex flex-col">
              <span className="font-medium">{flag.label}</span>
              {flag.description ? (
                <span className="text-xs text-muted-foreground">{flag.description}</span>
              ) : null}
              <code className="font-mono text-[10px] text-muted-foreground">
                {flag.key} · default {flag.default ? "on" : "off"}
              </code>
            </span>
          </label>
        ))}
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Salvar flags
        </button>
      </div>
    </form>
  )
}
