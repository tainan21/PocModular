# Como adicionar um novo módulo (v3)

Este guia está **alinhado com a v3**. Ele substitui o fluxo antigo que pedia
registro em `src/host/registry/index.ts` — isso foi removido.

---

## 1. Domínio puro (se o módulo tem regras próprias)

Em `domains/<id>/`:

```
domains/invoices/
  domain/invoice.ts             # entidade pura
  application/
    invoices-repository.ts      # interface
    use-cases.ts                # create, list, ...
  index.ts
```

O domínio **não importa** Next, React nem Prisma.

---

## 2. Tabelas (se precisa persistir)

Edite `prisma/schema.prisma`, depois:

```bash
pnpm db:push
pnpm db:generate
```

Em dev é comum usar `pnpm db:reset` (reset + seed).

---

## 3. Estrutura do módulo

```
src/modules/invoices/
  manifest.ts
  index.ts                      # re-export do manifest
  application/
    queries.ts                  # "server-only", chama o domínio
    actions.ts                  # "use server", server actions
  infra/
    prisma-invoices-repository.ts
    repository-factory.ts       # (opcional) alterna impl via feature flag
  presentation/
    screens/*.tsx
    widgets/*.tsx               # (opcional) dashboard-widget / dashboard-kpi
  public-api.ts                 # (opcional) contrato p/ outros módulos
```

---

## 4. Manifest v3

```ts
import type { ModuleManifest } from "@host/core/contracts"
import { InvoicesListScreen } from "./presentation/screens/invoices-list-screen"
import { InvoiceFormScreen } from "./presentation/screens/invoice-form-screen"

export const invoicesManifest: ModuleManifest = {
  id: "invoices",
  name: "Invoices",
  description: "Gerenciamento de faturas.",
  version: "1.0.0",

  // "experimental" | "beta" | "stable-like" | "disabled"
  status: "beta",

  // "main" aparece na sidebar/onboarding; "system" é módulo interno.
  area: "main",

  icon: "Receipt",
  enabledByDefault: true,

  supportedContexts: ["web"],
  dependencies: [],

  capabilities: ["invoices:read", "invoices:write"],

  featureFlags: [
    { key: "pdf-export", label: "Exportar PDF", default: false },
  ],

  // Opcional: basePath customizado (ex.: "/admin" ou "/home").
  // Sem isso, o host usa a convenção /m/<id>.
  // basePath: "/invoices",

  routes: [
    { path: "",          screen: "list",  label: "Invoices" },
    { path: "new",       screen: "form",  label: "Nova fatura" },
    { path: "edit/:id",  screen: "form",  label: "Editar" },
  ],

  navigation: [
    { label: "Invoices", path: "", icon: "Receipt", order: 40 },
  ],

  contributions: [
    { kind: "home-highlight", title: "Nova fatura", to: "new" },
    { kind: "quick-action",   key: "new-invoice", label: "Nova fatura", to: "new" },

    // v3: contribui para o dashboard do usuário.
    {
      kind: "dashboard-kpi",
      key: "open-invoices",
      label: "Faturas em aberto",
      widgetKey: "openInvoicesKpi",
      order: 20,
    },
    {
      kind: "dashboard-widget",
      key: "recent-invoices",
      title: "Faturas recentes",
      widgetKey: "recentInvoices",
      size: "md",
      order: 40,
    },
  ],

  screens: {
    list: InvoicesListScreen,
    form: InvoiceFormScreen,
  },

  // v3: widgets resolvidos pela chave declarada em `contributions[].widgetKey`.
  widgets: {
    openInvoicesKpi: OpenInvoicesKpi,
    recentInvoices: RecentInvoicesWidget,
  },
}
```

Regras:

- `status` é **"experimental" | "beta" | "stable-like" | "disabled"** — **nunca** `"stable"`.
- Cada `route.screen` precisa existir em `screens`.
- Cada `dashboard-*.widgetKey` precisa existir em `widgets`.

---

## 5. Registre no agregador

**Único** lugar: `src/modules/all-manifests.ts`.

```ts
import { invoicesManifest } from "./invoices/manifest"

export const ALL_MANIFESTS: ModuleManifest[] = [
  // existentes...
  invoicesManifest,
]
```

Não registre em `src/host/registry/index.ts` — essa era a v1 e não existe mais.

---

## 6. Cross-module (quando um módulo fala com outro)

Use `public-api.ts`:

```ts
// src/modules/tasks/public-api.ts
export const tasksApi = {
  async createFromNote(note) { /* ... */ },
  async getTaskBySourceNote(noteId) { /* ... */ },
}
```

Quem consome importa **só o contrato**, nunca Prisma ou entidades internas
do outro módulo.

---

## 7. Dashboard (v3)

Widgets são **server components sem props** — fazem a própria fetch.

```tsx
// src/modules/invoices/presentation/widgets/invoices-widgets.tsx
export async function OpenInvoicesKpi() {
  const count = await countOpenInvoices()
  return <KpiValue value={count} label="em aberto" />
}
```

O `workspace-home` descobre automaticamente via `contributions`. O Control
Center (`/admin`) controla se o módulo aparece no onboarding/dashboard.

---

## 8. Checklist

- [ ] Domínio em `domains/` sem imports de framework
- [ ] Repositório concreto em `src/modules/<id>/infra/` implementa a interface do domínio
- [ ] Screens usam queries/actions — nunca chamam Prisma diretamente
- [ ] Manifest referencia todas as screens em `routes`
- [ ] Manifest referencia todos os widgetKey usados em `contributions`
- [ ] Registrado **apenas** em `src/modules/all-manifests.ts`
- [ ] `pnpm typecheck` e `pnpm test` passam
