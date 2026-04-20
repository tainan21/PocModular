# Evolução

Como esta POC se prepara para o futuro, sem pagar o custo agora.

> **Status v4:** a parte de "admin separado" já foi resolvida em termos de **contratos**.
> Existe `@poc/platform-contracts` com os DTOs, `@poc/platform-client` com o client HTTP,
> e os endpoints `/api/platform/v1/*` implementados. O que falta para um admin realmente
> separado é apenas **criar um `apps/admin/` ou um repositório externo consumindo esse
> client** — o contrato e a fronteira já existem. Ver `docs/08-platform-api.md`.

## 1. Extrair `domains/*` para packages

As pastas em `domains/<id>/` não importam nada de Next, React ou Prisma.
Isso torna a extração trivial:

```
packages/
  domain-notes/            # mover domains/notes aqui
  domain-tasks/
  domain-catalog/
apps/
  web/                     # este app atual
  tauri/                   # futuro runtime desktop
```

O que muda:

- Cada domínio vira um package publicável (ou workspace).
- Os módulos Next continuam iguais, só trocam `@domains/notes` por `@org/domain-notes`.
- O app Tauri pode reusar **exatamente** o mesmo domínio e use-cases,
  trocando apenas o adaptador de infra (SQLite via `tauri-plugin-sql`,
  ou outro mecanismo).

## 2. Extrair `src/host/core/contracts` para package

Contratos são puros TS. Podem virar:

```
packages/
  host-contracts/          # ModuleManifest, Route, Navigation, Registry
  host-registry/           # implementação in-memory do ModuleRegistry
```

Isso permite que outros runtimes compartilhem a mesma linguagem de
"o que é um módulo". O runtime Tauri pode ter sua própria casca e
reusar os contratos + registry.

## 3. Extrair `src/modules/<id>` como packages plugáveis

Cada módulo vira um package:

```
packages/
  module-notes/
    src/
      manifest.ts
      presentation/...
      application/...
      infra/prisma-notes-repository.ts
```

O package exporta apenas o `manifest`. O app host faz:

```ts
import { notesManifest } from "@org/module-notes"
registry.register(notesManifest)
```

Se um módulo for específico de um runtime (ex.: usa APIs do Tauri),
ele não é importado nos outros. Cada host tem a lista de módulos que
faz sentido para ele.

## 4. Descoberta dinâmica de módulos

Hoje o bootstrap é um array estático. Para descoberta dinâmica:

- **Filesystem discovery**: varrer `modules/*` e importar cada `manifest.ts`.
- **Registry remoto**: buscar de uma API/URL lista de módulos com URLs de bundle.
- **Plug-in system**: usar dynamic `import()` por ID.

A interface `IModuleRegistry` não precisa mudar.

## 5. Permissões reais (capabilities)

Hoje `capabilities` são strings declarativas. Próximos passos:

- Associar capabilities a perfis de usuário.
- O registry filtra módulos e rotas a partir das capabilities do usuário atual.
- Server actions verificam a capability antes de executar.

Tudo isso pode ser feito sem mexer nos manifests existentes — só no host.

## 6. Validação com Zod (opcional)

Trocar o validador atual por schema Zod é um movimento pequeno:

- Definir `ModuleManifestSchema` em `host/core/contracts/manifest.schema.ts`.
- Substituir `validateManifest` por `ModuleManifestSchema.parse`.
- Benefícios: erros mais ricos, autocompletion em runtime.

## 7. Preparação para Tauri

O ponto crítico é que **domínios e use-cases já estão isolados**.
Para um app Tauri:

1. Criar `apps/tauri/` com Vite + React (ou Svelte, ou o que preferir).
2. Reusar `packages/host-contracts` e `packages/host-registry`.
3. Criar adaptadores de infra específicos do Tauri (SQLite local,
   filesystem, etc) que implementam as mesmas interfaces do domínio.
4. Reaproveitar as screens que **não dependem** de APIs Next
   (server actions). Onde dependem, criar alternativas com IPC do Tauri.

## Limitações honestas desta POC

- Screens usam **server actions Next** para escrita. Em Tauri isso
  precisa ser reescrito com comandos/IPC. A POC não tenta esconder isso
  atrás de uma abstração — seria overengineering prematuro.
- O registry é in-memory e síncrono. Descoberta remota exigirá async.
- Não há testes automatizados. A próxima camada útil seria testes dos
  use-cases (em domínio puro, rodam em qualquer lugar sem setup).
