/**
 * Impl em memória do CatalogRepository — fallback quando o Prisma não estiver
 * disponível. Dados seed semelhantes aos do `scripts/seed.mjs` para a UI do
 * Catalog ter algo para mostrar mesmo em modo degradado.
 */
import { CatalogItem, type CatalogRepository } from "@domains/catalog"

const seed: ReadonlyArray<{
  id: string
  sku: string
  name: string
  description: string
  category: string
  priceCents: number
  createdAt: Date
}> = [
  {
    id: "mem-cat-1",
    sku: "ESP-001",
    name: "Espresso Clássico",
    description: "Café expresso curto, 30 ml.",
    category: "Bebidas",
    priceCents: 890,
    createdAt: new Date("2025-01-01T10:00:00Z"),
  },
  {
    id: "mem-cat-2",
    sku: "CAP-001",
    name: "Cappuccino",
    description: "Espresso com leite vaporizado e espuma.",
    category: "Bebidas",
    priceCents: 1490,
    createdAt: new Date("2025-01-02T10:00:00Z"),
  },
  {
    id: "mem-cat-3",
    sku: "PAO-001",
    name: "Pão de Queijo",
    description: "Unidade tradicional mineira.",
    category: "Padaria",
    priceCents: 650,
    createdAt: new Date("2025-01-03T10:00:00Z"),
  },
]

function toDomain(r: (typeof seed)[number]): CatalogItem {
  return CatalogItem.hydrate({ ...r })
}

export class MemoryCatalogRepository implements CatalogRepository {
  async list(filter?: { category?: string }): Promise<CatalogItem[]> {
    const rows = filter?.category
      ? seed.filter((r) => r.category === filter.category)
      : [...seed]
    return rows
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(toDomain)
  }

  async findById(id: string): Promise<CatalogItem | null> {
    const r = seed.find((x) => x.id === id)
    return r ? toDomain(r) : null
  }

  async listCategories(): Promise<string[]> {
    return Array.from(new Set(seed.map((r) => r.category))).sort()
  }
}
