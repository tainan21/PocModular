# v3 — Admin, Onboarding e Dashboard componível

A v3 muda **o que a plataforma oferece**, não a filosofia do host. O manifest
continua pequeno, o registry continua puro, o domínio continua sem Next.

Agora temos três peças que antes faltavam:

1. **Control Center** — rota `/admin`, módulo de sistema (`area: "system"`)
2. **Onboarding em 3 passos** — `/onboarding`
3. **Workspace Home** — dashboard componível em `/home`

Tudo plugado via manifest, contribuições e um catálogo persistido por Prisma.

---

## O que existia vs. o que mudou

| Área | v2 | v3 |
|---|---|---|
| Manifest | status, dependencies, featureFlags, contributions, supportedContexts | + `basePath`, + `widgets`, novas kinds de `Contribution` |
| Registry | puro + overrides runtime | + `applyRuntimeContext` (catalog + user selection) |
| Runtime state | `ModulePreference` | + `ModuleCatalogEntry`, `FeatureCatalogEntry`, `UserModuleSelection`, `UserDashboardItem`, `UserOnboardingState`, `DemoUser` |
| Home do host | grid de módulos | redireciona pra `/onboarding` ou `/home` |
| Admin | disperso no `settings-demo` | **rota dedicada** `/admin` + módulo `control-center` |
| Dashboard usuário | não existia | `workspace-home` em `/home` |
| Distinção entre "no código / no catálogo / escolhido pelo usuário / exibido no dashboard" | tudo num `enabled` | três estados **separados** e persistidos |

---

## Novos modelos (Prisma)

- `DemoUser` — usuário mock único, criado no seed
- `UserOnboardingState` — step atual, intent, `completed`
- `ModuleCatalogEntry` — `pricingModel`, `priceCents`, `globallyEnabled`, `visibleInOnboarding`, `visibleInDashboard`, `featureFlagged`, `displayOrder`
- `FeatureCatalogEntry` — por feature (flag): label, default, priceCents, adminEditable
- `UserModuleSelection` — o usuário escolheu este módulo?
- `UserDashboardItem` — qual contribuição (kind + key) do usuário está pinada, ordem e visibilidade

`ModulePreference` foi mantido para **feature flags runtime** (valor corrente
por módulo), que já existia na v2.

---

## Contracts v3

- `ModuleManifest.basePath?: string` — módulos de sistema ganham URL amigável
  (ex.: `/admin`, `/home`). Sem isto, vale a convenção `/m/<id>`.
- `ModuleManifest.widgets?: Record<string, WidgetComponent>` — resolução dos
  widgets declarados em `contributions`.
- `WidgetComponent` — `React.ComponentType<{}>` (sem props). Widgets fazem
  a própria fetch como RSC async.
- `Contribution`:
  - `dashboard-widget` — `{ key, widgetKey, title, description?, size?, order? }`
  - `dashboard-kpi` — `{ key, widgetKey, label, order? }`
- `ModuleRuntimeInfo` ganhou `catalog`, `userSelected` e `effectiveState`:
  `"available" | "disabled" | "user-opt-out" | "blocked-by-dependency" | "blocked-by-context"`.

---

## Domínios puros novos

```
domains/
  platform-catalog/
    domain/module-catalog-entry.ts
    domain/feature-catalog-entry.ts
    application/catalog-derivation.ts   <- effective state
  dashboard/
    application/dashboard-composition.ts <- compõe o dashboard do usuário
  onboarding/
    application/onboarding-rules.ts      <- step math, intent -> sugestão
```

Todos **sem** Next, Prisma ou React. São o núcleo portável.

---

## Runtime (I/O) em `src/host/runtime/`

Cada arquivo faz **uma** fonte de dados:

- `demo-user.ts` — singleton da POC (id = `DEMO_USER_ID`)
- `catalog-state.ts` — CRUD de `ModuleCatalogEntry` / `FeatureCatalogEntry`
- `selection-state.ts` — `UserModuleSelection`
- `dashboard-state.ts` — `UserDashboardItem`
- `onboarding-state.ts` — `UserOnboardingState`
- `module-state.ts` — **legado** `ModulePreference` (feature flags runtime)
- `runtime-info.ts` — **funções puras** de derivação (reutilizadas pelo domínio)
- `registry-view.ts` — **orquestra**: lê tudo, chama `applyRuntimeContext`
- `render-module-route.tsx` — helper que o `/m/*`, `/admin/*` e `/home/*` usam

