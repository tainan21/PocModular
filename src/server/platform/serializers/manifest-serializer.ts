/**
 * Serializers puros: ModuleManifest -> ModuleDTO / CatalogEntry -> CatalogEntryDTO / etc.
 *
 * Por que puros: para que rotas de API, testes de smoke e consumidores
 * internos (launcher/admin) produzam exatamente o mesmo shape. Tudo que sai
 * daqui é JSON-safe.
 */
import type {
  ModuleManifest,
  ModuleRuntimeInfo,
  ResolvedNavItem,
  ModuleCatalogSummary,
} from "@host/core/contracts"
import type {
  ModuleDTO,
  CatalogEntryDTO,
  RuntimeInfoDTO,
  RouteEntryDTO,
  ContributionDTO,
  FeatureFlagDTO,
  ModuleRouteDTO,
  ModuleNavDTO,
  PricingModelDTO,
} from "@poc/platform-contracts"
import type { ModuleCatalogEntryProps, FeatureCatalogEntryProps } from "@domains/platform-catalog"

export function serializeManifest(
  m: ModuleManifest,
  basePath: string,
  flagOverrides: Record<string, boolean> = {},
): ModuleDTO {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    version: m.version,
    status: m.status,
    area: m.area,
    icon: m.icon,
    category: m.category,
    tags: m.tags,
    basePath,
    order: m.order ?? 999,
    enabledByDefault: m.enabledByDefault,
    capabilities: [...m.capabilities],
    dependencies: [...(m.dependencies ?? [])],
    supportedContexts: m.supportedContexts ?? ["web"],
    featureFlags: (m.featureFlags ?? []).map(
      (f): FeatureFlagDTO => ({
        key: f.key,
        label: f.label,
        description: f.description,
        default: f.default,
        current: flagOverrides[f.key] ?? f.default,
      }),
    ),
    contributions: (m.contributions ?? []).map(serializeContribution),
    routes: m.routes.map(
      (r): ModuleRouteDTO => ({
        path: r.path,
        label: r.label,
        screen: r.screen,
      }),
    ),
    navigation: m.navigation.map(
      (n): ModuleNavDTO => ({
        label: n.label,
        path: n.path,
        icon: n.icon,
        order: n.order,
      }),
    ),
    widgetKeys: Object.keys(m.widgets ?? {}),
  }
}

export function serializeContribution(c: NonNullable<ModuleManifest["contributions"]>[number]): ContributionDTO {
  switch (c.kind) {
    case "home-highlight":
      return { kind: "home-highlight", title: c.title, description: c.description, to: c.to }
    case "quick-action":
      return {
        kind: "quick-action",
        key: c.key,
        label: c.label,
        to: c.to,
        tone: c.tone,
      }
    case "dashboard-widget":
      return {
        kind: "dashboard-widget",
        key: c.key,
        widgetKey: c.widgetKey,
        title: c.title,
        description: c.description,
        size: c.size,
        order: c.order,
      }
    case "dashboard-kpi":
      return {
        kind: "dashboard-kpi",
        key: c.key,
        widgetKey: c.widgetKey,
        label: c.label,
        order: c.order,
      }
  }
}

export function serializeCatalogEntry(
  entry: ModuleCatalogEntryProps,
): CatalogEntryDTO {
  return {
    moduleId: entry.moduleId,
    pricingModel: entry.pricingModel as PricingModelDTO,
    priceCents: entry.priceCents ?? null,
    globallyEnabled: entry.globallyEnabled,
    visibleInOnboarding: entry.visibleInOnboarding,
    visibleInDashboard: entry.visibleInDashboard,
    featureFlagged: entry.featureFlagged,
    displayOrder: entry.displayOrder,
  }
}

export function serializeCatalogSummary(
  moduleId: string,
  summary: ModuleCatalogSummary,
  fallbackFeatureFlagged: boolean,
): CatalogEntryDTO {
  return {
    moduleId,
    pricingModel: summary.pricingModel as PricingModelDTO,
    priceCents: summary.priceCents ?? null,
    globallyEnabled: summary.globallyEnabled,
    visibleInOnboarding: summary.visibleInOnboarding,
    visibleInDashboard: summary.visibleInDashboard,
    featureFlagged: fallbackFeatureFlagged,
    displayOrder: summary.onboardingOrder,
  }
}

export function serializeRuntimeInfo(info: ModuleRuntimeInfo): RuntimeInfoDTO {
  return {
    moduleId: info.manifest.id,
    effectiveState: info.effectiveState,
    reason: info.reason,
    userSelected: info.userSelected,
    flags: { ...info.flags },
    catalog: serializeCatalogSummary(info.manifest.id, info.catalog, false),
  }
}

export function serializeFeature(f: FeatureCatalogEntryProps): {
  id: string
  moduleId: string
  key: string
  label: string
  description?: string
  default: boolean
  administrable: boolean
  pricingHint: PricingModelDTO | null
} {
  return {
    id: `${f.moduleId}:${f.featureKey}`,
    moduleId: f.moduleId,
    key: f.featureKey,
    label: f.label,
    description: f.description ?? undefined,
    default: f.defaultValue,
    administrable: f.enabled,
    pricingHint: f.priceCents != null && f.priceCents > 0 ? "paid" : null,
  }
}

export function serializeNavItem(nav: ResolvedNavItem): RouteEntryDTO {
  return {
    moduleId: nav.moduleId,
    moduleName: nav.moduleName,
    area: nav.area,
    href: nav.href,
    label: nav.label,
    icon: nav.icon,
    isNav: true,
  }
}
