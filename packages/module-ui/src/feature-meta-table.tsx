import type { ReactNode } from "react"

export interface FeatureRow {
  key: string
  label: string
  description?: string
  moduleId: string
  current: boolean
  default: boolean
  actions?: ReactNode
}

export function FeatureMetaTable({ rows }: { rows: FeatureRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhuma feature declarada.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Feature</th>
            <th className="px-3 py-2 text-left font-medium">Módulo</th>
            <th className="px-3 py-2 text-left font-medium">Default</th>
            <th className="px-3 py-2 text-left font-medium">Atual</th>
            <th className="px-3 py-2 text-right font-medium">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={`${r.moduleId}-${r.key}`} className="bg-background">
              <td className="px-3 py-2.5">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{r.label}</span>
                  <code className="font-mono text-[10px] text-muted-foreground">{r.key}</code>
                  {r.description ? (
                    <span className="mt-0.5 text-xs text-muted-foreground">{r.description}</span>
                  ) : null}
                </div>
              </td>
              <td className="px-3 py-2.5">
                <code className="font-mono text-xs text-muted-foreground">{r.moduleId}</code>
              </td>
              <td className="px-3 py-2.5">
                <BoolChip value={r.default} />
              </td>
              <td className="px-3 py-2.5">
                <BoolChip value={r.current} />
              </td>
              <td className="px-3 py-2.5 text-right">{r.actions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BoolChip({ value }: { value: boolean }) {
  return (
    <span
      className={
        value
          ? "inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400"
          : "inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground ring-1 ring-muted/40"
      }
    >
      {value ? "ON" : "OFF"}
    </span>
  )
}
