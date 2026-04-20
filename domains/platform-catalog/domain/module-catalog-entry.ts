/**
 * Entidade pura do catálogo de módulos. Sem Prisma, sem Next.
 * Representa a visão "comercial/operacional" de um módulo, separada
 * do manifest técnico.
 */

export type PricingModel = "free" | "paid" | "internal" | "experimental"

export interface ModuleCatalogEntryProps {
  moduleId: string
  pricingModel: PricingModel
  priceCents: number | null
  globallyEnabled: boolean
  visibleInOnboarding: boolean
  visibleInDashboard: boolean
  featureFlagged: boolean
  displayOrder: number
}

/**
 * Cria a entrada a partir de defaults. Útil para módulos recém-descobertos
 * que ainda não têm registro no catálogo.
 */
export function defaultCatalogEntry(moduleId: string): ModuleCatalogEntryProps {
  return {
    moduleId,
    pricingModel: "free",
    priceCents: null,
    globallyEnabled: true,
    visibleInOnboarding: true,
    visibleInDashboard: true,
    featureFlagged: false,
    displayOrder: 0,
  }
}

export function isPaid(entry: ModuleCatalogEntryProps): boolean {
  return entry.pricingModel === "paid"
}

export function isInternal(entry: ModuleCatalogEntryProps): boolean {
  return entry.pricingModel === "internal"
}
