/**
 * Registry — contrato para quem quiser trocar a implementação concreta.
 *
 * v3: além do estado runtime básico, o registry agora expõe informação
 * de catálogo (ModuleCatalogEntry) e de seleção do usuário
 * (UserModuleSelection), já resolvidos em ModuleRuntimeInfo.
 * Isso permite o host mostrar UX consistente com:
 *   - módulos bloqueados por dependência
 *   - módulos indisponíveis por contexto
 *   - módulos desativados globalmente pelo admin
 *   - módulos que o usuário ainda não escolheu
 */
import type { ModuleManifest, ModuleArea } from "./manifest"
import type { ResolvedNavItem } from "./navigation"
import type { RouteMatch } from "./route"

/** Informação de catálogo já resolvida (derivada de ModuleCatalogEntry). */
export interface ModuleCatalogSummary {
  pricingModel: "internal" | "free" | "paid" | "experimental"
  priceCents?: number | null
  globallyEnabled: boolean
  visibleInOnboarding: boolean
  visibleInDashboard: boolean
  onboardingOrder: number
}

export type EffectiveState =
  | "available"
  | "disabled"              // globalmente desligado
  | "blocked-by-dependency" // dependência não está available
  | "blocked-by-context"    // contexto (web/desktop) não suportado
  | "user-opt-out"          // admin/catalog ok, mas o usuário não escolheu

/** Estado resolvido de um módulo (manifest + catálogo + seleção + prefs). */
export interface ModuleRuntimeInfo {
  manifest: ModuleManifest
  effectiveState: EffectiveState
  /** Valor ligado (true) das flags do módulo, após merge com overrides. */
  flags: Record<string, boolean>
  /** Motivo quando effectiveState != "available". */
  reason?: string
  /** Catálogo — sempre presente. Módulos de sistema recebem defaults. */
  catalog: ModuleCatalogSummary
  /** Se o usuário escolheu (onboarding/admin). */
  userSelected: boolean
}

/** Resultado da validação do conjunto de manifests registrados. */
export interface RegistryValidationReport {
  issues: RegistryIssue[]
  hasErrors: boolean
}

export type RegistryIssue =
  | { kind: "duplicate-id"; id: string }
  | { kind: "duplicate-base-path"; basePath: string; ids: string[] }
  | { kind: "duplicate-route"; moduleId: string; path: string }
  | { kind: "unknown-dependency"; moduleId: string; missing: string }
  | { kind: "dependency-disabled"; moduleId: string; dependency: string }

export interface IModuleRegistry {
  register(manifest: ModuleManifest): void
  registerAll(manifests: ModuleManifest[]): void
  list(): ModuleManifest[]
  listAll(): ModuleManifest[]
  describeAll(): ModuleRuntimeInfo[]
  describeByArea(area: ModuleArea): ModuleRuntimeInfo[]
  get(id: string): ModuleManifest | undefined
  describe(id: string): ModuleRuntimeInfo | undefined
  buildNavigation(): ResolvedNavItem[]
  resolveRoute(fullPath: string): RouteMatch | undefined
  basePathOf(moduleId: string): string
  validate(): RegistryValidationReport
}
