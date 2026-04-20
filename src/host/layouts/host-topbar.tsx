import Link from "next/link"
import { Boxes } from "lucide-react"
import { getRegistry } from "@host/registry"

export function HostTopbar() {
  const count = getRegistry().list().length
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <Link href="/" className="flex items-center gap-2">
        <Boxes className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">Host Platform</span>
        <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">POC</span>
      </Link>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {count} {count === 1 ? "módulo registrado" : "módulos registrados"}
        </span>
      </div>
    </header>
  )
}
