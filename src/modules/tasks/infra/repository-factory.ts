/**
 * Fábrica resiliente de TasksRepository.
 *
 * Estratégia em duas camadas:
 *
 * 1) `hasPlausibleDatabaseUrl()` — checa o shape de `DATABASE_URL` ANTES de
 *    tocar Prisma. Se estiver vazio ou inválido, vamos direto pra
 *    MemoryTasksRepository sem NUNCA criar um PrismaClient. Isso é o que
 *    realmente previne o erro "url must start with the protocol `file:`",
 *    porque esse erro só aparece na primeira query, não na construção do
 *    cliente — um Proxy tardio não ajuda.
 *
 * 2) `withDatasourceFallback` — quando a URL é plausível, embrulhamos o
 *    repo Prisma num Proxy que captura erros de datasource em runtime
 *    (DB caiu no meio da sessão, DB sem schema, etc.) e degrada para
 *    memória permanentemente neste worker.
 *
 * A construção é **lazy** — só criamos PrismaTasksRepository na primeira
 * chamada a `getTasksRepository()`. Isso permite ao Next.js carregar
 * variáveis de ambiente do `.env` antes do primeiro acesso.
 */
import "server-only"
import type { TasksRepository } from "@domains/tasks"
import {
  hasPlausibleDatabaseUrl,
  withDatasourceFallback,
} from "@server/platform/resilience"
import { MemoryTasksRepository } from "./memory-tasks-repository"

let cached: TasksRepository | null = null

export function getTasksRepository(): TasksRepository {
  if (cached) return cached

  if (!hasPlausibleDatabaseUrl()) {
    // DATABASE_URL ausente/inválida — nem criamos PrismaClient.
    // eslint-disable-next-line no-console
    console.warn(
      "[tasks] DATABASE_URL ausente/inválida. Usando MemoryTasksRepository.",
    )
    cached = new MemoryTasksRepository()
    return cached
  }

  // Lazy import do Prisma repo para não criar o cliente quando estamos em
  // memory-mode (isso economiza o custo do PrismaClient init).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaTasksRepository } = require("./prisma-tasks-repository") as {
    PrismaTasksRepository: new () => TasksRepository
  }

  cached = withDatasourceFallback<TasksRepository>(
    "tasks",
    new PrismaTasksRepository(),
    () => new MemoryTasksRepository(),
  )
  return cached
}
