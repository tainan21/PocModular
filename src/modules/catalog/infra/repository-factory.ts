/**
 * Fábrica resiliente de CatalogRepository.
 * Ver comentário em `tasks/infra/repository-factory.ts` — mesma mecânica.
 */
import "server-only"
import type { CatalogRepository } from "@domains/catalog"
import {
  hasPlausibleDatabaseUrl,
  withDatasourceFallback,
} from "@server/platform/resilience"
import { MemoryCatalogRepository } from "./memory-catalog-repository"

let cached: CatalogRepository | null = null

export function getCatalogRepository(): CatalogRepository {
  if (cached) return cached

  if (!hasPlausibleDatabaseUrl()) {
    // eslint-disable-next-line no-console
    console.warn(
      "[catalog] DATABASE_URL ausente/inválida. Usando MemoryCatalogRepository.",
    )
    cached = new MemoryCatalogRepository()
    return cached
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaCatalogRepository } = require("./prisma-catalog-repository") as {
    PrismaCatalogRepository: new () => CatalogRepository
  }

  cached = withDatasourceFallback<CatalogRepository>(
    "catalog",
    new PrismaCatalogRepository(),
    () => new MemoryCatalogRepository(),
  )
  return cached
}
