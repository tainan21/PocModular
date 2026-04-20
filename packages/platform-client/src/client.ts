/**
 * PlatformClient — interface única para consumir a Platform API (v5).
 *
 * Duas implementações concretas:
 *  - createHttpPlatformClient({ baseUrl, actor })  — fetch, cross-app/cross-repo
 *  - createLocalPlatformClient()                   — in-process, zero hop HTTP
 *
 * Todos os listers agora aceitam uma query opcional e devolvem `Page<T>`.
 * Consumidores que não precisam paginar chamam sem argumentos e leem `.items`.
 *
 * O `actor` é um hint passado no header `X-Platform-Actor` no cliente HTTP.
 * No cliente local ele é ignorado — a checagem de policy acontece no route
 * handler, que só existe no caminho HTTP. Isso é intencional: o local-client
 * é confiável dentro do mesmo processo; o HTTP client atravessa fronteira e
 * precisa se identificar.
 */

import type {
  ModuleDTO,
  CatalogEntryDTO,
  FeatureDTO,
  RuntimeInfoDTO,
  RouteEntryDTO,
  DashboardDTO,
  HealthDTO,
  OnboardingSnapshotDTO,
  OnboardingStateDTO,
  AdminSaveCatalogRequest,
  AdminSetFlagRequest,
  OkResponse,
  Page,
  ModulesQuery,
  FeaturesQuery,
  CatalogQuery,
  RuntimeQuery,
} from "@poc/platform-contracts"

export interface PlatformClient {
  /** Rótulo da implementação (ex.: "local", "http"). */
  readonly mode: "local" | "http"

  // Descoberta
  listModules(query?: ModulesQuery): Promise<Page<ModuleDTO>>
  getModule(id: string): Promise<ModuleDTO | null>
  listFeatures(query?: FeaturesQuery): Promise<Page<FeatureDTO>>
  listCatalog(query?: CatalogQuery): Promise<Page<CatalogEntryDTO>>
  listRoutes(): Promise<RouteEntryDTO[]>

  // Estado e composição
  listRuntime(query?: RuntimeQuery): Promise<Page<RuntimeInfoDTO>>
  getDashboard(): Promise<DashboardDTO>
  getOnboarding(): Promise<OnboardingSnapshotDTO>
  getHealth(): Promise<HealthDTO>

  // Operações do usuário (onboarding)
  setOnboardingIntent(intent: string): Promise<OnboardingStateDTO>
  setOnboardingSelection(moduleIds: string[]): Promise<OnboardingStateDTO>
  finishOnboarding(): Promise<OnboardingStateDTO>

  // Operações administrativas
  saveCatalog(input: AdminSaveCatalogRequest): Promise<OkResponse>
  setFlag(input: AdminSetFlagRequest): Promise<OkResponse>
  resetOnboarding(): Promise<OnboardingStateDTO>
}
