"use server"

import { revalidatePath } from "next/cache"
import { getRegistry } from "@host/registry"
import { getPreferencesPort } from "../infra/preferences-factory"

/**
 * Atualiza as preferências de um módulo de forma genérica:
 *  - enabled / order
 *  - um valor por feature flag declarada no manifest do módulo
 *
 * Para cada flag declarada, o form envia um campo `flag:<key>`
 * que vira a entrada `flag:<key>: boolean` em `settings`.
 *
 * A escrita passa pelo `preferences-factory`, então se a DB cair, os
 * valores vão para a impl em memória (perdidos ao reiniciar, mas a UI
 * não quebra).
 */
export async function saveModulePreferenceAction(formData: FormData) {
  const moduleId = String(formData.get("moduleId") ?? "")
  const enabled = formData.get("enabled") === "on"
  const order = Number(formData.get("order") ?? 0)

  const registry = getRegistry()
  const manifest = registry.get(moduleId)

  const settings: Record<string, unknown> = {}
  for (const flag of manifest?.featureFlags ?? []) {
    settings[`flag:${flag.key}`] = formData.get(`flag:${flag.key}`) === "on"
  }

  await getPreferencesPort().upsert(moduleId, {
    enabled,
    order,
    settingsJson: JSON.stringify(settings),
  })

  // invalida host inteiro: o estado de enabled/disabled muda sidebar/home
  revalidatePath("/", "layout")
}
