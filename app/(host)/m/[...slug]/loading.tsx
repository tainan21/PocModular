import { LoadingPanel } from "@poc/module-ui"

/**
 * Loading boundary por módulo.
 *
 * Delega o visual ao package visual, mantendo o host limpo.
 */
export default function ModuleLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl">
      <LoadingPanel label="Carregando módulo..." />
    </div>
  )
}
