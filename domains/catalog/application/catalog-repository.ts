import type { CatalogItem } from "../domain/catalog-item"

export interface CatalogRepository {
  list(filter?: { category?: string }): Promise<CatalogItem[]>
  findById(id: string): Promise<CatalogItem | null>
  listCategories(): Promise<string[]>
}