---

## Módulo `control-center`

```
src/modules/control-center/
  manifest.ts          # id: "control-center", area: "system", basePath: "/admin"
  application/
    queries.ts         # listAdminModules, listModuleFlags, ...
    actions.ts         # enable/disable, togglePricing, setFeatureFlag, ...
  presentation/
    screens/
      control-center-screen.tsx         # /admin
      control-center-flags-screen.tsx   # /admin/flags/:moduleId
```

É um módulo **como qualquer outro**: não tem rota Next "privilegiada", só tem
`basePath: "/admin"`. O host descobre via manifest.

O admin consegue:

- habilitar/desabilitar módulo **globalmente** (via `ModuleCatalogEntry.globallyEnabled`)
- mudar **pricingModel** (`free | paid | internal` — apenas hint, sem billing real)
- controlar **visibleInOnboarding** / **visibleInDashboard**
- ligar/desligar **feature flags** declaradas pelo manifest do módulo

---

## Onboarding em 3 passos (`/onboarding`)

- **1** — intent (pessoal / time / operação / exploração)
- **2** — escolher apps (usa `ModuleCatalogEntry.visibleInOnboarding`)
- **3** — montar dashboard (pin + ordem dos widgets disponíveis)

Ao terminar: `UserOnboardingState.completed = true` e redirect para `/home`.

As páginas só conhecem **actions** (server actions) + shells visuais do
`@poc/module-ui`. As regras (step math, intent → sugestões) ficam no domínio
puro `domains/onboarding`.

---

## Workspace Home (`/home`)

Módulo `workspace-home`, `basePath: "/home"`. Monta o dashboard do usuário:

```
DashboardHero
  saudação + intent escolhida no onboarding

KpiRow
  [dashboard-kpi de cada módulo escolhido]

DashboardGrid
  [dashboard-widget de cada módulo escolhido]
```

A composição vive em `domains/dashboard/application/dashboard-composition.ts`
e casa:

- `ModuleManifest.contributions` (dashboard-widget / dashboard-kpi)
- `UserDashboardItem` (ordem/visibilidade por usuário)
- `ModuleRuntimeInfo` (só widgets de módulos `available`)

O host resolve o widget via `manifest.widgets[widgetKey]` e renderiza.

---

## Visual isolado em `@poc/module-ui`

Cresceu com:

- `ModuleCard` — card para admin/onboarding/home
- `PricingBadge` — `free | paid | internal | experimental`
- `OnboardingStepShell` / `OnboardingChoiceCard` / `OnboardingProgress`
- `DashboardHero` / `KpiValue` / `DashboardWidgetCard` / `DashboardGrid`
- `AdminSection` / `AdminRow` / `AdminEmptyState`
- `LoadingPanel`

Todos:

- **sem** Prisma
- **sem** Next (`use client` só quando realmente preciso)
- **sem** import de domínios (só tokens visuais)

---

## Fluxo cross-module novo

```
onboarding ─┐
            ├─> UserOnboardingState
            └─> UserModuleSelection, UserDashboardItem
                              │
                              v
                        registry-view
                      (applyRuntimeContext)
                              │
                              v
                        /home (workspace-home)
                              │
                              v
                        contributions -> widgets[widgetKey]
```

Sem acoplamento direto entre módulos. Quem fala com quem fala por `public-api`
ou por contribuição declarada no manifest.

---

## O que continua sendo a prova honesta

1. **Manifest v3 ainda é um objeto TS**. Nada de bundler mágico ou plugin.
2. **Registry puro**. `ModuleRegistry` não toca em Prisma.
3. **Funções puras** em `runtime-info.ts` são testadas em `scripts/smoke-domains.mjs`.
4. **Domínio puro** (`domains/*`) continua portável.
5. Só a camada `src/host/runtime/*-state.ts` e os `presentation/screens/*` é
   que conhecem Prisma/Next. Troca de framework = troca dessa casca.

---

## O que deliberadamente NÃO foi feito

- **Billing real** — `pricingModel` e `priceCents` são hints.
- **Auth real** — existe um `DemoUser` singleton.
- **Multi-tenant** — a POC fica em 1 usuário.
- **RBAC fino** — capabilities são declarativas e ninguém ainda checa.
- **Drag-and-drop no dashboard** — ordem é editada via admin/onboarding.
- **Segundo host Tauri** — `supportedContexts` e contratos já estão prontos,
  mas o host desktop não foi construído.
