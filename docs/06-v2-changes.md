# POC v2 — o que mudou e por quê

A v2 sobe o nível mantendo a filosofia da v1: **pequena, didática, honesta, exportável**.
Este documento é um diff arquitetural comentado.

---

## 1. Manifest evoluído

`src/host/core/contracts/manifest.ts`

Campos novos:

| campo | o que é | por quê |
| --- | --- | --- |
| `status` | `active` · `experimental` · `hidden` · `disabled` | Estado declarado pelo código. O registry combina com o override persistido pelo usuário. |
| `dependencies` | `string[]` de ids | Permite que o registry bloqueie um módulo se sua dependência estiver indisponível. |
| `featureFlags` | `{ key, label, description?, default }[]` | Flags declaradas pelo próprio módulo. A tela de Settings é **dirigida pelo manifest** (renderiza uma linha por flag automaticamente). |
| `contributions` | `{ kind, title, description, to }[]` | O módulo contribui para a home do host. A home não conhece os módulos: itera contribuições pelo tipo. |
| `supportedContexts` | `"web" · "desktop" · "hub" · "space"` | Prepara múltiplos hosts. No futuro, um host Tauri só carrega módulos com `"desktop"`. |

Todos os campos novos são **opcionais** ou têm **default claro** — nenhum módulo da v1 precisaria ser reescrito para "caber" na v2.

---

## 2. Registry evoluído

`src/host/registry/module-registry.ts` — **síncrono, puro, sem I/O**.
`src/host/runtime/module-state.ts` — camada **com I/O** que fala com Prisma.
`src/host/runtime/runtime-info.ts` — funções **puras** para derivar estado (testáveis sem banco).
`src/host/runtime/registry-view.ts` — helper que Server Components usam para "ler o registry com estado real".

Novas responsabilidades:

- **Persistência de enable/disable** em `ModulePreference` + override aplicado por request.
- **Breadcrumbs** derivados do `RouteMatch` + manifest (`src/host/runtime/breadcrumbs.ts`).
- **Validação estrutural** (`validate()`), emitindo `RegistryIssue[]`:
  - `duplicate-id`, `duplicate-base-path`, `duplicate-route`
  - `unknown-dependency`, `dependency-disabled`
- **Validação de manifest** agora checa `featureFlags.key` único/kebab-case e exige `supportedContexts` não-vazio.

### Redução do acoplamento manual

O host **não importa mais módulos um-a-um**.
Só importa a lista canônica em `src/modules/all-manifests.ts`.

Plugar um novo módulo vira:

1. Criar `src/modules/<id>/manifest.ts`
2. Adicionar o import em `all-manifests.ts`

É o mínimo legível. Não caiu em "auto-discovery mágico" (que atrapalha build e bundler). É uma convenção previsível e trivial de manter.

---

## 3. Host com UX estrutural

- `app/(host)/m/[...slug]/loading.tsx` — boundary de carregamento por módulo
- `src/host/layouts/host-breadcrumbs.tsx` — breadcrumb global
- `src/host/layouts/disabled-module-screen.tsx` — fallback elegante quando o módulo está desabilitado/bloqueado por dependência
- `src/host/layouts/experimental-banner.tsx` — banner para módulos `experimental`
- Sidebar e home leem **o estado runtime real** (`describeAll()`), não os manifests crus.

---

## 4. Interação entre módulos

Dois fluxos cruzados foram implementados sem event bus nem abstrações pesadas — apenas uma **API pública por módulo** (`public-api.ts`):

### Fluxo A — Notes → Tasks

- A tela de edição de uma nota mostra um botão **"Promover a tarefa"**.
- Ele chama `tasksApi.createTaskFromExternal({ title, sourceNoteId })`.
- A task nasce com `sourceNoteId` persistido.
- Na **lista de Notes**, notas com task associada mostram um badge com o status atual da task (consulta via `tasksApi.getTaskBySourceNote`).
- No **board de Tasks**, tasks originadas de notas recebem um badge `via Notes`.

