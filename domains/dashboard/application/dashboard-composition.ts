/**
 * Regras puras de composição do dashboard do usuário.
 *
 * Input:
 *  - Lista de módulos disponíveis (já filtrados por catálogo/seleção).
 *  - Contribuições declaradas por cada módulo.
 *  - UserDashboardItem[] (persistido), opcional.
 *
 * Output:
 *  - KPIs ordenados.
 *  - Widgets ordenados.
 *
 * Sem I/O. Sem React. Testável.
 */

export interface AvailableModule {
  moduleId: string
  manifestOrder: number
}

/** Shape neutro das contribuições que este domínio aceita. */
export interface DashboardContributionInput {
  moduleId: string
  kind: "dashboard-widget" | "dashboard-kpi"
  key: string
  widgetKey: string
  title?: string
  label?: string
  description?: string
  size?: "sm" | "md" | "lg"
  order?: number
}

/** Item persistido para um usuário. */
export interface UserDashboardItemInput {
  moduleId: string
  contributionKind: "dashboard-widget" | "dashboard-kpi" | "quick-action"
  contributionKey: string
  order: number
  visible: boolean
}

export interface ComposedKpi {
  moduleId: string
  key: string
  label: string
  widgetKey: string
  order: number
}

export interface ComposedWidget {
  moduleId: string
  key: string
  title: string
  description?: string
  widgetKey: string
  size: "sm" | "md" | "lg"
  order: number
}

export interface ComposedDashboard {
  kpis: ComposedKpi[]
  widgets: ComposedWidget[]
}

/**
 * Aplica a preferência do usuário (ordem/visibilidade) às contribuições
 * disponíveis. Se o usuário ainda não customizou (sem items), aceita
 * todas as contribuições dos módulos disponíveis pela ordem declarada.
 */
export function composeDashboard(
  availableModules: AvailableModule[],
  contributions: DashboardContributionInput[],
  userItems: UserDashboardItemInput[],
): ComposedDashboard {
  const availableIds = new Set(availableModules.map((m) => m.moduleId))
  const moduleOrderMap = new Map(
    availableModules.map((m) => [m.moduleId, m.manifestOrder]),
  )

  const userMap = new Map<string, UserDashboardItemInput>()
  for (const item of userItems) {
    userMap.set(itemKey(item.moduleId, item.contributionKind, item.contributionKey), item)
  }

  const filtered = contributions.filter((c) => availableIds.has(c.moduleId))

  const kpis: ComposedKpi[] = []
  const widgets: ComposedWidget[] = []

  for (const c of filtered) {
    const key = itemKey(c.moduleId, c.kind, c.key)
    const userPref = userMap.get(key)
    const visible = userPref ? userPref.visible : true
    if (!visible) continue

    const order = userPref?.order ?? c.order ?? moduleOrderMap.get(c.moduleId) ?? 999

    if (c.kind === "dashboard-kpi") {
      kpis.push({
        moduleId: c.moduleId,
        key: c.key,
        label: c.label ?? c.title ?? c.key,
        widgetKey: c.widgetKey,
        order,
      })
    } else {
      widgets.push({
        moduleId: c.moduleId,
        key: c.key,
        title: c.title ?? c.key,
        description: c.description,
        widgetKey: c.widgetKey,
        size: c.size ?? "md",
        order,
      })
    }
  }

  kpis.sort(byOrder)
  widgets.sort(byOrder)

  return { kpis, widgets }
}

function itemKey(moduleId: string, kind: string, key: string): string {
  return `${moduleId}::${kind}::${key}`
}

function byOrder<T extends { order: number }>(a: T, b: T): number {
  return a.order - b.order
}
