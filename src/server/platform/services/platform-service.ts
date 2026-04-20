/**
 * PlatformService — fachada de leitura da plataforma (v5).
 *
 * Usa:
 *  - o registry (fonte da verdade dos manifests)
 *  - o PlatformStateStore (único ponto de I/O da plataforma)
 *
 * Produz:
 *  - ModuleDTO[], CatalogEntryDTO[], FeatureDTO[], RuntimeInfoDTO[],
 *    RouteEntryDTO[], HealthDTO — com paginação e filtros opcionais.
 *
 * Consumidor nativo: route handlers em app/api/platform/**.
 * O launcher, o Control Center e consumidores externos (apps/admin-preview)
 * consomem via platform-client (local ou http), que é um wrapper fino
 * sobre este service.
 */

import { getRegistry } from "@host/registry"
import { getRegistryView } from "@host/runtime/registry-view"
import {
  getPlatformStore,
  getPlatformStoreKind,
  isPlatformStoreDegraded,
} from "@server/platform/storage"
import {
  serializeManifest,
  serializeCatalogEntry,
  serializeRuntimeInfo,
  serializeFeature,
  serializeNavItem,
} from "@server/platform/serializers/manifest-serializer"
import type {
  ModuleDTO,
  CatalogEntryDTO,
  RuntimeInfoDTO,
  FeatureDTO,
  RouteEntryDTO,
  HealthDTO,
  Page,
  ModulesQuery,
  FeaturesQuery,
  CatalogQuery,
  RuntimeQuery,
} from "@poc/platform-contracts"

const API_VERSION = "v5"

// ---------------------------------------------------------------------------
// Helpers de paginação / busca.

function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), pageCount)
  const start = (current - 1) * pageSize
  const end = start + pageSize
  return {
    items: items.slice(start, end),
    meta: {
      page: current,
      pageSize,
      total,
      pageCount,
      hasNext: current < pageCount,
      hasPrev: current > 1,
    },
  }
}

function matchesText(haystack: (string | undefined)[], q: string): boolean {
  const needle = q.toLowerCase()
  for (const h of haystack) {
    if (h && h.toLowerCase().includes(needle)) return true
  }
  return false
}

function normalize(req: { page?: number; pageSize?: number } | undefined): {
  page: number
  pageSize: number
} {
  const page = req?.page && req.page > 0 ? req.page : 1
  const pageSize = Math.min(Math.max(req?.pageSize ?? 50, 1), 200)
  return { page, pageSize }
}

// ---------------------------------------------------------------------------

export async function listModulesDTO(query: ModulesQuery = {}): Promise<Page<ModuleDTO>> {
  const registry = getRegistry()
  const store = await getPlatformStore()
  const overrides = await store.loadModuleOverrides()
  let items = registry
    .listAll()
    .map((m) =>
      serializeManifest(m, registry.basePathOf(m.id), overrides[m.id]?.flags ?? {}),
    )

  if (query.area) items = items.filter((m) => m.area === query.area)
  if (query.status) items = items.filter((m) => m.status === query.status)
  if (query.q) items = items.filter((m) => matchesText([m.id, m.name, m.description, m.category], query.q!))

  const { page, pageSize } = normalize(query)
  return paginate(items, page, pageSize)
}

export async function getModuleDTO(id: string): Promise<ModuleDTO | null> {
  const registry = getRegistry()
  const m = registry.get(id)
  if (!m) return null
  const store = await getPlatformStore()
  const overrides = await store.loadModuleOverrides()
  return serializeManifest(m, registry.basePathOf(id), overrides[id]?.flags ?? {})
}

export async function listCatalogDTO(query: CatalogQuery = {}): Promise<Page<CatalogEntryDTO>> {
  const store = await getPlatformStore()
  const map = await store.loadCatalogMap()
  let items = Object.values(map).map(serializeCatalogEntry)

  if (query.pricingModel) items = items.filter((c) => c.pricingModel === query.pricingModel)
  if (typeof query.visibleInOnboarding === "boolean") {
    items = items.filter((c) => c.visibleInOnboarding === query.visibleInOnboarding)
  }
  if (query.q) items = items.filter((c) => matchesText([c.moduleId], query.q!))

  const { page, pageSize } = normalize(query)
  return paginate(items, page, pageSize)
}

export async function listFeaturesDTO(query: FeaturesQuery = {}): Promise<Page<FeatureDTO>> {
  const store = await getPlatformStore()
  const list = await store.loadFeatureCatalog()
  let items = list.map(serializeFeature)

  if (query.moduleId) items = items.filter((f) => f.moduleId === query.moduleId)
  if (query.administrableOnly) items = items.filter((f) => f.administrable)
  if (query.q) items = items.filter((f) => matchesText([f.key, f.label, f.description, f.moduleId], query.q!))

  const { page, pageSize } = normalize(query)
  return paginate(items, page, pageSize)
}

export async function listRuntimeDTO(query: RuntimeQuery = {}): Promise<Page<RuntimeInfoDTO>> {
  const view = await getRegistryView()
  const store = await getPlatformStore()
  const catalogMap = await store.loadCatalogMap()

  let items = view.describeAll().map((info) => {
    const dto = serializeRuntimeInfo(info)
    const real = catalogMap[info.manifest.id]
    if (real) dto.catalog.featureFlagged = real.featureFlagged
    return dto
  })

  if (query.effectiveState) items = items.filter((r) => r.effectiveState === query.effectiveState)
  if (query.q) items = items.filter((r) => matchesText([r.moduleId, r.reason], query.q!))

  const { page, pageSize } = normalize(query)
  return paginate(items, page, pageSize)
}

export async function listRoutesDTO(): Promise<RouteEntryDTO[]> {
  const view = await getRegistryView()
  return view.buildNavigation().map(serializeNavItem)
}

export async function getHealthDTO(): Promise<HealthDTO> {
  const registry = getRegistry()
  // Força init do store antes de reportar `kind`/`degraded`. Usamos a própria
  // chamada para saber se o fallback disparou, sem round-trip extra.
  const store = await getPlatformStore()
  const report = registry.validate()
  const degraded = isPlatformStoreDegraded()
  // Sentinel query barata — garante que o store ainda responde. Se tiver
  // virado memory via proxy, isso é O(1). Se for Prisma, é uma leitura trivial.
  void (await store.loadModuleOverrides())
  return {
    ok: true,
    platformVersion: API_VERSION,
    store: getPlatformStoreKind(),
    degraded,
    services: {
      modules: "ok",
      catalog: "ok",
      runtime: report.hasErrors ? "degraded" : "ok",
      onboarding: "ok",
      dashboard: "ok",
      admin: "ok",
      storage: degraded ? "degraded" : "ok",
    },
    registry: {
      moduleCount: registry.listAll().length,
      hasErrors: report.hasErrors,
      issueCount: report.issues.length,
    },
    generatedAt: new Date().toISOString(),
  }
}
