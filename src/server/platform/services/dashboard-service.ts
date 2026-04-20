
/**
 * DashboardService — monta o dashboard do usuário em forma de DTO.
 *
 * Reusa a composição pura do domínio `dashboard` (mesma usada pelo RSC
 * do workspace-home). Aqui a diferença é que NÃO resolve componentes React:
 * devolve apenas `widgetKey` (o cliente resolve qual componente renderizar).
 * Isso mantém o DTO JSON-safe e consumível por outro app no futuro.
 */

import { getRegistryView } from "@host/runtime/registry-view"
import { getPlatformStore } from "@server/platform/storage"
import {
  composeDashboard,
  type AvailableModule,
  type DashboardContributionInput,
} from "@domains/dashboard/application/dashboard-composition"
import type { DashboardDTO } from "@poc/platform-contracts"

export async function getDashboardDTO(): Promise<DashboardDTO> {
  const store = await getPlatformStore()
  // userId e registry são independentes -> paralelo.
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

  const userItems = await store.loadUserDashboardItems(userId)
  const composed = composeDashboard(available, contribs, userItems)

  return {
    userId,
    kpis: composed.kpis.map((k, ix) => ({
      id: `${k.moduleId}:${k.key}`,
      moduleId: k.moduleId,
      moduleName: moduleNameById.get(k.moduleId) ?? k.moduleId,
      widgetKey: k.widgetKey,
      label: k.label,
      order: k.order ?? ix,
      visible: true,
    })),
    widgets: composed.widgets.map((w, ix) => ({
      id: `${w.moduleId}:${w.key}`,
      moduleId: w.moduleId,
      moduleName: moduleNameById.get(w.moduleId) ?? w.moduleId,
      widgetKey: w.widgetKey,
      title: w.title,
      description: w.description,
      size: w.size ?? "md",
      order: w.order ?? ix,
      visible: true,
    })),
    generatedAt: new Date().toISOString(),
  }
}
