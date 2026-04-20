import { FlaskConical } from "lucide-react"

export function ExperimentalBanner({ moduleName }: { moduleName: string }) {
  return (
    <div
      role="status"
      className="mx-auto flex w-full max-w-5xl items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm"
    >
      <FlaskConical className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <span className="text-amber-800 dark:text-amber-200">
        <strong>{moduleName}</strong> está marcado como experimental no manifest.
        APIs e comportamento podem mudar.
      </span>
    </div>
  )
}
