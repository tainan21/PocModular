import "server-only"
import { listCatalog, getCatalogItem, listCategories } from "@domains/catalog"
import { getCatalogRepository } from "../infra/repository-factory"

export async function getAllCatalogItems(filter?: { category?: string }) {
  const items = await listCatalog({ repo: getCatalogRepository() }, filter)
  return items.map((i) => ({ ...i.toJSON(), priceFormatted: i.priceFormatted }))
}

export async function getCategories() {
  return listCategories({ repo: getCatalogRepository() })
}

export async function getItemById(id: string) {
  const item = await getCatalogItem({ repo: getCatalogRepository() }, { id })
  if (!item) return null
  return { ...item.toJSON(), priceFormatted: item.priceFormatted }
}
