/**
 * ModuleNavItem — itens de navegação que o módulo expõe ao host.
 *
 * O host combina os nav items de todos os módulos para montar a sidebar global.
 * O path é relativo ao basePath do módulo.
 */
export interface ModuleNavItem {
  label: string
  /** Path relativo ao basePath do módulo. Ex: "" (root), "new", "settings" */
  path: string
  icon?: string
  order?: number
}

/** Item resolvido pelo host, já com caminho absoluto. */
export interface ResolvedNavItem {
  moduleId: string
  moduleName: string
  label: string
  href: string
  icon?: string
  order: number
  area: "main" | "settings" | "system"
}
