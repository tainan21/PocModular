import type { CatalogItem } from "../domain/catalog-item"
import type { CatalogRepository } from "./catalog-repository"

export async function listCatalog(
  deps: { repo: CatalogRepository },
  filter?: { category?: string },
): Promise<CatalogItem[]> {
  return deps.repo.list(filter)
}

export async function getCatalogItem(
  deps: { repo: CatalogRepository },
  input: { id: string },
): Promise<CatalogItem | null> {
  return deps.repo.findById(input.id)
}

export async function listCategories(deps: { repo: CatalogRepository }): Promise<string[]> {
  return deps.repo.listCategories()
}
