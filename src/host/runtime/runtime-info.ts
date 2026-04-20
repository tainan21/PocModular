/**
 * Funções PURAS de derivação de runtime info.
 * Sem I/O. Sem Prisma. Sem React. Usável em qualquer host (web, desktop).
 *
 * Parte com I/O (lê/grava ModulePreference/ModuleCatalogEntry/etc.)
 * mora em module-state/catalog-state/selection-state e consome este módulo.
 */
import type {
  ModuleManifest,
  ModuleRuntimeInfo,
  ModuleCatalogSummary,
  EffectiveState,
  RuntimeContext,
} from "@host/core/contracts"

export interface ModuleOverride {
  enabled: boolean
  flags: Record<string, boolean>
}

export type ModuleOverrideMap = Record<string, ModuleOverride | undefined>

export interface DeriveInputs {
  manifest: ModuleManifest
  override?: ModuleOverride
  catalog?: ModuleCatalogSummary
  userSelected?: boolean
  currentContext?: RuntimeContext
  /** Mapa com o effectiveState de outros módulos (para detectar dep bloqueada). */
  dependencyStates?: Record<string, EffectiveState | undefined>
}

const DEFAULT_CATALOG_FOR_SYSTEM: ModuleCatalogSummary = {
  pricingModel: "internal",
  priceCents: null,
  globallyEnabled: true,
  visibleInOnboarding: false,
  visibleInDashboard: false,
  onboardingOrder: 0,
}

const DEFAULT_CATALOG_FOR_MAIN: ModuleCatalogSummary = {
  pricingModel: "free",
  priceCents: null,
  globallyEnabled: true,
  visibleInOnboarding: true,
  visibleInDashboard: true,
  onboardingOrder: 100,
}

export function deriveRuntimeInfo(inputs: DeriveInputs): ModuleRuntimeInfo {
  const { manifest, override, userSelected, currentContext, dependencyStates } = inputs
  const catalog =
    inputs.catalog ??
    (manifest.area === "system" ? DEFAULT_CATALOG_FOR_SYSTEM : DEFAULT_CATALOG_FOR_MAIN)

  const flags = mergeFlags(manifest, override)

  // 1) Hard-off: status disabled
  if (manifest.status === "disabled") {
    return {
      manifest,
      effectiveState: "disabled",
      flags,
      reason: "Desabilitado no manifest (status=disabled)",
      catalog,
      userSelected: !!userSelected,
    }
  }

  // 2) Catálogo globalmente desligado (admin)
  if (!catalog.globallyEnabled) {
    return {
      manifest,
      effectiveState: "disabled",
      flags,
      reason: "Desligado globalmente no Control Center",
      catalog,
      userSelected: !!userSelected,
    }
  }

  // 3) Preferência runtime (legado: ModulePreference.enabled=false)
  const enabledFromPrefs = override?.enabled ?? manifest.enabledByDefault
  if (!enabledFromPrefs) {
    return {
      manifest,
      effectiveState: "disabled",
      flags,
      reason: "Desabilitado nas preferências",
      catalog,
      userSelected: !!userSelected,
    }
  }

  // 4) Contexto não suportado
  if (
    currentContext &&
    manifest.supportedContexts &&
    !manifest.supportedContexts.includes(currentContext)
  ) {
    return {
      manifest,
      effectiveState: "blocked-by-context",
      flags,
      reason: `Este módulo não suporta o contexto "${currentContext}"`,
      catalog,
      userSelected: !!userSelected,
    }
  }

  // 5) Dependência não disponível
  for (const dep of manifest.dependencies ?? []) {
    const depState = dependencyStates?.[dep]
    if (depState && depState !== "available") {
      return {
        manifest,
        effectiveState: "blocked-by-dependency",
        flags,
        reason: `Depende de "${dep}", que está ${depState}`,
        catalog,
        userSelected: !!userSelected,
      }
    }
  }

  // 6) Usuário não escolheu (apenas área main é "escolhível")
  if (manifest.area === "main" && userSelected === false) {
    return {
      manifest,
      effectiveState: "user-opt-out",
      flags,
      reason: "Você ainda não escolheu este módulo no onboarding/admin",
      catalog,
      userSelected: false,
    }
  }

  return {
    manifest,
    effectiveState: "available",
    flags,
    catalog,
    userSelected: manifest.area === "system" ? true : !!userSelected,
  }
}

export function defaultFlags(manifest: ModuleManifest): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  for (const f of manifest.featureFlags ?? []) map[f.key] = f.default
  return map
}

function mergeFlags(
  manifest: ModuleManifest,
  override: ModuleOverride | undefined,
): Record<string, boolean> {
  const defaults = defaultFlags(manifest)
  if (!override) return defaults
  return { ...defaults, ...override.flags }
}
