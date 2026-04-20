/**
 * Validação mínima, mas real, de um ModuleManifest.
 *
 * A POC evita dependência de um schema runtime pesado (Zod) aqui no host
 * para manter a camada central enxuta. Validações são pragmáticas:
 * erros detectados agora evitam dor depois.
 */
import type { ModuleManifest } from "../core/contracts"

export class ManifestValidationError extends Error {
  constructor(moduleId: string, issues: string[]) {
    super(`Manifest inválido para "${moduleId}":\n- ${issues.join("\n- ")}`)
    this.name = "ManifestValidationError"
  }
}

const ID_PATTERN = /^[a-z][a-z0-9-]*$/
const FLAG_KEY_PATTERN = /^[a-z0-9-]+$/

export function validateManifest(manifest: ModuleManifest): void {
  const issues: string[] = []

  if (!manifest.id || !ID_PATTERN.test(manifest.id)) {
    issues.push(
      `id "${manifest.id}" deve ser kebab-case (ex: "notes", "settings-demo")`,
    )
  }
  if (!manifest.name) issues.push("name é obrigatório")
  if (!manifest.version) issues.push("version é obrigatório")
  if (!manifest.routes?.length) {
    issues.push("o manifesto deve declarar ao menos 1 rota")
  }

  // Cada rota precisa apontar para uma tela existente
  const screenKeys = new Set(Object.keys(manifest.screens ?? {}))
  for (const route of manifest.routes ?? []) {
    if (!screenKeys.has(route.screen)) {
      issues.push(
        `rota "${route.path}" aponta para screen "${route.screen}" que não existe em screens`,
      )
    }
  }

  // Navigation items devem existir em routes
  const routePaths = new Set((manifest.routes ?? []).map((r) => r.path))
  for (const nav of manifest.navigation ?? []) {
    if (!routePaths.has(nav.path)) {
      issues.push(
        `nav "${nav.label}" aponta para path "${nav.path}" que não está em routes`,
      )
    }
  }

  // v2 — feature flags: keys únicas e em kebab-case
  const flagKeys = new Set<string>()
  for (const flag of manifest.featureFlags ?? []) {
    if (!FLAG_KEY_PATTERN.test(flag.key)) {
      issues.push(`featureFlag.key "${flag.key}" deve ser kebab-case`)
    }
    if (flagKeys.has(flag.key)) {
      issues.push(`featureFlag.key "${flag.key}" duplicada`)
    }
    flagKeys.add(flag.key)
  }

  // v2 — supportedContexts: precisa ter ao menos 1
  if ((manifest.supportedContexts?.length ?? 0) === 0) {
    issues.push(
      'supportedContexts deve conter ao menos um valor (ex: ["web"])',
    )
  }

  if (issues.length > 0) {
    throw new ManifestValidationError(manifest.id || "<sem id>", issues)
  }
}
