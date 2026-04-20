/**
 * Estado runtime dos módulos — camada com I/O (Prisma).
 *
 * ESTE é o único arquivo do runtime que fala com o banco. A derivação
 * pura (combinar manifest + override) vive em runtime-info.ts e é
 * consumida aqui e pelo registry.
 *
 * Convenção de storage de flags em `ModulePreference.settingsJson`:
 *   { "flag:<key>": boolean, ... outras coisas arbitrárias }
 *
 * Essa convenção é compartilhada com `settings-demo/public-api.ts`.
 */
import { prisma } from "@server/db/prisma"
import type { ModuleOverrideMap } from "./runtime-info"

export type { ModuleOverride, ModuleOverrideMap } from "./runtime-info"
export { deriveRuntimeInfo, defaultFlags } from "./runtime-info"

const FLAG_PREFIX = "flag:"

/** Carrega overrides persistidos para todos os módulos. */
export async function loadModuleOverrides(): Promise<ModuleOverrideMap> {
  const rows = await prisma.modulePreference.findMany()
  const map: ModuleOverrideMap = {}
  for (const row of rows) {
    const settings = safeParse<Record<string, unknown>>(row.settingsJson) ?? {}
    const flags: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(settings)) {
      if (key.startsWith(FLAG_PREFIX) && typeof value === "boolean") {
        flags[key.slice(FLAG_PREFIX.length)] = value
      }
    }
    map[row.moduleId] = { enabled: row.enabled, flags }
  }
  return map
}

/** Liga/desliga um módulo no banco. Idempotente. */
export async function setModuleEnabled(
  moduleId: string,
  enabled: boolean,
): Promise<void> {
  await prisma.modulePreference.upsert({
    where: { moduleId },
    create: { moduleId, enabled },
    update: { enabled },
  })
}

function safeParse<T>(value: string | null | undefined): T | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as T
  } catch {
    return undefined
  }
}
