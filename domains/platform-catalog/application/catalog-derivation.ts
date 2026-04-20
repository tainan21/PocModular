/**
 * Funções puras de derivação: combinam manifest + catálogo + seleção do
 * usuário em um único estado efetivo legível pelo host.
 *
 * Sem I/O. Sem framework. Testável isoladamente.
 */
import type { ModuleCatalogEntryProps } from "../domain/module-catalog-entry"
import { defaultCatalogEntry } from "../domain/module-catalog-entry"

/** Um subconjunto mínimo do manifest que este módulo precisa conhecer. */
export interface ManifestSummary {
  id: string
  status: "active" | "experimental" | "hidden" | "disabled"
  enabledByDefault: boolean
  dependencies?: string[]
  supportedContexts?: string[]
}

/** Escolha do usuário por módulo. */
export interface UserSelection {
  moduleId: string
  selected: boolean
  pinned: boolean
}

/** Estado efetivo combinado. */
export type EffectiveState =
  | "available" // pronto para uso
  | "globally-disabled" // admin desligou via catálogo
  | "not-selected" // usuário não escolheu no onboarding
  | "dep-blocked" // dependência não atendida
  | "context-unsupported" // não suporta o contexto atual
  | "code-disabled" // manifest.status=disabled

export interface EffectiveInfo {
  moduleId: string
  effectiveState: EffectiveState
  reason?: string
}

export interface DeriveInput {
  manifests: ManifestSummary[]
  catalog: Record<string, ModuleCatalogEntryProps | undefined>
  selections: Record<string, UserSelection | undefined>
  currentContext?: string
}

export function deriveEffectiveStates(input: DeriveInput): EffectiveInfo[] {
  const { manifests, catalog, selections, currentContext = "web" } = input

  const out: EffectiveInfo[] = []
  const stateById = new Map<string, EffectiveInfo>()

  for (const m of manifests) {
    const info = deriveOne(m, catalog[m.id], selections[m.id], currentContext)
    out.push(info)
    stateById.set(m.id, info)
  }

  // Segunda passada: bloquear por dependência quebrada
  for (const m of manifests) {
    const current = stateById.get(m.id)!
    if (current.effectiveState !== "available") continue
    for (const depId of m.dependencies ?? []) {
      const dep = stateById.get(depId)
      if (!dep || dep.effectiveState !== "available") {
        const result: EffectiveInfo = {
          moduleId: m.id,
          effectiveState: "dep-blocked",
          reason: `Depende de "${depId}" (${dep?.effectiveState ?? "inexistente"})`,
        }
        stateById.set(m.id, result)
        const idx = out.findIndex((x) => x.moduleId === m.id)
        out[idx] = result
      }
    }
  }

  return out
}

function deriveOne(
  manifest: ManifestSummary,
  catalog: ModuleCatalogEntryProps | undefined,
  selection: UserSelection | undefined,
  currentContext: string,
): EffectiveInfo {
  if (manifest.status === "disabled") {
    return {
      moduleId: manifest.id,
      effectiveState: "code-disabled",
      reason: "Desabilitado no manifest",
    }
  }

  const contexts = manifest.supportedContexts ?? ["web"]
  if (!contexts.includes(currentContext)) {
    return {
      moduleId: manifest.id,
      effectiveState: "context-unsupported",
      reason: `Contexto ${currentContext} não suportado`,
    }
  }

  const entry = catalog ?? defaultCatalogEntry(manifest.id)
  if (!entry.globallyEnabled) {
    return {
      moduleId: manifest.id,
      effectiveState: "globally-disabled",
      reason: "Desabilitado pelo admin no catálogo",
    }
  }

  // Módulos de sistema (internal) não exigem seleção do usuário.
  if (entry.pricingModel === "internal") {
    return { moduleId: manifest.id, effectiveState: "available" }
  }

  const isSelected = selection?.selected ?? manifest.enabledByDefault
  if (!isSelected) {
    return {
      moduleId: manifest.id,
      effectiveState: "not-selected",
      reason: "Não selecionado pelo usuário",
    }
  }

  return { moduleId: manifest.id, effectiveState: "available" }
}

export function isAvailable(info: EffectiveInfo): boolean {
  return info.effectiveState === "available"
}
