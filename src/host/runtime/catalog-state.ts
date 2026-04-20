/**
 * I/O do catálogo administrável da plataforma.
 * Adapta Prisma <-> domínio puro (platform-catalog).
 */
import { prisma } from "@server/db/prisma"
import type {
  ModuleCatalogEntryProps,
  PricingModel,
  FeatureCatalogEntryProps,
} from "@domains/platform-catalog"

function toDomain(row: {
  moduleId: string
  pricingModel: string
  priceCents: number | null
  globallyEnabled: boolean
  visibleInOnboarding: boolean
  visibleInDashboard: boolean
  featureFlagged: boolean
  displayOrder: number
}): ModuleCatalogEntryProps {
  return {
    moduleId: row.moduleId,
    pricingModel: (row.pricingModel as PricingModel) ?? "free",
    priceCents: row.priceCents,
    globallyEnabled: row.globallyEnabled,
    visibleInOnboarding: row.visibleInOnboarding,
    visibleInDashboard: row.visibleInDashboard,
    featureFlagged: row.featureFlagged,
    displayOrder: row.displayOrder,
  }
}

export async function loadCatalogMap(): Promise<
  Record<string, ModuleCatalogEntryProps>
> {
  const rows = await prisma.moduleCatalogEntry.findMany()
  const map: Record<string, ModuleCatalogEntryProps> = {}
  for (const row of rows) {
    map[row.moduleId] = toDomain(row)
  }
  return map
}

export async function upsertCatalogEntry(
  entry: ModuleCatalogEntryProps,
): Promise<void> {
  await prisma.moduleCatalogEntry.upsert({
    where: { moduleId: entry.moduleId },
    create: entry,
    update: entry,
  })
}

export async function loadFeatureCatalog(): Promise<FeatureCatalogEntryProps[]> {
  const rows = await prisma.featureCatalogEntry.findMany()
  return rows.map((row) => ({
    moduleId: row.moduleId,
    featureKey: row.featureKey,
    label: row.label,
    description: row.description,
    defaultValue: row.defaultValue,
    enabled: row.enabled,
    priceCents: row.priceCents,
    visibleInOnboarding: row.visibleInOnboarding,
    visibleInDashboard: row.visibleInDashboard,
  }))
}

export async function upsertFeatureCatalog(
  entry: FeatureCatalogEntryProps,
): Promise<void> {
  await prisma.featureCatalogEntry.upsert({
    where: {
      moduleId_featureKey: { moduleId: entry.moduleId, featureKey: entry.featureKey },
    },
    create: entry,
    update: entry,
  })
}
