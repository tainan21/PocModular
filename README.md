# POC — Host + Manifest + Registry + Platform API + DDD (pragmático)

POC didática de uma arquitetura plugável: um **host Next.js** carrega **apps/módulos** via
**manifesto + registry**, expõe todo o estado da plataforma atrás de uma **Platform API
versionada**, e mantém os domínios **independentes de framework**.

O objetivo não é ter muitas features — é provar, com clareza, como compor um sistema deste
tipo e como ele pode evoluir depois para **packages compartilhados, admin separado em outro
repo, e domínios portáveis** (ex.: Tauri), sem reescrita.

## O que a v5 adicionou

- **Paginação + filtros** em todos os listers da Platform API. `listModules()` agora
  retorna `Page<T> = { items, meta }`. Consumidores v4 precisam migrar para `.items`.
- **Zod schemas** na borda HTTP (`@poc/platform-contracts/schemas`), com `readJson` /
  `readQuery` validando payloads antes de chegar no service.
- **RBAC-lite** via header `X-Platform-Actor`. `guest`, `user:<id>`, `admin:<id>`.
  Endpoints admin ficam protegidos com `requirePolicy(actor, "admin")` (401 para guest,
  403 para user). O smoke cobre os três cenários.
- **Auto-fallback de store**: se `PLATFORM_STORE=prisma` e o Prisma falhar ao conectar
  (ex.: sem `DATABASE_URL`, sem arquivo SQLite), o sistema loga o erro, faz fallback para
  `MemoryPlatformStore` e marca `HealthDTO.degraded = true`. O launcher nunca mais
  quebra por problema de bootstrap de banco.
- **`/admin-preview`** — página que consome a Platform API **via HTTP** (não in-process).
  É a prova de que um admin em outro app/repo funcionaria hoje.
- **Autoloader Node-only** (`src/modules/autoload.ts`) para descobrir manifests via `fs`.
  Usado por smokes e CLIs. Em Next/Turbopack continue usando `all-manifests.ts`.
- **Novos smokes**: `smoke-autoload.mjs` (equivalência static ↔ dynamic) + smoke da
  Platform API expandido com paginação, Zod, RBAC, degraded health.

Diff arquitetural comentado: [`docs/10-v5-changes.md`](docs/10-v5-changes.md).

## O que a v4 adicionou

- **Platform API versionada** (`/api/platform/*`) — superfície HTTP única para módulos,
  features, catálogo, runtime, rotas, onboarding, dashboard e ações de admin. Consumível de
  qualquer lugar: do host atual, de um admin separado, de uma CLI.
- **Contratos públicos em `@poc/platform-contracts`** — DTOs e enums, zero runtime, zero
  dependência de app. É o que um admin em outro repo instala.
- **Cliente `@poc/platform-client`** dual-mode: `httpPlatformClient({ baseUrl })` para
  consumidores remotos e `createLocalPlatformClient()` para in-process (mesmo contrato).
- **Launcher em `/`** — tela inicial agora lista rotas da plataforma (apps, admin,
  onboarding, debug) + health, consumindo a Platform API como um outsider faria.
- **`/debug/platform`** — prova viva de que tudo funciona: lista endpoints, contagens,
  `health.store`, `health.services`, exemplo de consumo.
- **Control Center mais forte** — quatro seções (Apps, Módulos, Features, Rotas), cada
  módulo com meta-panel, tabela de features, flags reais com `current`.
- **Storage strategy** — `PlatformStateStore` como porta; `PrismaPlatformStore` (default)
  e `MemoryPlatformStore` (smoke / demo offline). Escolhido por `PLATFORM_STORE=memory|prisma`.
- **Smoke `scripts/smoke-platform.mjs`** — percorre a Platform API end-to-end em memória.

Diff arquitetural comentado: [`docs/08-platform-api.md`](docs/08-platform-api.md).

## O que a v3 adicionou

