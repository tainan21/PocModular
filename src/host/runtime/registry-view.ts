/**
 * registry-view — helper de leitura do registry em Server Components.
 *
 * Responsável por:
 *  1) carregar as 3 fontes externas: prefs, catálogo, seleção do usuário
 *  2) injetar tudo no ModuleRegistry via applyRuntimeContext
 *  3) devolver o registry pronto para uso
 *
 * Em v5 passamos a buscar TUDO via `getPlatformStore()` em vez de chamar os
 * helpers de runtime/*-state.ts diretamente. Isso garante que, quando o
 * Prisma estiver indisponível (sem DB, sem schema, etc.), o fallback para
 * MemoryPlatformStore também valha aqui — o registry-view é o caminho quente
 * que alimenta a Platform API inteira e não pode mais vazar Prisma para o
 * launcher.
 *
 * v5.1: wrap em `React.cache` para deduplicar chamadas DENTRO de uma mesma
 * request. O launcher chama listModules + listRuntime + getOnboarding +
 * getDashboard em paralelo, e cada um precisa do registry; sem cache seriam
 * 4x o mesmo trabalho. Com cache, é 1x por request (e nenhum overhead em
 * smokes/Node puro — `React.cache` apenas memoiza por escopo).
 */
import "server-only"
import { cache } from "react"
import { getRegistry } from "@host/registry"
import type { ModuleCatalogSummary } from "@host/core/contracts"
import { getPlatformStore } from "@server/platform/storage"
import type { ModuleCatalogEntryProps } from "@domains/platform-catalog"

function toSummary(entry: ModuleCatalogEntryProps): ModuleCatalogSummary {
  return {
    pricingModel: entry.pricingModel,
    priceCents: entry.priceCents ?? null,
    globallyEnabled: entry.globallyEnabled,
    visibleInOnboarding: entry.visibleInOnboarding,
    visibleInDashboard: entry.visibleInDashboard,
    onboardingOrder: entry.displayOrder,
  }
}

async function loadRegistryView() {
  const store = await getPlatformStore()
  const [overrides, catalog, userId] = await Promise.all([
    store.loadModuleOverrides(),
    store.loadCatalogMap(),
    store.getDemoUserId(),
  ])
  const selections = await store.loadSelectionMap(userId)

  const catalogSummary: Record<string, ModuleCatalogSummary> = {}
  for (const [id, entry] of Object.entries(catalog)) {
    catalogSummary[id] = toSummary(entry)
  }
  const userSelections: Record<string, boolean> = {}
  for (const [id, sel] of Object.entries(selections)) {
    userSelections[id] = sel.selected
  }

  const registry = getRegistry()
  registry.applyRuntimeContext({
    overrides,
    catalog: catalogSummary,
    userSelections,
    currentContext: "web",
  })
  return registry
}

export const getRegistryView = cache(loadRegistryView)
