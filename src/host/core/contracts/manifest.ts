/**
 * Manifest v2 — o contrato central que cada módulo declara ao host.
 *
 * Na v1 o manifest era identidade + rotas + navegação + capabilities.
 * Na v2 ganhou força de "unidade de integração" com:
 *   - status declarado (active/experimental/hidden/disabled)
 *   - dependencies entre módulos
 *   - featureFlags com valores default
 *   - contributions (o host renderiza por contrato, sem conhecer o módulo)
 *   - supportedContexts (web/desktop/hub/space) — prepara múltiplos hosts
 *
 * Regra de ouro: se o manifest ficar grande, a POC se perdeu.
 * Todos os campos novos são opcionais ou têm default claro.
 */

import type { ComponentType } from "react"
import type { ModuleRoute } from "./route"
import type { ModuleNavItem } from "./navigation"
import type { Capability } from "./capability"
import type { Contribution } from "./contribution"

/**
 * Status declarado pelo módulo no código.
 * O estado runtime (enable/disable pelo usuário) é persistido no banco
 * e pode sobrepor isto — ver ModuleRegistry.
 */
export type ModuleStatus =
  | "active" // visível e utilizável por padrão
  | "experimental" // visível e utilizável, mas marcado como experimental
  | "hidden" // não aparece em navegação, mas rotas ainda resolvem
  | "disabled" // hard-disabled em código; registry ignora

export type ModuleArea = "main" | "settings" | "system"

/** Contexto de execução suportado. Prepara host alternativo (ex.: Tauri). */
export type RuntimeContext = "web" | "desktop" | "hub" | "space"

export type ScreenComponent = ComponentType<{
  params: Record<string, string>
  moduleBasePath: string
}>

/**
 * Componente de widget renderizado por contribuições dashboard-*.
 * Sem props: o widget é responsável pela própria fetch (RSC async).
 * Mantê-lo sem props evita acoplamento entre host e módulo.
 */
export type WidgetComponent = ComponentType<Record<string, never>>

/** Definição de uma feature flag do módulo, com valor default. */
export interface FeatureFlagDefinition {
  key: string
  label: string
  description?: string
  default: boolean
}

export interface ModuleManifest {
  /** Identificador único em kebab-case. Ex: "notes" */
  id: string
  /** Nome legível */
  name: string
  /** Descrição curta */
  description: string
  /** Versão semântica */
  version: string
  /** Estado declarado no código */
  status: ModuleStatus
  /** Onde o módulo aparece no host */
  area: ModuleArea
  /** Nome do ícone lucide-react */
  icon?: string
  /** Ordem sugerida na navegação */
  order?: number
  /** Categoria livre */
  category?: string
  /** Tags livres */
  tags?: string[]
  /** Estado inicial se nunca tocado pelo usuário */
  enabledByDefault: boolean
  /** Capacidades reivindicadas. Placeholder para permissions futuras. */
  capabilities: Capability[]
  /**
   * IDs de outros módulos dos quais este depende.
   * O registry valida: (a) que o id existe; (b) que a dependência está
   * habilitada. Se não estiver, este módulo é tratado como indisponível.
   */
  dependencies?: string[]
  /**
   * Feature flags declaradas pelo módulo, com valor default.
   * O runtime pode sobrepor via ModulePreference.
   */
  featureFlags?: FeatureFlagDefinition[]
  /**
   * Contribuições que o módulo oferece ao host (ou a outros módulos).
   * O host renderiza pelo tipo sem conhecer o módulo.
   */
  contributions?: Contribution[]
  /** Contextos onde o módulo é capaz de rodar. Default: ["web"]. */
  supportedContexts?: RuntimeContext[]
  /**
   * Caminho base CUSTOMIZADO. Opcional.
   *
   * - Ausente: o host usa a convenção /m/<id> (regra geral).
   * - Presente: o host usa esse path (ex.: "/admin" para módulo de sistema,
   *   "/home" para o workspace-home). Deve começar com "/".
   *
   * Útil para módulos de sistema que devem ter URL amigável.
   */
  basePath?: string
  /** Rotas do módulo, relativas ao basePath */
  routes: ModuleRoute[]
  /** Itens de navegação expostos ao host */
  navigation: ModuleNavItem[]
  /** Mapa de telas resolvidas pelo host via key da rota matched */
  screens: Record<string, ScreenComponent>
  /**
   * Mapa de widgets resolvidos por `contribution.widgetKey` para
   * dashboard-widget e dashboard-kpi. Opcional.
   */
  widgets?: Record<string, WidgetComponent>
}