Onde cada ponta vive:

| camada | arquivo |
| --- | --- |
| origem (UI + server action) | `src/modules/notes/presentation/screens/note-form-screen.tsx`, `src/modules/notes/application/actions.ts` |
| ponte pública exposta | `src/modules/tasks/public-api.ts` |
| consumo oposto | `src/modules/notes/presentation/screens/notes-list-screen.tsx`, `src/modules/tasks/presentation/screens/tasks-board-screen.tsx` |

Regra: **Notes não conhece o schema nem a entidade Task**. Só depende do `public-api.ts`.

### Fluxo B — Settings → Tasks

O módulo Tasks declara no manifest a flag `mostrar-concluidas` (default `true`).
Na tela de Settings, essa flag aparece automaticamente (o form é dirigido pelo manifest).
Ao desligar, o board de Tasks esconde a coluna "Concluído".

O board lê via `settingsApi.getFeatureFlag("tasks", "mostrar-concluidas", true)` — também uma API pública do módulo Settings Demo.

---

## 5. Portabilidade: repositório em memória

`src/modules/notes/infra/memory-notes-repository.ts`
`src/modules/notes/infra/repository-factory.ts`

Fluxo:

- O mesmo `NotesRepository` (contrato do domínio) tem **duas implementações**: `PrismaNotesRepository` e `MemoryNotesRepository`.
- A fábrica `getNotesRepository()` escolhe baseada na flag `notes.usa-memory-repo` (Settings).
- **Application, domínio e UI não mudam**. Trocar infra = ligar a flag.

Isso prova concretamente a afirmação da v1: o domínio é agnóstico de infraestrutura.

---

## 6. Package mínimo: `@poc/module-ui`

Workspace pnpm (`pnpm-workspace.yaml` + `packages/module-ui/`).

Componentes extraídos:
- `PageShell` — casca padrão de cada screen (antes duplicado em `src/shared/ui`)
- `EmptyState`
- `StatusBadge` — aceita `status` (do módulo) ou `tone + children`
- `Card` leve

O package:
- usa apenas **tokens do design system** (nada de cor hardcoded).
- não conhece domínio nenhum.
- é consumido pelos módulos via `import { PageShell } from "@poc/module-ui"`.

Intencionalmente **pequeno**. Prova a direção sem transformar metade do código em packages.

---

## 7. O que esta v2 prova arquiteturalmente

1. **Manifest como centro real da integração** — o host renderiza Settings, Home e navegação sem conhecer os módulos um-a-um.
2. **Registry com estado persistido** — enable/disable do usuário bate na UI instantaneamente via `revalidatePath("/", "layout")`.
3. **Dependências entre módulos** — o registry bloqueia cascatas inconsistentes e sinaliza via `effectiveState`.
4. **Separação pura/impura** — `runtime-info.ts` é 100% puro; só `module-state.ts` toca Prisma. Isso é pronto para teste unitário sem infra.
5. **Conversa cross-módulo honesta** — via `public-api.ts`, sem event bus, sem acoplar entidades/schemas.
6. **Domínio portável, comprovado** — troca de infra só pela factory/flag.
7. **Package mínimo viável** — extração que provou valor sem inflar a estrutura.

---

## 8. O que fica para uma v3

- Testes unitários nas funções puras (`runtime-info`, `breadcrumbs`, `resolveRoute`).
- Cache / memoização por request no `getRegistryView` (snapshot imutável).
- Mover `domains/*`, `host/core/contracts`, `module-ui` para `packages/*` quando existirem múltiplos apps consumindo.
- Um segundo app (`apps/tauri` ou `apps/desktop`) filtrando módulos por `supportedContexts`.
- Tipar as `contributions` por `kind` com discriminated union real (hoje é um tipo aberto para manter liberdade pedagógica).
- Auth/RBAC real para `capabilities` (hoje só placeholder).
- Migrations versionadas (hoje usamos `db push` por ser POC).
