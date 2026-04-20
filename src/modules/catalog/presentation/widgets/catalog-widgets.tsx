import Link from "next/link"
import { getAllCatalogItems } from "../../application/queries"

export async function CatalogHighlightsWidget() {
  const items = (await getAllCatalogItems()).slice(0, 4)
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Catálogo vazio.</p>
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it) => (
        <li key={it.id}>
          <Link
            href={`/m/catalog/category/${encodeURIComponent(it.category)}`}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            <span className="line-clamp-1 font-medium">{it.name}</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {it.priceFormatted}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
