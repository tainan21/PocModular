/**
 * Breadcrumbs derivados da rota + manifest.
 *
 * Entrada: um RouteMatch (retornado pelo registry).
 * Saída: uma lista de crumbs { label, href? } pronta para renderização.
 *
 * Decisões didáticas:
 *  - "Home" sempre é o primeiro crumb
 *  - Módulo (ex.: "Notes") é o segundo crumb, com href para basePath
 *  - Se a rota for o raiz do módulo, paramos aí (só dois crumbs)
 *  - Senão, terceiro crumb usa o route.label e NÃO tem href (é o atual)
 */
import type { RouteMatch } from "@host/core/contracts"
import type { ModuleRegistry } from "@host/registry/module-registry"

export interface Breadcrumb {
  label: string
  href?: string
}

export function buildBreadcrumbs(
  match: RouteMatch,
  registry: ModuleRegistry,
): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [{ label: "Home", href: "/" }]

  const manifest = registry.get(match.moduleId)
  if (!manifest) return crumbs

  crumbs.push({
    label: manifest.name,
    href: match.moduleBasePath,
  })

  // Na rota raiz do módulo, não adicionamos terceiro crumb
  if (match.route.path === "") return crumbs

  const label = match.route.label ?? match.route.screen
  crumbs.push({ label: interpolate(label, match.params) })
  return crumbs
}

/**
 * Interpolação simples: substitui :key do label pelo valor em params.
 * Se não houver match, devolve o label original.
 */
function interpolate(label: string, params: Record<string, string>): string {
  return label.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => params[key] ?? `:${key}`)
}
