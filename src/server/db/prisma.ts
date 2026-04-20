/**
 * Prisma client singleton.
 *
 * Mantido na camada server/db. Os módulos não importam daqui diretamente:
 * apenas os repositórios concretos (em cada modules/<id>/infra) usam isto.
 */
import { PrismaClient } from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function createClient() {
  const isDev = process.env.NODE_ENV === "development"
  return new PrismaClient({
    log: isDev ? ["error", "warn"] : ["error"],
  })
}

export const prisma = globalThis.__prisma ?? createClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma
}
