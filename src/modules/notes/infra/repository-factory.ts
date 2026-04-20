/**
 * Fábrica de NotesRepository.
 *
 * Três camadas de seleção:
 *  1) FEATURE FLAG `notes.usa-memory-repo`. Se ligada, força MemoryRepo.
 *  2) DATABASE_URL ausente/inválida → Memory direto (sem instanciar Prisma).
 *  3) Quando Prisma é usado, embrulhamos com `withDatasourceFallback` para
 *     cair em memória se o DB explodir em runtime.
 */
import "server-only"
import type { NotesRepository } from "@domains/notes"
import * as settingsApi from "../../settings-demo/public-api"
import {
  hasPlausibleDatabaseUrl,
  withDatasourceFallback,
} from "@server/platform/resilience"
import { MemoryNotesRepository } from "./memory-notes-repository"

// Singletons por processo. Todas as chamadas compartilham a mesma instância.
const memoryRepo = new MemoryNotesRepository()
let resilientPrismaRepo: NotesRepository | null = null

function getResilientPrisma(): NotesRepository {
  if (resilientPrismaRepo) return resilientPrismaRepo

  if (!hasPlausibleDatabaseUrl()) {
    // eslint-disable-next-line no-console
    console.warn(
      "[notes] DATABASE_URL ausente/inválida. Usando MemoryNotesRepository.",
    )
    resilientPrismaRepo = memoryRepo
    return resilientPrismaRepo
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaNotesRepository } = require("./prisma-notes-repository") as {
    PrismaNotesRepository: new () => NotesRepository
  }

  resilientPrismaRepo = withDatasourceFallback<NotesRepository>(
    "notes",
    new PrismaNotesRepository(),
    () => new MemoryNotesRepository(),
  )
  return resilientPrismaRepo
}

export async function getNotesRepository(): Promise<NotesRepository> {
  const useMemory = await settingsApi.getFeatureFlag(
    "notes",
    "usa-memory-repo",
    false,
  )
  return useMemory ? memoryRepo : getResilientPrisma()
}
