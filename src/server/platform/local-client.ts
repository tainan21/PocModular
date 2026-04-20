
/**
 * Cliente LOCAL da Platform API — executa os services no mesmo processo.
 *
 * Implementa a mesma interface `PlatformClient` do HTTP client. O consumidor
 * (launcher, Control Center, etc.) pode trocar
 * `createLocalPlatformClient()` ↔ `createHttpPlatformClient({ baseUrl })`
 * sem mudar uma linha — prova viva de que admin separado é só uma flag.
 *
 * O modo local não faz RBAC: quem está dentro do processo é, por construção,
 * confiável. O RBAC só importa ao atravessar HTTP.
 */

import type { PlatformClient } from "@poc/platform-client"
import { PlatformError } from "@poc/platform-contracts"
import {
  listModulesDTO,
  getModuleDTO,
  listCatalogDTO,
  listFeaturesDTO,
  listRuntimeDTO,
  listRoutesDTO,
  getHealthDTO,
} from "@server/platform/services/platform-service"
import { getDashboardDTO } from "@server/platform/services/dashboard-service"
import {
  getOnboardingSnapshotDTO,
  setOnboardingIntent,
  setOnboardingSelection,
  finishOnboarding,
  resetOnboarding,
} from "@server/platform/services/onboarding-service"
import { saveCatalogEntry, setModuleFlag } from "@server/platform/services/admin-service"

export function createLocalPlatformClient(): PlatformClient {
  return {
    mode: "local",

    listModules: (q) => listModulesDTO(q),
    getModule: (id) => getModuleDTO(id),
    listFeatures: (q) => listFeaturesDTO(q),
    listCatalog: (q) => listCatalogDTO(q),
    listRoutes: () => listRoutesDTO(),

    listRuntime: (q) => listRuntimeDTO(q),
    getDashboard: () => getDashboardDTO(),
    getOnboarding: () => getOnboardingSnapshotDTO(),
    getHealth: () => getHealthDTO(),

    setOnboardingIntent: (intent) => setOnboardingIntent(intent),
    setOnboardingSelection: (moduleIds) => setOnboardingSelection(moduleIds),
    finishOnboarding: () => finishOnboarding(),

    saveCatalog: (input) => saveCatalogEntry(input),
    setFlag: (input) => setModuleFlag(input),
    resetOnboarding: () => resetOnboarding(),
  } satisfies PlatformClient
}

/**
 * Um singleton leve. Services são stateless e o store é cacheado globalmente,
 * então uma única instância por processo basta.
 */
let cached: PlatformClient | null = null
export function getLocalPlatformClient(): PlatformClient {
  if (cached) return cached
  cached = createLocalPlatformClient()
  return cached
}

/** Guard para fail-loud caso alguém misture camadas. */
export function assertPlatformError(err: unknown): asserts err is PlatformError {
  if (!(err instanceof PlatformError)) throw err
}
