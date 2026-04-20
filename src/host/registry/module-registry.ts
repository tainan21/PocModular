/**
 * ModuleRegistry (v3) — implementação SÍNCRONA e PURA.
 *
 * Responsabilidades:
 *  - Registrar manifests
 *  - Validar manifests e o conjunto (ids duplicados, basePaths, etc.)
 *  - Resolver rotas (inclusive para módulos com basePath customizado)
 *  - Montar navegação
 *  - Expor runtime info combinando: manifest + override de prefs +
 *    catálogo + seleção do usuário
 *
 * Não conhece: Next, React, Prisma, nada assíncrono, nada de I/O.
 * Quem conhece I/O injeta via applyRuntimeContext() o estado persistido.
 */
import type {
  IModuleRegistry,
  ModuleManifest,
  ModuleRuntimeInfo,
  ModuleCatalogSummary,
  ModuleArea,
  RegistryIssue,
  RegistryValidationReport,
  ResolvedNavItem,
  RouteMatch,
  RuntimeContext,
} from "../core/contracts"
import { validateManifest } from "./manifest-validator"
import {
  deriveRuntimeInfo,
  type ModuleOverrideMap,
} from "../runtime/runtime-info"

const MODULE_URL_PREFIX = "/m"

export interface RuntimeContextInputs {
  overrides?: ModuleOverrideMap
  catalog?: Record<string, ModuleCatalogSummary | undefined>
  userSelections?: Record<string, boolean | undefined>
  currentContext?: RuntimeContext
}

export class ModuleRegistry implements IModuleRegistry {
  private modules = new Map<string, ModuleManifest>()
  private ctx: RuntimeContextInputs = {}

  register(manifest: ModuleManifest): void {
    validateManifest(manifest)
    if (this.modules.has(manifest.id)) {
      throw new Error(`Módulo duplicado no registry: "${manifest.id}"`)
    }
    this.modules.set(manifest.id, manifest)
  }

  registerAll(manifests: ModuleManifest[]): void {
    for (const m of manifests) this.register(m)
  }

  /** Compat com v2. */
  applyOverrides(overrides: ModuleOverrideMap): void {
    this.ctx = { ...this.ctx, overrides: overrides ?? {} }
  }

  /** v3: injeta tudo (overrides, catálogo, seleção, contexto). */
  applyRuntimeContext(inputs: RuntimeContextInputs): void {
    this.ctx = {
      overrides: inputs.overrides ?? {},
      catalog: inputs.catalog ?? {},
      userSelections: inputs.userSelections ?? {},
      currentContext: inputs.currentContext ?? "web",
    }
  }

