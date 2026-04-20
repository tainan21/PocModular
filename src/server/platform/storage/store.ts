/**
 * PlatformStateStore — porta (interface) para todo o estado mutável da plataforma.
 *
 * Esta é a ÚNICA superfície server-side que fala com storage. Tudo que é
 * leitura/escrita de catálogo, flags, seleção do usuário, onboarding e
 * dashboard passa por aqui.
 *
 * Implementações:
 *  - PrismaPlatformStore  (persistência real; delega aos helpers existentes em
 *                          src/host/runtime/*-state.ts)
 *  - MemoryPlatformStore  (in-memory; bom para testes/simulação local de server)
 *
 * Observações honestas:
 *  - `localStorage` NÃO é uma impl legítima aqui. Estado server-side precisa
 *    viver no servidor. O uso de localStorage no browser é coberto pelo
 *    pacote `@poc/module-ui` (BrowserDraftStore) e fica restrito a drafts e
 *    preferências efêmeras do launcher/onboarding.
 *  - O objetivo desta porta NÃO é esconder o Prisma; é permitir (a) testar a
 *    plataforma sem banco e (b) preparar um 2º app consumidor que apenas use
 *    a API HTTP.
 */

import type {
  ModuleCatalogEntryProps,
  FeatureCatalogEntryProps,
  UserSelection,
} from "@domains/platform-catalog"
import type { ModuleOverrideMap } from "@host/runtime/runtime-info"
import type { OnboardingState } from "@domains/onboarding/application/onboarding-rules"
import type { UserDashboardItemInput } from "@domains/dashboard/application/dashboard-composition"

export interface PlatformStateStore {
  // ----- Module runtime preferences (legado v2) + flags --------------------
  loadModuleOverrides(): Promise<ModuleOverrideMap>
  setModuleFlag(moduleId: string, flagKey: string, value: boolean): Promise<void>
  setModuleEnabled(moduleId: string, enabled: boolean): Promise<void>

  // ----- Catálogo de módulos ----------------------------------------------
  loadCatalogMap(): Promise<Record<string, ModuleCatalogEntryProps>>
  upsertCatalogEntry(entry: ModuleCatalogEntryProps): Promise<void>

  // ----- Catálogo de features (granular) ----------------------------------
  loadFeatureCatalog(): Promise<FeatureCatalogEntryProps[]>
  upsertFeatureCatalog(entry: FeatureCatalogEntryProps): Promise<void>

  // ----- Escolhas do usuário ----------------------------------------------
  loadSelectionMap(userId: string): Promise<Record<string, UserSelection>>
  bulkSetSelection(
    userId: string,
    selectedModuleIds: string[],
    availableModuleIds: string[],
  ): Promise<void>

  // ----- Onboarding -------------------------------------------------------
  loadOnboardingState(userId: string): Promise<OnboardingState>
  saveOnboardingState(userId: string, state: OnboardingState): Promise<void>
  resetOnboardingState(userId: string): Promise<void>

  // ----- Dashboard do usuário ---------------------------------------------
  loadUserDashboardItems(userId: string): Promise<UserDashboardItemInput[]>
  setDashboardItem(
    userId: string,
    moduleId: string,
    contributionKind: UserDashboardItemInput["contributionKind"],
    contributionKey: string,
    patch: { order?: number; visible?: boolean },
  ): Promise<void>

  // ----- Identidade do usuário demo (sem auth na POC) ---------------------
  getDemoUserId(): Promise<string>

  /** Rótulo da impl, usado em /api/platform/health. */
  readonly label: "prisma" | "memory"
}
