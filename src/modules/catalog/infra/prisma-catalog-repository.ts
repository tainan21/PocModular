import { CatalogItem, type CatalogRepository } from "@domains/catalog"
import { prisma } from "@server/db/prisma"

export class PrismaCatalogRepository implements CatalogRepository {
  async list(filter?: { category?: string }): Promise<CatalogItem[]> {
    const rows = await prisma.catalogItem.findMany({
      where: filter?.category ? { category: filter.category } : undefined,
      orderBy: { name: "asc" },
    })
    return rows.map((r) =>
      CatalogItem.hydrate({
        id: r.id,
        sku: r.sku,
        name: r.name,
        description: r.description,
        category: r.category,
        priceCents: r.priceCents,
        createdAt: r.createdAt,
      }),
    )
  }

  async findById(id: string): Promise<CatalogItem | null> {
    const r = await prisma.catalogItem.findUnique({ where: { id } })
    if (!r) return null
    return CatalogItem.hydrate({
      id: r.id,
      sku: r.sku,
      name: r.name,
      description: r.description,
      category: r.category,
      priceCents: r.priceCents,
      createdAt: r.createdAt,
    })
  }

  async listCategories(): Promise<string[]> {
    const rows = await prisma.catalogItem.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    })
    return rows.map((r) => r.category)
  }
}
