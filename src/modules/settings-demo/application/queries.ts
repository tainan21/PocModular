import "server-only"
import { getPreferencesPort } from "../infra/preferences-factory"

/**
 * Settings Demo — prova o uso de `ModulePreference` para configuração
 * persistida por módulo (chave/valor JSON por moduleId).
 *
 * Nenhum domínio próprio: é puramente um módulo de configuração.
 * A leitura passa pelo `preferences-factory`, que tem fallback em memória
 * se a DB não responder.
 */
export interface ModulePreferenceDTO {
  moduleId: string
  enabled: boolean
  order: number
  settings: Record<string, unknown>
  updatedAt: Date | null
}

function parseSettings(json: string): Record<string, unknown> {
  if (!json) return {}
  try {
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function getModulePreference(moduleId: string): Promise<ModulePreferenceDTO> {
  const row = await getPreferencesPort().findUnique(moduleId)
  if (!row) {
    return { moduleId, enabled: true, order: 0, settings: {}, updatedAt: null }
  }
  return {
    moduleId: row.moduleId,
    enabled: row.enabled,
    order: row.order,
    settings: parseSettings(row.settingsJson),
    updatedAt: row.updatedAt,
  }
}

export async function listAllPreferences(): Promise<ModulePreferenceDTO[]> {
  const rows = await getPreferencesPort().findMany()
  return rows.map((r) => ({
    moduleId: r.moduleId,
    enabled: r.enabled,
    order: r.order,
    settings: parseSettings(r.settingsJson),
    updatedAt: r.updatedAt,
  }))
}
