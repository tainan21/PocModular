/**
 * @poc/platform-contracts
 *
 * Contratos públicos da Platform API.
 *
 * Regras de ouro:
 *  - ZERO dependências (nem React, nem Next, nem Prisma).
 *  - TUDO aqui é 100% serializável em JSON.
 *  - Esses DTOs são a linguagem entre:
 *      - o servidor (route handlers em app/api/platform)
 *      - o client http (packages/platform-client)
 *      - qualquer consumidor futuro (ex.: um app admin separado)
 *  - Nomes dos campos precisam ser estáveis; quebras aqui quebram todos
 *    os consumidores. Adicione campos novos de forma não-destrutiva.
 */

export * from "./errors"
export * from "./endpoints"

// ---------------------------------------------------------------------------
// Enums compartilhados

export type ModuleStatusDTO = "active" | "experimental" | "hidden" | "disabled"
export type ModuleAreaDTO = "main" | "settings" | "system"
export type RuntimeContextDTO = "web" | "desktop" | "hub" | "space"
export type PricingModelDTO = "free" | "paid" | "internal" | "experimental"
export type EffectiveStateDTO =
  | "available"
  | "disabled"
  | "user-opt-out"
  | "blocked-by-dependency"
  | "blocked-by-context"

// ---------------------------------------------------------------------------
// Contribuições (union serializável)

export type ContributionDTO =
  | { kind: "home-highlight"; title: string; description: string; to: string }
  | {
      kind: "quick-action"
      key: string
      label: string
      to: string
      tone?: "default" | "primary"
    }
  | {
      kind: "dashboard-widget"
      key: string
      widgetKey: string
      title: string
      description?: string
      size?: "sm" | "md" | "lg"
      order?: number
    }
  | {
      kind: "dashboard-kpi"
      key: string
      widgetKey: string
      label: string
      order?: number
    }

// ---------------------------------------------------------------------------
// Manifest "light" — projeção serializável do manifest do módulo

export interface FeatureFlagDTO {
  key: string
  label: string
  description?: string
  default: boolean
  /**
   * Estado efetivo da flag depois de aplicar overrides persistidos.
   * A Platform API resolve isso antes de serializar — consumidores
   * (admin, UI, outro app) leem direto, sem reconstruir.
   */
  current: boolean
}

export type OnboardingIntent = "pessoal" | "time" | "operacao" | "explorar"

export interface ModuleRouteDTO {
  path: string
  label?: string
  screen: string
}

export interface ModuleNavDTO {
  label: string
  path: string
  icon?: string
  order?: number
}

export interface ModuleDTO {
  id: string
  name: string
  description: string
  version: string
  status: ModuleStatusDTO
  area: ModuleAreaDTO
  icon?: string
  category?: string
  tags?: string[]
  /** Já resolvido pelo registry (usa basePath custom quando declarado). */
  basePath: string
  order: number
  enabledByDefault: boolean
  capabilities: string[]
  dependencies: string[]
  supportedContexts: RuntimeContextDTO[]
  featureFlags: FeatureFlagDTO[]
  contributions: ContributionDTO[]
  routes: ModuleRouteDTO[]
  navigation: ModuleNavDTO[]
  /** Keys disponíveis em manifest.widgets. */
  widgetKeys: string[]
}

// ---------------------------------------------------------------------------
// Catálogo e features

export interface CatalogEntryDTO {
  moduleId: string
  pricingModel: PricingModelDTO
  priceCents: number | null
  globallyEnabled: boolean
  visibleInOnboarding: boolean
  visibleInDashboard: boolean
  featureFlagged: boolean
  displayOrder: number
}

export interface FeatureDTO {
  id: string
  moduleId: string
  key: string
  label: string
  description?: string
  default: boolean
  administrable: boolean
  pricingHint: PricingModelDTO | null
}

// ---------------------------------------------------------------------------
// Runtime

export interface RuntimeInfoDTO {
  moduleId: string
  effectiveState: EffectiveStateDTO
  reason?: string
  userSelected: boolean
  flags: Record<string, boolean>
  catalog: CatalogEntryDTO
}

// ---------------------------------------------------------------------------
// Dashboard e onboarding

