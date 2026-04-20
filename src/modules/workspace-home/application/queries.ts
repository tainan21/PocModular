import { getRegistryView } from "@host/runtime/registry-view"
import { getPlatformStore } from "@server/platform/storage"
import {
  composeDashboard,
  type AvailableModule,
  type DashboardContributionInput,
  type UserDashboardItemInput,
  type ComposedKpi,
  type ComposedWidget,
} from "@domains/dashboard/application/dashboard-composition"
import type { WidgetComponent } from "@host/core/contracts"

export interface ResolvedKpi extends ComposedKpi {
  moduleName: string
  Component: WidgetComponent
}
export interface ResolvedWidget extends ComposedWidget {
  moduleName: string
  Component: WidgetComponent
}
export interface ResolvedDashboard {
  kpis: ResolvedKpi[]
  widgets: ResolvedWidget[]
}

/**
 * Carrega o dashboard do usuário:
 * - coleta módulos disponíveis e suas contribuições (via registry-view, já com
 *   catálogo + seleção aplicados)
 * - lê a preferência persistida do usuário (UserDashboardItem)
 * - compõe tudo com funções puras do domínio `dashboard`
 * - resolve cada widgetKey para um componente real do manifest
 */
export async function loadUserDashboard(): Promise<ResolvedDashboard> {
  // v5: toda leitura externa passa pela factory — mesmo caminho que a Platform API.
  const store = await getPlatformStore()
  const [userId, registry] = await Promise.all([
    store.getDemoUserId(),
    getRegistryView(),
  ])

  const available: AvailableModule[] = []
  const contribs: DashboardContributionInput[] = []
  const moduleNameById = new Map<string, string>()

  for (const info of registry.describeAll()) {
    if (info.effectiveState !== "available") continue
    const m = info.manifest
    moduleNameById.set(m.id, m.name)
    available.push({ moduleId: m.id, manifestOrder: m.order ?? 999 })
    for (const c of m.contributions ?? []) {
      if (c.kind === "dashboard-widget") {
        contribs.push({
          moduleId: m.id,
          kind: "dashboard-widget",
          key: c.key,
          widgetKey: c.widgetKey,
          title: c.title,
          description: c.description,
          size: c.size,
          order: c.order,
        })
      } else if (c.kind === "dashboard-kpi") {
        contribs.push({
          moduleId: m.id,
          kind: "dashboard-kpi",
          key: c.key,
          widgetKey: c.widgetKey,
          label: c.label,
          order: c.order,
        })
      }
    }
  }

  const userItems: UserDashboardItemInput[] = await store.loadUserDashboardItems(userId)

  const composed = composeDashboard(available, contribs, userItems)

  const kpis: ResolvedKpi[] = []
  for (const k of composed.kpis) {
    const manifest = registry.get(k.moduleId)!
    const Component = manifest.widgets?.[k.widgetKey]
    if (!Component) continue
    kpis.push({ ...k, moduleName: moduleNameById.get(k.moduleId)!, Component })
  }
  const widgets: ResolvedWidget[] = []
  for (const w of composed.widgets) {
    const manifest = registry.get(w.moduleId)!
    const Component = manifest.widgets?.[w.widgetKey]
    if (!Component) continue
    widgets.push({ ...w, moduleName: moduleNameById.get(w.moduleId)!, Component })
  }
  return { kpis, widgets }
}
