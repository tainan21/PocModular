"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ManifestIcon } from "../navigation/icon"
import type { ResolvedNavItem } from "../core/contracts"
import { Boxes } from "lucide-react"

/**
 * Sidebar global do host.
 * Recebe a navegação já RESOLVIDA pelo registry — não conhece módulos.
 */
export function HostSidebar({ items }: { items: ResolvedNavItem[] }) {
  const pathname = usePathname()

  // v3: os módulos de sistema usam area: "system". Mantemos "settings" por
  // compatibilidade com manifests mais antigos.
  const mainItems = items.filter((i) => i.area === "main")
  const systemItems = items.filter((i) => i.area === "system" || i.area === "settings")

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Boxes className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Host POC</span>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
        <NavSection title="Aplicativos" items={mainItems} activePath={pathname} />
        {systemItems.length > 0 ? (
          <NavSection title="Sistema" items={systemItems} activePath={pathname} />
        ) : null}
      </nav>
    </aside>
  )
}

function NavSection({
  title,
  items,
  activePath,
}: {
  title: string
  items: ResolvedNavItem[]
  activePath: string
}) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-1">
      <span className="px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      {items.map((item) => {
        const active = activePath === item.href || activePath.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <ManifestIcon name={item.icon} className="size-4" />
            <span className="flex-1 text-pretty">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
