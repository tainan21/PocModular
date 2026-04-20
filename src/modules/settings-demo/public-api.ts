/**
 * API pública do módulo Settings Demo.
 *
 * Papel: expor leitura de flags/preferências por moduleId
 * para os outros módulos, sem vazar prisma ou schema.
 *
 * Outros módulos só dependem DESTE arquivo.
 */
import "server-only"
import { getModulePreference } from "./application/queries"

/**
 * Retorna uma feature flag booleana de um módulo.
 * Se não estiver setada, devolve o default informado.
 */
export async function getFeatureFlag(
  moduleId: string,
  flag: string,
  fallback: boolean,
): Promise<boolean> {
  const pref = await getModulePreference(moduleId)
  const value = pref.settings?.[`flag:${flag}`]
  return typeof value === "boolean" ? value : fallback
}
