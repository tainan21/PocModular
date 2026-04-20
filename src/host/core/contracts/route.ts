/**
 * ModuleRoute — uma rota interna declarada pelo módulo.
 *
 * Exemplos:
 *   { path: "",          screen: "list",  label: "Notas" }
 *   { path: "new",       screen: "form",  label: "Nova" }
 *   { path: "edit/:id",  screen: "form",  label: "Editar" }
 *
 * O host combina o path do URL com o path declarado para descobrir
 * qual tela renderizar e quais params extrair. `label` também alimenta
 * breadcrumbs (ver host/runtime/breadcrumbs).
 */
import type { ScreenComponent } from "./manifest"

export interface ModuleRoute {
  /** Path relativo ao basePath do módulo. Suporta segmentos ":param". */
  path: string
  /** Chave da tela em manifest.screens. */
  screen: string
  /** Rótulo humano — usado em breadcrumbs e futuros títulos. */
  label?: string
}

/** Resultado do match de rota, com tudo que o host precisa para renderizar. */
export interface RouteMatch {
  moduleId: string
  moduleBasePath: string
  route: ModuleRoute
  params: Record<string, string>
  /** Componente de tela já resolvido. */
  Screen: ScreenComponent
}
