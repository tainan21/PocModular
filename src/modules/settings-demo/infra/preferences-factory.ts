/**
 * Acesso resiliente à tabela ModulePreference.
 *
 * O settings-demo originalmente falava com `prisma.modulePreference` direto
 * em queries/actions. Qualquer problema de infra (schema não aplicado, DB
 * inexistente) derrubava Notes, pois Notes lê feature flags via Settings
 * para decidir o repositório.
 *
 * Agora:
 *  - Se `DATABASE_URL` é inválida, usamos o port em memória direto (sem
 *    instanciar Prisma).
 *  - Caso contrário, embrulhamos o port Prisma com `withDatasourceFallback`
 *    para degradar em runtime se necessário.
 */
import "server-only"
import {
  hasPlausibleDatabaseUrl,
  withDatasourceFallback,
} from "@server/platform/resilience"
import {
  memoryPreferencesPort,
  type MemoryPreferencesPort,
  type MemoryPreferenceRow,
} from "./memory-preferences-store"

// Criamos o port Prisma de forma lazy — o módulo prisma.ts só é carregado
// se realmente vamos usá-lo. Isso evita construir o PrismaClient quando
// o DATABASE_URL é inválido, o que é a fonte do erro que estamos corrigindo.
function createPrismaPort(): MemoryPreferencesPort {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma } = require("@server/db/prisma") as {
    prisma: {
      modulePreference: {
        findUnique: (args: { where: { moduleId: string } }) => Promise<{
          moduleId: string
          enabled: boolean
          order: number
          settingsJson: string | null
          updatedAt: Date
        } | null>
        findMany: (args: { orderBy: { moduleId: "asc" } }) => Promise<
          Array<{
            moduleId: string
            enabled: boolean
            order: number
            settingsJson: string | null
            updatedAt: Date
          }>
        >
        upsert: (args: {
          where: { moduleId: string }
          create: Record<string, unknown>
          update: Record<string, unknown>
        }) => Promise<unknown>
      }
    }
  }
  const model = prisma.modulePreference
  return {
    async findUnique(moduleId) {
      const row = await model.findUnique({ where: { moduleId } })
      if (!row) return null
      return {
        moduleId: row.moduleId,
        enabled: row.enabled,
        order: row.order,
        settingsJson: row.settingsJson ?? "",
        updatedAt: row.updatedAt,
      } satisfies MemoryPreferenceRow
    },
    async findMany() {
      const rows = await model.findMany({ orderBy: { moduleId: "asc" } })
      return rows.map(
        (r) =>
          ({
            moduleId: r.moduleId,
            enabled: r.enabled,
            order: r.order,
            settingsJson: r.settingsJson ?? "",
            updatedAt: r.updatedAt,
          }) satisfies MemoryPreferenceRow,
      )
    },
    async upsert(moduleId, data) {
      await model.upsert({
        where: { moduleId },
        create: { moduleId, ...data },
        update: data,
      })
    },
  }
}

let cached: MemoryPreferencesPort | null = null

export function getPreferencesPort(): MemoryPreferencesPort {
  if (cached) return cached

  if (!hasPlausibleDatabaseUrl()) {
    // eslint-disable-next-line no-console
    console.warn(
      "[settings-demo] DATABASE_URL ausente/inválida. Usando port em memória.",
    )
    cached = memoryPreferencesPort
    return cached
  }

  cached = withDatasourceFallback<MemoryPreferencesPort>(
    "settings-demo.preferences",
    createPrismaPort(),
    () => memoryPreferencesPort,
  )
  return cached
}
