import Link from "next/link"
import { PageShell } from "@poc/module-ui"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAllCatalogItems, getCategories } from "../../application/queries"

interface Props {
  params: Record<string, string>
  moduleBasePath: string
  searchParams?: { category?: string }
}

export async function CatalogListScreen(props: Props) {
  // Nota: esta POC lê searchParams do provedor externo (page wrapper).
  // Para simplificar o contrato do manifest, suportamos leitura direta via params.
  const category = props.params.category
  const [items, categories] = await Promise.all([
    getAllCatalogItems({ category }),
    getCategories(),
  ])

  return (
    <PageShell
      title="Catalog"
      description="Listagem read-only — prova módulo de leitura com dados populados no seed."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={props.moduleBasePath}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            !category ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
          }`}
        >
          Todos
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`${props.moduleBasePath}/category/${encodeURIComponent(c)}`}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              category === c ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-pretty">{item.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">SKU: {item.sku}</p>
                </div>
                <Badge variant="outline">{item.category}</Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {item.description}
              </p>
              <div className="mt-auto flex items-center justify-between border-t pt-3">
                <span className="text-base font-semibold">{item.priceFormatted}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}
