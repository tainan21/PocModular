# v4 — Platform API, launcher e preparação para admin separado

## Resumo em uma frase

A v4 **não adiciona features de produto**. Ela transforma o host em uma **plataforma com
superfície pública** (DTOs + endpoints HTTP + client dual-mode), troca a home por um
**launcher**, isola o visual em packages e implementa uma **storage strategy** honesta
(Prisma como default, Memory para smoke/demo).

Tudo o que a v3 provou continua valendo. A v4 só adiciona uma camada acima dela.

## O problema que a v4 resolve

Na v3, o Control Center consumia o estado do host chamando diretamente `runtime-info`,
`catalog-state` e funções server-side. Isso funciona enquanto admin e host moram no
**mesmo processo**. No dia em que alguém decide mover o admin para outro app ou outro
repositório, o acoplamento vira uma reescrita. A v4 antecipa isso:

- toda leitura e escrita de estado da plataforma passa por `src/server/platform/`;
- todo DTO vive em `@poc/platform-contracts` (zero deps, portável);
- todo consumidor usa `@poc/platform-client` (local OU http, com o mesmo contrato);
- os consumidores do host (Control Center, Launcher, Onboarding) **já consomem via client**,
  provando hoje que o consumo funciona em in-process e funcionaria idêntico em HTTP.

## O que entrou

### 1. Platform API

Endpoints versionados em `/api/platform/v1/*`:

| Método | Endpoint                                     | Propósito                        |
| ------ | -------------------------------------------- | -------------------------------- |
| GET    | `/api/platform/v1/modules`                   | lista módulos (DTO)              |
| GET    | `/api/platform/v1/modules/:id`               | detalhe de módulo + flags reais  |
| GET    | `/api/platform/v1/features`                  | lista features do catálogo       |
| GET    | `/api/platform/v1/catalog`                   | lista catálogo (pricing/visib.)  |
| GET    | `/api/platform/v1/runtime`                   | estados efetivos + issues        |
| GET    | `/api/platform/v1/routes`                    | todas as rotas publicadas        |
| GET    | `/api/platform/v1/dashboard`                 | dashboard composto               |
| GET    | `/api/platform/v1/onboarding`                | estado + módulos elegíveis       |
| POST   | `/api/platform/v1/onboarding/intent`         | salva intenção                   |
| POST   | `/api/platform/v1/onboarding/selection`      | salva seleção                    |
| POST   | `/api/platform/v1/onboarding/finish`         | conclui onboarding               |
| POST   | `/api/platform/v1/admin/catalog`             | upsert de catalog entry          |
| POST   | `/api/platform/v1/admin/flag`                | altera flag                      |
| POST   | `/api/platform/v1/admin/reset-onboarding`    | reset demo                       |
| GET    | `/api/platform/v1/health`                    | version, store, sub-serviços     |

Tudo responde DTO JSON estável. Erros seguem `{ code, message }` com o enum de `@poc/platform-contracts/errors`.

### 2. `@poc/platform-contracts`

Package puro com DTOs (`ModuleDTO`, `FeatureDTO`, `CatalogEntryDTO`, `RuntimeInfoDTO`,
`DashboardDTO`, `OnboardingStateDTO`, `HealthDTO`), enums de erro e o mapa de endpoints.
Zero dependência em Next, React ou Prisma. É o que um admin separado instala.

### 3. `@poc/platform-client`

- `httpPlatformClient({ baseUrl, fetch? })` — implementação HTTP padrão.
- A interface `PlatformClient` é o contrato único que todos os consumidores usam.
- Tipos importados de `@poc/platform-contracts`.

No host, há um **cliente local** equivalente em `src/server/platform/local-client.ts` que
chama os services in-process. O helper `getPlatformClient()` alterna entre os dois via
`POC_PLATFORM_API_URL`.

### 4. `src/server/platform/`

- `services/` — `platform-service`, `onboarding-service`, `dashboard-service`, `admin-service`.
- `serializers/` — converte manifests + runtime-info em DTOs.
- `storage/` — **storage port** (`PlatformStateStore`) + `PrismaPlatformStore` (default) +
  `MemoryPlatformStore` (smoke). `getPlatformStore()` escolhe via `PLATFORM_STORE`.
- `http.ts` — helpers `json()` e `handleError()` para os route handlers.
- `client.ts` — fábrica pública do client local.

### 5. Launcher em `/`

A home antes redirecionava. Agora é um launcher real que consome a Platform API:

- card de boas-vindas + botão “Continuar” para o destino natural (onboarding ou /home);
- grid de rotas publicadas (apps + admin + debug);
- painel de health (version, store, sub-serviços).

Essa é a **prova** de que a Platform API serve para a própria UI, não só para admins.

### 6. Control Center mais forte

- Aba “Apps” — pricing hint + visibilidade + ordem + enable global.
- Aba “Módulos” — meta-panel por módulo (rotas, contribuições, capabilities, contextos,
  dependências).
- Aba “Features” — tabela com key/label/default/current (current refletindo overrides).
- Aba “Rotas” — tudo o que está publicado no host.
- Seção Demo — reset de onboarding.

Toda a tela consome `@poc/platform-client` (via client local). Um admin em outro repo
monta a mesma tela trocando uma linha de configuração.

### 7. Packages adicionais

- **`@poc/tokens`** — tokens em TS + `tokens.css` com variáveis reutilizáveis.
- **`@poc/module-ui`** — cresceu com `LauncherCard` / `RouteLauncherGrid`,
  `CatalogStatePill`, `ApiSurfaceCard`, `ModuleMetaPanel`, `FeatureMetaTable`,
  `AdminSplitSection`, `createBrowserDraftStore`.

### 8. Storage strategy honesta

| Modo        | Quando usar                            | Ligado por                        |
| ----------- | -------------------------------------- | --------------------------------- |
| `prisma`    | dev normal, produção                   | default, ou `PLATFORM_STORE=prisma` |
| `memory`    | smoke / testes / demo sem DB           | `PLATFORM_STORE=memory`             |

O import do `prisma-store` é **lazy**: em modo memory o Prisma nunca é carregado.
Nada de `localStorage` do browser fingindo ser persistência de servidor.

### 9. Smoke Platform API

`scripts/smoke-platform.mjs` roda sem DB (usa `MemoryPlatformStore`) e atravessa:

1. `health` (store correto, serviços, version)
2. `listModules + getModule` (+ `routes` não vazias)
3. `listRuntime` (estados reais)
4. `listCatalog + listFeatures`
5. `resetOnboarding → setIntent → setSelection → finish`
6. `getDashboard` (widgets e KPIs vindos dos módulos selecionados)
7. `setFlag` + re-read confirmando `current`
8. `saveCatalog` com pricing = `experimental`

`pnpm test` agora corre domínios **e** Platform API.

## O que NÃO mudou (de propósito)

- Manifests. `docs/02-manifest.md` continua verdade.
- Registry. Continua in-memory, síncrono, puro.
- Domínios. Continuam sem framework.
- Schema Prisma. A v4 acrescenta zero tabela.

## O que continua para uma próxima fase

- **Admin separado de verdade** — criar `apps/admin/` (ou outro repo) usando
  `httpPlatformClient({ baseUrl })`. A POC não faz isso agora, mas **prova que é trivial**.
- **RBAC** na Platform API (hoje tudo é anônimo/demo).
- **Descoberta de módulos** por filesystem ou registry remoto.
- **Paginação** nos listeners que hoje devolvem arrays inteiros.
- **Zod nos contratos** para validar entrada/saída no wire.

Nenhum desses itens bloqueia a v4 — eles pressupõem que a v4 já existe.
