# v5 — Endurecendo a Platform API

A v4 trouxe a Platform API como fachada. A v5 transforma essa fachada em uma
superfície de verdade, pronta para ser consumida por outro app, outro repo ou
outra engine (CLI, desktop, mobile).

O vetor é sempre o mesmo: **tudo que é valor arquitetural vai para o contrato,
não para o caller**.

## 1) Resiliência de bootstrap (store auto-fallback)

O erro mais sintomático da v4 — "URL must start with file:" na primeira query
Prisma — vinha de um pressuposto frágil: **"Prisma sempre funciona em runtime"**.
Removi esse pressuposto.

O novo `getPlatformStore()` em `src/server/platform/storage/index.ts`:

- Escolhe a implementação por `PLATFORM_STORE=memory|prisma`.
- Em modo Prisma, tenta `$connect()` **uma vez** (`probePrisma`). Se falhar,
  não derruba a request — **faz fallback para `MemoryPlatformStore`** e marca
  a sessão como `degraded: true`.
- `HealthDTO` ganha o campo `degraded`, e o launcher/debug mostram isso em UI.

A diferença prática:

- Antes: app quebra na primeira tela porque `modulePreference.findMany()` faz
  Prisma validar o schema, e o `.env` ou a ausência do arquivo SQLite aborta
  a query inteira.
- Depois: Prisma tenta, falha bonitinho, a POC continua servindo tudo via
  memória e **o /debug fala isso em voz alta**.

> Isso é uma decisão deliberada para uma POC didática. Em produção real, o
> caminho certo seria **falhar o bootstrap**. Aqui, queremos manter o launcher
> navegável mesmo quando o DB não foi provisionado.

## 2) Contratos com Zod (borda HTTP tipada)

`@poc/platform-contracts` passa a exportar dois artefatos:

- `src/index.ts` — DTOs (zero runtime, continua zero-deps conceitualmente).
- `src/schemas.ts` — schemas Zod equivalentes, usados **apenas na borda HTTP**.

O route handler fica assim:

~~~ts
// /api/platform/admin/catalog
const actor = requirePolicy(parseActor(req), "admin")
const body = await readJson(req, adminSaveCatalogRequestSchema)
return json(await saveCatalogEntry(body, actor))
~~~

Por que deixar Zod fora do `index.ts`? Porque qualquer consumidor pode usar os
DTOs sem herdar Zod como dependência. Um admin separado que usa outra lib
(e.g. `valibot`) não precisa pagar esse custo.

## 3) RBAC-lite via header

`X-Platform-Actor` carrega o ator: `guest` (ausente), `user:<id>`, `admin:<id>`.

Policies ficam **declarativas** em `src/server/platform/actor.ts`:

~~~ts
const actor  = parseActor(req)
const admin  = requirePolicy(actor, "admin")   // 401 se guest, 403 se user
const any    = requirePolicy(actor, "public")  // passa sempre
~~~

Distinção honesta:

- `guest` + rota admin → **401 unauthorized** (não tem nem identidade).
- `user:*` + rota admin → **403 forbidden** (tem identidade mas não role).
- `admin:*` + rota admin → passa.

Não é auth real — é a **fronteira certa** para um admin real ser plugado depois.
O smoke cobre os três caminhos.

## 4) Paginação e filtros

Todos os listers (`listModules`, `listRuntime`, `listCatalog`, `listFeatures`)
agora retornam `Page<T>`:

~~~ts
interface Page<T> {
  items: T[]
  meta: { page, pageSize, total, pageCount, hasNext, hasPrev }
}
~~~

Filtros por recurso (ex.: `ModulesQuery` tem `area`, `status`, `q`).

Isso **quebra o DTO v4** em listers: quem lia array direto precisa migrar para
`.items`. A quebra é intencional e está documentada em
`docs/08-platform-api.md` — paginar depois seria uma mudança silenciosa muito
pior.

## 5) `apps/admin-preview` — a fronteira provada

`app/(host)/admin-preview/page.tsx` é uma página que não consome o registry,
nem services, nem Prisma. Ela **só fala com a Platform API via HTTP**:

~~~ts
const platform = createHttpPlatformClient({
  baseUrl: `${origin}/api/platform`,
  actor: "admin:preview",
})
~~~

Ou seja, hoje ela está no mesmo repo por conveniência, mas o import graph
prova que poderia ser um app separado (`apps/admin/` ou `github.com/poc/admin`)
sem trocar uma linha no host. É a prova final da fronteira desenhada na v4.

## 6) Autoloader de manifests (opt-in, Node-only)

`src/modules/autoload.ts` descobre manifests via `node:fs`, respeitando a
convenção existente (`export const <id>Manifest`). Uso:

~~~ts
import { autoloadFromCwd } from "@/modules/autoload"
const manifests = await autoloadFromCwd()
~~~

**Regra**: Node puro só (scripts, smokes, CLIs, admin externo). No bundle do
Next, continue usando `all-manifests.ts`. O smoke `smoke-autoload.mjs` garante
equivalência entre os dois caminhos — se alguém adicionar um módulo em disco e
esquecer do `all-manifests.ts`, o smoke falha.

## 7) Testes

~~~bash
pnpm test              # smokes: domains + platform + autoload
pnpm test:domains
pnpm test:platform     # health, paginação, filtros, zod, RBAC, admin, onboarding
pnpm test:autoload     # equivalência entre static e dynamic
~~~

## Matriz de breaking changes

| Item                                   | Antes (v4)              | Depois (v5)                      |
|----------------------------------------|-------------------------|----------------------------------|
| `listModules()` etc.                   | retorna `T[]`           | retorna `Page<T>` (use `.items`) |
| `HealthDTO`                            | sem `degraded`          | inclui `degraded: boolean`       |
| Admin endpoints sem actor              | passavam                | exigem `X-Platform-Actor: admin:*` |
| `import { moduleRegistry }` top-level  | funcionava              | removido — use `getRegistry()`   |
| `import { settingsApi } from "../settings-demo"` | funcionava    | use `../settings-demo/public-api`|

Os dois últimos itens resolvem um TDZ legítimo com Turbopack quando há ciclos
entre manifests e screens. Detalhes em `docs/09-v4-changes.md` (seção "TDZ").

## O que segue para v6

- Admin real em `apps/admin/` (separado), com seu próprio `package.json`.
- Observabilidade: logs estruturados na Platform API (actor, latência, policy).
- RBAC com claim set real e integração futura com Supabase Auth quando a POC
  deixar de ser offline.
- SSE / WebSocket para `/api/platform/events` (stream de mudanças de catálogo,
  flags e runtime — substitui o polling do admin-preview).
