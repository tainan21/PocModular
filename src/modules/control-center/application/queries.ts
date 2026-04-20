import "server-only"
import type {
  ModuleDTO,
  RuntimeInfoDTO,
  CatalogEntryDTO,
  FeatureDTO,
  RouteEntryDTO,
} from "@poc/platform-contracts"
import { getPlatformClient } from "@server/platform/client"

/**
 * View combinada usada pela UI do Control Center.
 * Contrato fechado em cima da Platform API (DTOs), não do runtime interno.
 * Um admin separado montaria a mesma view chamando o mesmo client.
 */
export interface AdminOverview {
  modules: ModuleDTO[]
  runtime: RuntimeInfoDTO[]
  catalog: Record<string, CatalogEntryDTO>
  features: FeatureDTO[]
  routes: RouteEntryDTO[]
}

export async function loadAdminOverview(): Promise<AdminOverview> {
  const platform = getPlatformClient()
  // pageSize alto porque o Control Center quer a lista inteira; a Platform API
  // sabe paginar, mas aqui queremos overview completo.
  const [modules, runtime, catalog, features, routes] = await Promise.all([
    platform.listModules({ pageSize: 200 }),
    platform.listRuntime({ pageSize: 200 }),
    platform.listCatalog({ pageSize: 200 }),
    platform.listFeatures({ pageSize: 200 }),
    platform.listRoutes(),
  ])

  const byId: Record<string, CatalogEntryDTO> = {}
  for (const c of catalog.items) byId[c.moduleId] = c

  return {
    modules: modules.items,
    runtime: runtime.items,
    catalog: byId,
    features: features.items,
    routes,
  }
}

export async function loadModuleDetail(moduleId: string): Promise<ModuleDTO> {
  const detail = await getPlatformClient().getModule(moduleId)
  if (!detail) throw new Error(`Módulo "${moduleId}" não encontrado no registry.`)
  return detail
}

/**
 * Usada pela tela de flags. Retorna o detail + o mapa "key -> current".
 * Mantém o mesmo contrato (FeatureFlagDTO já traz `current`).
 */
export async function listModuleFlags(moduleId: string): Promise<{
  detail: ModuleDTO
  flags: Record<string, boolean>
}> {
  const detail = await loadModuleDetail(moduleId)
  const flags: Record<string, boolean> = {}
  for (const f of detail.featureFlags) flags[f.key] = f.current
  return { detail, flags }
}
