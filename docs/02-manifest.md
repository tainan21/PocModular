# Manifest (v3)

O manifest é o **único contrato** entre o host e um módulo. Ele é pequeno de
propósito: descreve identidade, rotas, navegação, dependências, flags e o
que o módulo contribui para o resto do sistema.

## Shape mínimo

```ts
export const myManifest: ModuleManifest = {
  id: "my-module",                 // kebab-case único
  name: "My Module",
  description: "Descrição curta",
  version: "1.0.0",

  status: "experimental",          // "experimental" | "beta" | "stable-like" | "disabled"
  area: "main",                    // "main" | "system"
  icon: "Package",                 // nome Lucide (opcional)
  enabledByDefault: true,

  supportedContexts: ["web"],      // futuro: "desktop" etc.
  dependencies: [],                // ids de outros módulos necessários
  capabilities: ["my:read"],       // só declarativo; sem enforcement

  // (v3) Opcional: URL customizada. Sem isto, o host usa /m/<id>.
  // basePath: "/admin",

  featureFlags: [
    { key: "beta-editor", label: "Editor beta", default: false },
  ],

  routes: [
    { path: "",          screen: "list", label: "Lista" },
    { path: "new",       screen: "form", label: "Novo" },
    { path: "edit/:id",  screen: "form", label: "Editar" },
  ],

  navigation: [
    { label: "My", path: "", icon: "Package", order: 50 },
  ],

  contributions: [
    // opcional — ver seção dedicada
  ],

  screens: {
    list: MyListScreen,
    form: MyFormScreen,
  },

  // (v3) opcional — resolvido por `contributions[].widgetKey`
  widgets: {},
}
```

## Status do manifest

Valores válidos para `status`:

- `"experimental"` — renderiza o banner experimental no topo do módulo
- `"beta"`
- `"stable-like"`
- `"disabled"` — o registry marca o módulo como `effectiveState: "disabled"`

Qualquer outro valor é inválido.

## Regras de validação

Aplicadas automaticamente em `register()`:

- `id` em kebab-case (`^[a-z][a-z0-9-]*$`)
- `name` e `version` obrigatórios
- Pelo menos 1 rota
- Toda `route.screen` precisa existir em `screens`
- Todo `navigation.path` precisa existir em `routes`
- Toda `contributions[].widgetKey` (dashboard-*) precisa existir em `widgets`
- `dependencies` só pode referenciar módulos registrados

Violações disparam `ManifestValidationError` com a lista de problemas.

## Como as rotas viram URLs

Por padrão o host monta: `/m/<module-id>/<route.path>`.

Se o manifest definir `basePath`, o host usa esse valor em vez do prefixo
`/m/<id>`. Exemplos desta POC:

- `control-center` → `basePath: "/admin"` → rotas em `/admin`, `/admin/flags/:moduleId`
- `workspace-home` → `basePath: "/home"` → rota em `/home`

Segmentos `:param` viram entradas no objeto `params` que a tela recebe.

## ScreenComponent

Toda tela é um componente React que recebe:

```ts
type ScreenComponent = ComponentType<{
  params: Record<string, string>
  moduleBasePath: string   // ex: "/m/notes" ou "/admin"
}>
```

Isso dá ao componente tudo o que ele precisa para:

- Ler params dinâmicos (`params.id`, etc).
- Montar links internos sem hardcode (`${moduleBasePath}/new`).

## WidgetComponent (v3)

Widgets contribuídos ao dashboard não recebem props — eles fazem a própria
fetch como RSC async:

```ts
type WidgetComponent = ComponentType<{}>
```

## Contributions (v3)

```ts
type Contribution =
  | { kind: "home-highlight",   title: string, description?: string, to: string }
  | { kind: "quick-action",     key: string, label: string, to: string, tone?: "primary" | "neutral" }
  | { kind: "dashboard-widget", key: string, widgetKey: string, title: string,
      description?: string, size?: "sm" | "md" | "lg", order?: number }
  | { kind: "dashboard-kpi",    key: string, widgetKey: string, label: string, order?: number }
```

`home-highlight` e `quick-action` são da v2. `dashboard-widget` e
`dashboard-kpi` são da v3 e alimentam o `workspace-home`.

## Navegação

Cada módulo expõe **apenas os itens que deseja na navegação global**.
Muitas rotas podem ser "internas" (sem entrada de menu).

A sidebar do host agrega os navigation items de todos os módulos
habilitados, ordenando por `order`.