  listAll(): ModuleManifest[] {
    return Array.from(this.modules.values()).sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999),
    )
  }

  list(): ModuleManifest[] {
    return this.describeAll()
      .filter((info) => info.effectiveState === "available")
      .map((info) => info.manifest)
  }

  describeAll(): ModuleRuntimeInfo[] {
    const all = this.listAll()
    // Passagem 1 — info base (sem considerar deps)
    const base = new Map<string, ModuleRuntimeInfo>()
    for (const m of all) {
      base.set(
        m.id,
        deriveRuntimeInfo({
          manifest: m,
          override: this.ctx.overrides?.[m.id],
          catalog: this.ctx.catalog?.[m.id],
          userSelected: this.resolveUserSelection(m),
          currentContext: this.ctx.currentContext,
        }),
      )
    }
    // Passagem 2 — propaga dependências
    const result: ModuleRuntimeInfo[] = []
    for (const m of all) {
      const info = base.get(m.id)!
      if (info.effectiveState !== "available") {
        result.push(info)
        continue
      }
      const depStates: Record<string, ModuleRuntimeInfo["effectiveState"]> = {}
      for (const dep of m.dependencies ?? []) {
        const depInfo = base.get(dep)
        depStates[dep] = depInfo?.effectiveState ?? "disabled"
      }
      const refined = deriveRuntimeInfo({
        manifest: m,
        override: this.ctx.overrides?.[m.id],
        catalog: this.ctx.catalog?.[m.id],
        userSelected: this.resolveUserSelection(m),
        currentContext: this.ctx.currentContext,
        dependencyStates: depStates,
      })
      result.push(refined)
    }
    return result
  }

  describe(id: string): ModuleRuntimeInfo | undefined {
    return this.describeAll().find((i) => i.manifest.id === id)
  }

  describeByArea(area: ModuleArea): ModuleRuntimeInfo[] {
    return this.describeAll().filter((i) => i.manifest.area === area)
  }

  private resolveUserSelection(m: ModuleManifest): boolean {
    // módulos de sistema/settings não precisam ser "escolhidos" pelo usuário
    if (m.area !== "main") return true
    const sel = this.ctx.userSelections?.[m.id]
    if (sel !== undefined) return sel
    // default: não-escolhido até o usuário passar por onboarding.
    // mas pra não quebrar a DX, considera selecionado se ainda não houve
    // nenhum registro em userSelections (mapa vazio == "sem onboarding")
    return !this.ctx.userSelections || Object.keys(this.ctx.userSelections).length === 0
  }

  get(id: string): ModuleManifest | undefined {
    return this.modules.get(id)
  }

  basePathOf(moduleId: string): string {
    const manifest = this.modules.get(moduleId)
    if (manifest?.basePath && manifest.basePath.startsWith("/")) {
      return manifest.basePath.replace(/\/$/, "") || "/"
    }
    return `${MODULE_URL_PREFIX}/${moduleId}`
  }

  buildNavigation(): ResolvedNavItem[] {
    const items: ResolvedNavItem[] = []
    for (const info of this.describeAll()) {
      const manifest = info.manifest
      if (info.effectiveState !== "available") continue
      if (manifest.status === "hidden") continue
      for (const nav of manifest.navigation) {
        items.push({
          moduleId: manifest.id,
          moduleName: manifest.name,
          label: nav.label,
          href: joinPath(this.basePathOf(manifest.id), nav.path),
          icon: nav.icon ?? manifest.icon,
          order: nav.order ?? manifest.order ?? 999,
          area: manifest.area,
        })
      }
    }
    return items.sort((a, b) => a.order - b.order)
  }

  resolveRoute(fullPath: string): RouteMatch | undefined {
    const normalized = "/" + fullPath.split("/").filter(Boolean).join("/")

    // 1) Tenta casar primeiro pelo basePath CUSTOMIZADO do módulo.
    for (const manifest of this.modules.values()) {
      if (!manifest.basePath || manifest.basePath === "/") continue
      const base = this.basePathOf(manifest.id)
      if (normalized === base || normalized.startsWith(base + "/")) {
        const rest = normalized.slice(base.length).replace(/^\/+/, "")
        const match = this.matchInsideManifest(manifest, rest)
        if (match) return match
      }
    }

    // 2) Fallback: convenção /m/<id>/...
    const segments = normalized.split("/").filter(Boolean)
    if (segments.length < 2 || `/${segments[0]}` !== MODULE_URL_PREFIX) return undefined
    const moduleId = segments[1]
    const manifest = this.get(moduleId)
    if (!manifest) return undefined
    if (manifest.basePath && manifest.basePath !== "/") return undefined
    const rest = segments.slice(2).join("/")
    return this.matchInsideManifest(manifest, rest)
  }

  private matchInsideManifest(manifest: ModuleManifest, rest: string): RouteMatch | undefined {
    for (const route of manifest.routes) {
      const params = matchPath(route.path, rest)
      if (!params) continue
      const Screen = manifest.screens[route.screen]
      if (!Screen) {
        throw new Error(
          `Manifest "${manifest.id}": rota "${route.path}" aponta para screen inexistente "${route.screen}"`,
        )
      }
      return {
        moduleId: manifest.id,
        moduleBasePath: this.basePathOf(manifest.id),
        route,
        params,
        Screen,
      }
    }
    return undefined
  }

  validate(): RegistryValidationReport {
    const issues: RegistryIssue[] = []
    const all = this.listAll()
    const ids = new Set(all.map((m) => m.id))

    const seenBases = new Map<string, string[]>()
    for (const m of all) {
      const base = this.basePathOf(m.id)
      const arr = seenBases.get(base) ?? []
      arr.push(m.id)
      seenBases.set(base, arr)
    }
    for (const [basePath, mods] of seenBases) {
      if (mods.length > 1) issues.push({ kind: "duplicate-base-path", basePath, ids: mods })
    }

    for (const m of all) {
      const seen = new Set<string>()
      for (const r of m.routes) {
        if (seen.has(r.path)) issues.push({ kind: "duplicate-route", moduleId: m.id, path: r.path })
        seen.add(r.path)
      }
      for (const dep of m.dependencies ?? []) {
        if (!ids.has(dep)) {
          issues.push({ kind: "unknown-dependency", moduleId: m.id, missing: dep })
          continue
        }
        const depInfo = this.describe(dep)
        if (!depInfo || depInfo.effectiveState !== "available") {
          issues.push({ kind: "dependency-disabled", moduleId: m.id, dependency: dep })
        }
      }
    }

    return { issues, hasErrors: issues.length > 0 }
  }
}

// -----------------------------------------------------------------------------
// helpers

function joinPath(base: string, rel: string): string {
  if (!rel) return base
  return `${base.replace(/\/$/, "")}/${rel.replace(/^\//, "")}`
}

function matchPath(pattern: string, input: string): Record<string, string> | null {
  const pSegs = pattern.split("/").filter(Boolean)
  const iSegs = input.split("/").filter(Boolean)
  if (pSegs.length !== iSegs.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pSegs.length; i++) {
    const p = pSegs[i]
    const v = iSegs[i]
    if (p.startsWith(":")) params[p.slice(1)] = v
    else if (p !== v) return null
  }
  return params
}
