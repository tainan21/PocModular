
/**
 * AdminService — operações de administração da plataforma.
 *
 * Este é o serviço que o Control Center consome hoje e que um admin
 * separado (outro app, mesmo monorepo ou não) consumirá amanhã.
 *
 * Regra: nada de redirects / revalidation aqui. Quem orquestra UX
 * (server actions, route handlers) cuida disso.
 */

import { getRegistry } from "@host/registry"
import { getPlatformStore } from "@server/platform/storage"
import type {
  AdminSaveCatalogRequest,
  AdminSetFlagRequest,
  OkResponse,
} from "@poc/platform-contracts"
import { PlatformError } from "@poc/platform-contracts"

export async function saveCatalogEntry(
  req: AdminSaveCatalogRequest,
): Promise<OkResponse> {
  if (!req?.moduleId) {
    throw new PlatformError("invalid_input", "moduleId é obrigatório")
  }
  const registry = getRegistry()
  if (!registry.get(req.moduleId)) {
    throw new PlatformError("not_found", `Módulo desconhecido: ${req.moduleId}`)
  }
  const store = await getPlatformStore()
  await store.upsertCatalogEntry({
    moduleId: req.moduleId,
    pricingModel: req.pricingModel,
    priceCents: req.priceCents,
    globallyEnabled: req.globallyEnabled,
    visibleInOnboarding: req.visibleInOnboarding,
    visibleInDashboard: req.visibleInDashboard,
    featureFlagged: req.featureFlagged,
    displayOrder: req.displayOrder,
  })
  return { ok: true }
}

export async function setModuleFlag(
  req: AdminSetFlagRequest,
): Promise<OkResponse> {
  if (!req?.moduleId || !req?.flagKey) {
    throw new PlatformError("invalid_input", "moduleId e flagKey são obrigatórios")
  }
  const registry = getRegistry()
  const manifest = registry.get(req.moduleId)
  if (!manifest) {
    throw new PlatformError("not_found", `Módulo desconhecido: ${req.moduleId}`)
  }
  const declared = (manifest.featureFlags ?? []).some((f) => f.key === req.flagKey)
  if (!declared) {
    throw new PlatformError(
      "invalid_input",
      `Flag "${req.flagKey}" não é declarada por "${req.moduleId}"`,
    )
  }
  const store = await getPlatformStore()
  await store.setModuleFlag(req.moduleId, req.flagKey, !!req.value)
  return { ok: true }
}
