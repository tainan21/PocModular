# Registry

O registry é um objeto singleton que:

1. **Registra** manifests (com validação).
2. **Lista** os módulos habilitados.
3. **Monta a navegação global** a partir dos manifests.
4. **Resolve rotas** internas (path → screen + params).

## Interface

```ts
interface IModuleRegistry {
  register(manifest: ModuleManifest): void
  registerAll(manifests: ModuleManifest[]): void
  list(): ModuleManifest[]            // apenas enabled
  listAll(): ModuleManifest[]         // inclui desabilitados
  get(id: string): ModuleManifest | undefined
  buildNavigation(): ResolvedNavItem[]
  resolveRoute(fullPath: string): RouteMatch | undefined
  basePathOf(moduleId: string): string
}
```

O host só consome **este contrato**. A implementação concreta é
`ModuleRegistry` (em memória). Se um dia precisarmos de descoberta
dinâmica ou remota, basta criar outra implementação.

## Bootstrap

Todos os módulos são registrados em um **único arquivo**:

```ts
// src/host/registry/index.ts
const registry = new ModuleRegistry()
registry.registerAll([
  notesManifest,
  tasksManifest,
  catalogManifest,
  settingsDemoManifest,
])
```

Esse é o **único lugar** que importa manifests de módulos.
Adicionar um novo módulo é adicionar um item nesse array.

## Resolução de rota

```ts
moduleRegistry.resolveRoute("/m/notes/edit/abc-123")
// ->
{
  moduleId: "notes",
  moduleBasePath: "/m/notes",
  route: { path: "edit/:id", screen: "form", title: "Editar nota" },
  params: { id: "abc-123" },
  Screen: NoteFormScreen,
}
```

O matcher suporta segmentos `:param`. Ele é pequeno (~15 linhas) e vive em
`src/host/registry/module-registry.ts`. Se um dia você quiser algo mais
poderoso (curingas, prioridade), troque aqui — sem afetar os módulos.

## Navegação

`buildNavigation()` percorre os manifests habilitados, expande os
`navigation[]` em `ResolvedNavItem[]` (já com `href` absoluto) e ordena.

Isso é o que o `HostSidebar` renderiza. A sidebar **nunca conhece**
os módulos diretamente.
