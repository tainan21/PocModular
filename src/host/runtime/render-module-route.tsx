import { notFound } from "next/navigation"
import { getRegistryView } from "./registry-view"
import { buildBreadcrumbs } from "./breadcrumbs"
import { HostBreadcrumbs } from "../layouts/host-breadcrumbs"
import { DisabledModuleScreen } from "../layouts/disabled-module-screen"
import { ExperimentalBanner } from "../layouts/experimental-banner"

/**
 * Helper compartilhado pelos catch-alls do Next.
 *
 * Recebe o path completo (ex.: "/m/notes/new" ou "/admin/flags/tasks")
 * e renderiza a UI apropriada: tela do módulo, fallback de disabled
 * ou banner de experimental.
 *
 * O host só precisa repassar o path; toda a decisão mora aqui.
 */
export async function renderModuleRoute(fullPath: string) {
  const registry = await getRegistryView()
  const match = registry.resolveRoute(fullPath)
  if (!match) notFound()

  const info = registry.describe(match.moduleId)!
  const breadcrumbs = buildBreadcrumbs(match, registry)

  if (info.effectiveState !== "available") {
    return (
      <div className="flex flex-col gap-4">
        <HostBreadcrumbs items={breadcrumbs} />
        <DisabledModuleScreen info={info} />
      </div>
    )
  }

  const { Screen, params: routeParams, moduleBasePath } = match
  const isExperimental = info.manifest.status === "experimental"

  return (
    <div className="flex flex-col gap-4">
      <HostBreadcrumbs items={breadcrumbs} />
      {isExperimental ? <ExperimentalBanner moduleName={info.manifest.name} /> : null}
      <Screen params={routeParams} moduleBasePath={moduleBasePath} />
    </div>
  )
}