- **Control Center** (`/admin`) — módulo de sistema (`area: "system"`) que controla o catálogo, pricing hint, flags e visibilidade
- **Onboarding em 3 passos** (`/onboarding`) — intent, seleção de apps, composição do dashboard inicial
- **Workspace Home** (`/home`) — dashboard componível por `dashboard-widget` e `dashboard-kpi`
- **Catálogo persistido** — `ModuleCatalogEntry`, `FeatureCatalogEntry`, `UserModuleSelection`, `UserDashboardItem`, `UserOnboardingState`, `DemoUser`
- **Manifest ganhou** `basePath`, `widgets`, e novas kinds de `Contribution`
- **Runtime info enriquecido** — distingue `available | disabled | user-opt-out | blocked-by-dependency | blocked-by-context`
- **Domínios puros novos** — `platform-catalog`, `dashboard`, `onboarding`
- **@poc/module-ui cresceu** — `ModuleCard`, `PricingBadge`, shells de onboarding/dashboard/admin
- **Testes puros** rodando via `pnpm test` (smoke dos domínios + runtime-info)

Diff arquitetural comentado: [`docs/07-v3-changes.md`](docs/07-v3-changes.md).

## O que a v2 já tinha

- Manifest com `status`, `dependencies`, `featureFlags`, `contributions`, `supportedContexts`
- Registry com estado persistido e validação estrutural
- Host com breadcrumbs, loading, fallback de módulo desabilitado e banner de experimental
- Conversa entre módulos via `public-api.ts`
- Repositório em memória selecionável via feature flag
- Package interno `@poc/module-ui`

Detalhes em [`docs/06-v2-changes.md`](docs/06-v2-changes.md).

## Stack

- Next.js 16 (App Router, RSC, Server Actions)
- TypeScript
- Prisma + SQLite (dev-friendly, zero-setup)
- Tailwind v4 + shadcn/ui
- pnpm workspaces (packages/module-ui)

## Começando

```bash
pnpm install
pnpm db:push      # cria o banco SQLite
pnpm db:seed      # popula o catálogo
pnpm dev
```

Scripts úteis:

```bash
pnpm db:generate  # regenera o Prisma Client
pnpm db:reset     # força reset + seed
pnpm build
```

## Módulos incluídos

| Módulo            | Área   | basePath        | Prova                                                              |
| ----------------- | ------ | --------------- | ------------------------------------------------------------------ |
| `notes`           | main   | `/m/notes`      | CRUD + Prisma **ou** memória via flag + widgets de dashboard       |
| `tasks`           | main   | `/m/tasks`      | Regra de domínio + flag controlada por Settings + KPI/widget       |
| `catalog`         | main   | `/m/catalog`    | Leitura estruturada + widget de destaques                          |
| `settings-demo`   | main   | `/m/settings-demo` | Preferências por módulo, **dirigidas pelo manifest**           |
| `control-center`  | system | `/admin`        | Admin do catálogo, pricing hint, flags, visibilidade               |
| `workspace-home`  | system | `/home`         | Dashboard do usuário composto via `contributions` + `widgets`      |

Todos os 6 são **módulos de primeira classe**: aparecem dinamicamente a partir
de `src/modules/all-manifests.ts`. O host só conhece o **manifest**; as rotas
`/admin` e `/home` são apenas `basePath` customizados.

## Estrutura

