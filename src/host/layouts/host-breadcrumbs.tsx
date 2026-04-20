import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { Breadcrumb } from "@host/runtime/breadcrumbs"

/**
 * Breadcrumbs renderizados. O host NÃO constrói a lista — ele só pinta.
 * A lista vem do runtime (ver runtime/breadcrumbs.ts).
 */
export function HostBreadcrumbs({ items }: { items: Breadcrumb[] }) {
  if (items.length === 0) return null
  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto flex w-full max-w-5xl items-center gap-1.5 text-sm text-muted-foreground"
    >
      {items.map((c, i) => {
        const isLast = i === items.length - 1
        return (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 ? <ChevronRight className="size-3.5 opacity-60" aria-hidden /> : null}
            {c.href && !isLast ? (
              <Link href={c.href} className="hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground" : undefined}>{c.label}</span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