export interface DashboardKpiDTO {
  id: string
  moduleId: string
  moduleName: string
  widgetKey: string
  label: string
  order: number
  visible: boolean
}

export interface DashboardWidgetDTO {
  id: string
  moduleId: string
  moduleName: string
  widgetKey: string
  title: string
  description?: string
  size: "sm" | "md" | "lg"
  order: number
  visible: boolean
}

export interface DashboardDTO {
  userId: string
  kpis: DashboardKpiDTO[]
  widgets: DashboardWidgetDTO[]
  /** Timestamp ISO gerado pelo server no momento da composição. */
  generatedAt: string
}

export interface OnboardingStateDTO {
  userId: string
  completed: boolean
  currentStep: 1 | 2 | 3
  intent?: string
  selectedModuleIds: string[]
}

export interface OnboardingAvailableModuleDTO {
  moduleId: string
  name: string
  description: string
  icon?: string
  pricingModel: PricingModelDTO
  priceCents: number | null
  order: number
}

export interface OnboardingSnapshotDTO {
  state: OnboardingStateDTO
  availableModules: OnboardingAvailableModuleDTO[]
}

// ---------------------------------------------------------------------------
// Rotas expostas (úteis ao launcher e ao admin futuro)

export interface RouteEntryDTO {
  moduleId: string
  moduleName: string
  area: ModuleAreaDTO
  href: string
  label: string
  icon?: string
  isNav: boolean
}

// ---------------------------------------------------------------------------
// Health / root

export interface HealthDTO {
  ok: true
  /** Versão semântica da Platform API (incrementar em breaking changes de DTO). */
  platformVersion: string
  /** Qual store está atendendo neste momento (prisma | memory). */
  store: "prisma" | "memory"
  /**
   * True quando a fachada quis Prisma mas caiu para Memory em runtime
   * (ex.: DATABASE_URL ausente, banco sem schema). Consumidores podem
   * mostrar um aviso no UI para deixar explícito que "dados não persistem".
   */
  degraded: boolean
  /** Estado de cada sub-serviço conhecido pela fachada. */
  services: Record<string, "ok" | "degraded" | "error">
  registry: {
    moduleCount: number
    hasErrors: boolean
    issueCount: number
  }
  generatedAt: string
}

// ---------------------------------------------------------------------------
// Paginação e filtros (v5)

/**
 * Parâmetros opcionais aceitos pelos listers. Todos os campos são opcionais,
 * o que mantém o contrato 100% retrocompatível com consumidores v4 que
 * simplesmente chamam `platform.listModules()` sem argumentos.
 */
export interface PageRequest {
  page?: number     // 1-indexed. default: 1
  pageSize?: number // default: 50, clamp em 200
  q?: string        // busca case-insensitive sobre os campos texto do DTO
}

export interface PageMeta {
  page: number
  pageSize: number
  total: number
  pageCount: number
  hasNext: boolean
  hasPrev: boolean
}

export interface Page<T> {
  items: T[]
  meta: PageMeta
}

// Filtros específicos (composam com PageRequest)
export interface ModulesQuery extends PageRequest {
  area?: ModuleAreaDTO
  status?: ModuleStatusDTO
}
export interface FeaturesQuery extends PageRequest {
  moduleId?: string
  administrableOnly?: boolean
}
export interface CatalogQuery extends PageRequest {
  visibleInOnboarding?: boolean
  pricingModel?: PricingModelDTO
}
export interface RuntimeQuery extends PageRequest {
  effectiveState?: EffectiveStateDTO
}

// ---------------------------------------------------------------------------
// Requests / responses tipadas

export interface AdminSaveCatalogRequest {
  moduleId: string
  pricingModel: PricingModelDTO
  priceCents: number | null
  globallyEnabled: boolean
  visibleInOnboarding: boolean
  visibleInDashboard: boolean
  featureFlagged: boolean
  displayOrder: number
}

export interface AdminSetFlagRequest {
  moduleId: string
  flagKey: string
  value: boolean
}

export interface OnboardingIntentRequest {
  intent: string
}

export interface OnboardingSelectionRequest {
  moduleIds: string[]
}

export interface OkResponse {
  ok: true
}
