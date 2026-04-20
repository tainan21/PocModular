/**
 * Contribuições declarativas oferecidas por um módulo ao host.
 *
 * v3 adiciona dois tipos para dashboard componível:
 *   - dashboard-widget: bloco renderizado no dashboard do usuário
 *   - dashboard-kpi: indicador curto (label + value) para o topo do dashboard
 *
 * Importante: contribuições são APENAS metadados. O componente é
 * resolvido por `manifest.widgets[widgetKey]`, da mesma forma que
 * `manifest.screens[screenKey]` para rotas. Isso mantém o tipo serializável
 * e o registro do módulo legível.
 */

export type Contribution =
  | HomeHighlightContribution
  | QuickActionContribution
  | DashboardWidgetContribution
  | DashboardKpiContribution

/** Destaque renderizado na home do host. */
export interface HomeHighlightContribution {
  kind: "home-highlight"
  title: string
  description: string
  /** Caminho relativo dentro do módulo. Resolvido como /m/<id>/<to>. */
  to: string
}

/** Ação rápida curta. */
export interface QuickActionContribution {
  kind: "quick-action"
  /** Key única dentro do módulo. */
  key: string
  label: string
  to: string
  tone?: "default" | "primary"
}

/** Widget exibido no dashboard do usuário. */
export interface DashboardWidgetContribution {
  kind: "dashboard-widget"
  /** Key única dentro do módulo (usada também como identificador no banco). */
  key: string
  title: string
  description?: string
  /** Chave resolvida em `manifest.widgets[widgetKey]`. */
  widgetKey: string
  /** Tamanho visual sugerido no grid. */
  size?: "sm" | "md" | "lg"
  order?: number
}

/** Indicador curto (label + valor) exibido no topo do dashboard. */
export interface DashboardKpiContribution {
  kind: "dashboard-kpi"
  key: string
  label: string
  /** Chave resolvida em `manifest.widgets[widgetKey]`. */
  widgetKey: string
  order?: number
}
