import type { ReactNode } from "react"

export interface MetaChipListProps {
  label: string
  items: string[]
  empty?: string
}

export function MetaChipList({ label, items, empty = "—" }: MetaChipListProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {items.length === 0 ? (
        <span className="text-xs text-muted-foreground">{empty}</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((it) => (
            <span
              key={it}
              className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {it}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export interface ModuleMetaPanelProps {
  moduleId: string
  version: string
  area: string
  basePath: string
  routes: { path: string; fullPath: string; label?: string }[]
  capabilities: string[]
  contexts: string[]
  dependencies: string[]
  actions?: ReactNode
}

export function ModuleMetaPanel({
  moduleId,
  version,
  area,
  basePath,
  routes,
  capabilities,
  contexts,
  dependencies,
  actions,
}: ModuleMetaPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <code className="font-mono text-sm font-semibold">{moduleId}</code>
          <span className="text-xs text-muted-foreground">
            v{version} · área {area} · base <code className="font-mono">{basePath}</code>
          </span>
        </div>
        {actions}
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetaChipList label="Capabilities" items={capabilities} />
        <MetaChipList label="Contextos suportados" items={contexts} empty="web (padrão)" />
        <MetaChipList label="Dependências" items={dependencies} empty="nenhuma" />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Rotas ({routes.length})
        </span>
        <ul className="flex flex-col divide-y rounded-md border">
          {routes.map((r) => (
            <li
              key={r.fullPath}
              className="flex items-center justify-between gap-3 p-2.5 text-xs"
            >
              <code className="font-mono text-foreground">{r.fullPath}</code>
              {r.label ? (
                <span className="text-muted-foreground">{r.label}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
