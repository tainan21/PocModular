/**
 * Bootstrap do registry (v2).
 *
 * Diferença para a v1: o host NÃO conhece mais a lista de módulos.
 * Ele apenas consome o agregador em `src/modules/all-manifests.ts`.
 *
 * Para plugar um novo módulo:
 *   1. Crie src/modules/<id>/manifest.ts
 *   2. Adicione-o em src/modules/all-manifests.ts
 *   3. Pronto.
 */
import { ModuleRegistry } from "./module-registry"
import { allManifests } from "@modules/all-manifests"

declare global {
  // eslint-disable-next-line no-var
  var __moduleRegistry: ModuleRegistry | undefined
}

function buildRegistry() {
  const registry = new ModuleRegistry()
  registry.registerAll(allManifests)
  // Validação estrutural: falha cedo se algo estiver quebrado.
  const report = registry.validate()
  if (report.hasErrors) {
    const pretty = report.issues.map(formatIssue).join("\n- ")
    throw new Error(`[registry] Problemas estruturais detectados:\n- ${pretty}`)
  }
  return registry
}

export function getRegistry(): ModuleRegistry {
  if (!globalThis.__moduleRegistry) {
    globalThis.__moduleRegistry = buildRegistry()
  }
  return globalThis.__moduleRegistry
}

/**
 * Removido em v5: o export eager `moduleRegistry = getRegistry()` força a
 * avaliação do registry no top-level deste módulo. Isso entra em conflito com
 * ciclos legítimos (manifest → screen → queries → services → registry →
 * manifest) quando o bundler (Turbopack) serializa chunks em runtime Node,
 * resultando em TDZ ("Cannot access 'x' before initialization").
 *
 * Use sempre `getRegistry()`. A construção continua lazy e idempotente via
 * `globalThis.__moduleRegistry`.
 */

function formatIssue(i: ReturnType<ModuleRegistry["validate"]>["issues"][number]): string {
  switch (i.kind) {
    case "duplicate-id":
      return `id duplicado: ${i.id}`
    case "duplicate-base-path":
      return `basePath duplicado: ${i.basePath} (módulos: ${i.ids.join(", ")})`
    case "duplicate-route":
      return `rota duplicada em ${i.moduleId}: "${i.path}"`
    case "unknown-dependency":
      return `${i.moduleId} depende de módulo inexistente: "${i.missing}"`
    case "dependency-disabled":
      return `${i.moduleId} depende de módulo desabilitado: "${i.dependency}"`
  }
}

export { ModuleRegistry } from "./module-registry"
export { validateManifest, ManifestValidationError } from "./manifest-validator"