```
app/
  (host)/              # grupo do host: launcher + onboarding + admin + home + /m
    page.tsx           # launcher — lê a Platform API
    debug/platform/    # página de debug/prova da Platform API
    onboarding/        # steps 1→2→3 (server actions, via platform-client)
    m/[...slug]/       # catch-all dos módulos de main/system
  api/platform/        # Platform API — route handlers HTTP
    modules/           # GET + GET /[id]
    features/
    catalog/
    runtime/
    routes/
    dashboard/
    onboarding/        # GET + POST intent/selection/finish
    admin/             # POST catalog, POST flag, POST reset-onboarding
    health/

src/
  host/                # casca da plataforma (conhece só manifests + registry)
    core/contracts/    # Manifest, Route, Navigation, Capability, Registry, Contribution
    registry/          # registry síncrono e puro + validador de manifest
    runtime/           # camada com I/O: module-state, runtime-info, registry-view, …
    layouts/, navigation/
  modules/             # apps plugáveis (1 pasta por módulo)
    notes/, tasks/, catalog/, settings-demo/
    control-center/    # área: system, basePath: /admin
    workspace-home/    # área: system, basePath: /home
    all-manifests.ts
  server/
    db/                # Prisma singleton
    platform/          # Platform API — server side
      services/        # platform-service, onboarding, dashboard, admin
      serializers/     # manifest → DTO
      storage/         # port (store.ts) + prisma-store + memory-store
      http.ts          # helpers JSON + error mapping
      client.ts        # getPlatformClient() — alterna local/http por env

packages/
  platform-contracts/  # @poc/platform-contracts — DTOs públicos, zero deps
  platform-client/     # @poc/platform-client — httpPlatformClient + tipos
  module-ui/           # @poc/module-ui — visual reutilizável
  tokens/              # @poc/tokens — tokens de design em TS + CSS

domains/               # domínios PUROS (zero acoplamento a framework)
  notes/, tasks/, catalog/
  platform-catalog/, dashboard/, onboarding/

prisma/                # schema + seed + migrations
scripts/               # smoke-domains, smoke-platform, seed, ...
```

## Documentação

- `docs/01-architecture.md` — visão da arquitetura e decisões
- `docs/02-manifest.md` — o contrato do manifest
- `docs/03-registry.md` — como o registry funciona
- `docs/04-add-module.md` — como adicionar um novo módulo (v3+)
- `docs/05-evolution.md` — como evoluir para packages / admin separado / Tauri
- `docs/06-v2-changes.md` — diff arquitetural da v2
- `docs/07-v3-changes.md` — diff arquitetural da v3 (admin, onboarding, dashboard)
- `docs/08-platform-api.md` — Platform API v4 (contratos, endpoints, dual-mode client)
- `docs/09-v4-changes.md` — diff arquitetural da v4
- **`docs/10-v5-changes.md` — diff arquitetural da v5 (zod, RBAC, paginação, auto-fallback)**

## Setup rápido

```bash
pnpm install
pnpm db:push       # cria o SQLite e aplica o schema
pnpm db:seed       # semeia catálogo + features
pnpm dev
```

Se preferir rodar sem banco:

```bash
PLATFORM_STORE=memory pnpm dev
```

Se `PLATFORM_STORE=prisma` e o banco não responder, a POC faz **fallback
automático para memória** e sinaliza `health.degraded = true`. Nunca vai
quebrar o launcher por bootstrap de DB.

## Testes

```bash
pnpm test              # domains + platform + autoload
pnpm test:domains      # domínios puros
pnpm test:platform     # Platform API ponta-a-ponta (in-memory, zero DB)
pnpm test:autoload     # equivalência entre all-manifests.ts e o autoloader de fs
pnpm typecheck
pnpm build
```

## Limitações honestas

- Registry é in-memory (lista estática + overrides do banco por request).
- Capabilities são apenas declarativas (sem enforcement).
- RBAC é **simbólico**: parseia `X-Platform-Actor` e aplica `guest/user/admin`.
  Não há validação de claim, sessão, token. O admin real pluga nesse mesmo ponto
  sem mudar o contrato.
- Não há multi-tenant (há um `demo-user` fixo).
- SQLite é proposital para a POC. Em produção, troque o provider no schema.
- O admin ainda mora neste host por conveniência. `/admin-preview` já prova
  que ele poderia ser um app separado consumindo só a Platform API via HTTP.

São coisas deliberadas: a POC quer clareza, não recursos.
#   P o c M o d u l a r  
 