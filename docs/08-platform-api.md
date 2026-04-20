# 08 — Platform API (v4)

A **Platform API** é a superfície pública da plataforma. Tudo que um
admin futuro em outro app (ou outro repositório) vai precisar para
operar o sistema passa por ela. Hoje ela vive no mesmo processo do
host; amanhã, em outro deployment, **sem mudar uma linha dos consumers**.

## Decisões

1. **DTOs em um package isolado.** `@poc/platform-contracts` não depende
   de Prisma, Next, domínios, domínios puros, nada. É a fronteira.
2. **Storage port.** `PlatformStateStore` define as 14 operações que a
   plataforma precisa. Existe `PrismaPlatformStore` (default) e
   `MemoryPlatformStore` (smoke / demo offline).
3. **Services puros por recurso.** `platform-service`, `admin-service`,
   `onboarding-service`, `dashboard-service`. Sem redirect, sem
   revalidate, sem Next — quem orquestra UX é o route handler ou a
   server action.
4. **Route handlers finos.** Cada arquivo em `app/api/platform/**/route.ts`
   só converte Request ↔ Response e delega ao service.
5. **Client dual-mode.** `@poc/platform-client` expõe `PlatformClient`
   com duas impls: `httpPlatformClient({ baseUrl })` (outro repo) e o
   local client (`createLocalPlatformClient()`, in-process, zero HTTP).
   Mesmo contrato, mesmos DTOs.

## Estrutura

```
packages/
  platform-contracts/src/
    index.ts          # todos os DTOs
    endpoints.ts      # constantes de rotas (único lugar que as conhece)
    errors.ts         # PlatformError
  platform-client/src/
    client.ts         # interface PlatformClient
    http-client.ts    # impl HTTP (fetch + endpoints)
    index.ts

src/server/platform/
  index.ts            # barrel
  client.ts           # getPlatformClient() — local hoje, http amanhã
  local-client.ts     # impl in-process do contrato
  http.ts             # helpers json/error p/ route handlers
  storage/
    store.ts          # porta PlatformStateStore
    memory-store.ts   # impl in-memory (testes, demo)
    prisma-store.ts   # impl Prisma (default)
    index.ts          # factory async (lazy import do prisma-store)
  serializers/
    manifest-serializer.ts
  services/
    platform-service.ts   # modules / catalog / features / runtime / routes / health
    admin-service.ts      # saveCatalog / setFlag
    onboarding-service.ts # get / setIntent / setSelection / finish / reset
    dashboard-service.ts  # getDashboard

app/api/platform/
  health/route.ts
  modules/route.ts
  modules/[id]/route.ts
  features/route.ts
  catalog/route.ts
  runtime/route.ts
  routes/route.ts
  dashboard/route.ts
  onboarding/route.ts
  onboarding/intent/route.ts
  onboarding/selection/route.ts
  onboarding/finish/route.ts
  admin/catalog/route.ts
  admin/flag/route.ts
  admin/reset-onboarding/route.ts
```

## Endpoints

| Método | Rota                                      | Serve para                          |
| ------ | ----------------------------------------- | ----------------------------------- |
| GET    | `/api/platform/health`                    | Sanidade + versão + store ativo     |
| GET    | `/api/platform/modules`                   | Lista de módulos serializados       |
| GET    | `/api/platform/modules/:id`               | Detalhe de módulo + flags atuais    |
| GET    | `/api/platform/features`                  | Catálogo de features                |
| GET    | `/api/platform/catalog`                   | Entradas do catálogo (pricing etc.) |
| GET    | `/api/platform/runtime`                   | `effectiveState` por módulo         |
| GET    | `/api/platform/routes`                    | Navegação computada pelo registry   |
| GET    | `/api/platform/dashboard`                 | Dashboard do demo user              |
| GET    | `/api/platform/onboarding`                | Snapshot + módulos disponíveis      |
| POST   | `/api/platform/onboarding/intent`         | Passo 1                             |
| POST   | `/api/platform/onboarding/selection`      | Passo 2                             |
| POST   | `/api/platform/onboarding/finish`         | Passo 3 (materializa dashboard)     |
| POST   | `/api/platform/admin/catalog`             | Upsert de entrada do catálogo       |
| POST   | `/api/platform/admin/flag`                | Override de feature flag            |
| POST   | `/api/platform/admin/reset-onboarding`    | Zera onboarding do demo user        |

Todos os rotas usam `@server/platform/http.ts` para:

- converter erros em `{ error, message, details }` com status HTTP adequado
- padronizar `Content-Type: application/json`
- padronizar headers de cache (no-store)

## Dual-mode no mesmo repo

```ts
// src/server/platform/client.ts (simplificado)
export function getPlatformClient(): PlatformClient {
  const baseUrl = process.env.POC_PLATFORM_API_URL
  if (baseUrl) return httpPlatformClient({ baseUrl })
  return getLocalPlatformClient()
}
```

Launcher (`/`), Control Center (`/admin`), onboarding e debug **nunca
importam service algum**. Importam `getPlatformClient()` e pronto. Se
o admin virar app separado amanhã, ele só precisa:

```ts
import { httpPlatformClient } from "@poc/platform-client"
const platform = httpPlatformClient({ baseUrl: process.env.POC_PLATFORM_API_URL })
```

...para consumir a mesma API, com os mesmos DTOs.

## Smoke

```bash
pnpm test:platform    # só a Platform API (store=memory, sem DB)
pnpm test             # smoke domínios + smoke Platform API
```

O smoke da Platform API (`scripts/smoke-platform.mjs`) atravessa:

1. `health` (valida `store: "memory"`, `platformVersion`, services)
2. `listModules` + `getModule` + `listRuntime`
3. `listCatalog` + `listRoutes`
4. fluxo completo de onboarding (reset → intent → selection → finish)
5. `getDashboard` (checa `generatedAt` e contagem de widgets)
6. admin `setFlag` (e valida reflexo em `getModule().featureFlags[].current`)
7. admin `saveCatalog` (valida persistência)
8. `resetOnboarding` (valida limpeza de seleção)

## O que NÃO existe (por design)

- Billing real. `pricingModel` / `priceCents` são hints.
- Auth / RBAC. Endpoints são abertos; o `DemoUser` é singleton.
- Rate limiting.
- Versionamento por rota. Está na casca via `platformVersion` no `/health`.
- Webhooks / eventos externos.

Tudo isso vai para v5+ sem alterar os contratos já publicados.
