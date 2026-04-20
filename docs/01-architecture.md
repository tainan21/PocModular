# Arquitetura

## Camadas

```
┌─────────────────────────────────────────────────────────────┐
│  app/ (Next.js App Router)                                  │
│    • casca de runtime: layout, catch-all, entrypoints       │
└─────────────────────────────────────────────────────────────┘
                    ▲
                    │ importa contratos + registry
                    │
┌─────────────────────────────────────────────────────────────┐
│  src/host/                                                  │
│    • contracts: Manifest, Route, Navigation, Capability     │
│    • registry: lista, valida e resolve módulos              │
│    • layouts, topbar, sidebar                               │
└─────────────────────────────────────────────────────────────┘
                    ▲
                    │ se registra via manifest
                    │
┌─────────────────────────────────────────────────────────────┐
│  src/modules/<id>/                                          │
│    • manifest.ts                                            │
│    • presentation/screens (React)                           │
│    • application/ (actions + queries, server-only)          │
│    • infra/ (repositório Prisma do módulo)                  │
└─────────────────────────────────────────────────────────────┘
                    ▲
                    │ depende apenas de contratos
                    │
┌─────────────────────────────────────────────────────────────┐
│  domains/<id>/                                              │
│    • domain/ (entidades, VOs, regras)                       │
│    • application/ (use-cases, contratos de repositório)     │
│                                                             │
│  *** ZERO dependência de Next, React ou Prisma ***          │
└─────────────────────────────────────────────────────────────┘
```

## Por que duas pastas (`modules` e `domains`)?

- `domains/<id>` é o **núcleo puro**: entidades, regras, use-cases, contratos
  de repositório. **Nenhum import de Next, React ou Prisma.** É a parte que
  pode ser extraída para um package independente e reusada em outra stack
  (ex.: app Tauri, CLI, worker).

- `src/modules/<id>` é o **adaptador para este runtime Next**: manifest,
  screens React, server actions e a **implementação Prisma** do repositório.

Essa separação é a mesma intenção de Clean Architecture / Hexagonal /
Ports-and-Adapters, mas sem o excesso de camadas vazias. A POC tem só
o que é útil para demonstrar o conceito.

## Regras firmes

1. **Domínio não importa framework.**
   Os arquivos em `domains/` importam apenas de `domains/<id>/*`.

2. **Host não importa módulos diretamente.**
   O host conhece apenas o registry; quem registra módulos é um arquivo
   de bootstrap (`src/host/registry/index.ts`).

3. **Módulos não importam do host, exceto contratos.**
   Ou seja: `@host/core/contracts` é permitido; qualquer outra coisa não.

4. **Prisma só na infra do módulo.**
   Os arquivos em `domains/` jamais importam `@prisma/client`. Só os
   repositórios concretos em `src/modules/<id>/infra/`.

5. **Rotas não são hardcoded.**
   A home e o sidebar são 100% construídos a partir do registry.
   A rota `/m/[...slug]` faz toda a resolução dinâmica.

## Fluxo de uma requisição

1. Usuário acessa `/m/notes/edit/abc`.
2. Next resolve para `app/(host)/m/[...slug]/page.tsx`.
3. A page chama `moduleRegistry.resolveRoute("/m/notes/edit/abc")`.
4. O registry encontra o manifest `notes`, faz match com a rota
   `edit/:id`, extrai `{ id: "abc" }` e resolve o componente de tela.
5. A page renderiza `<Screen params={{ id: "abc" }} moduleBasePath="/m/notes" />`.
6. A screen (RSC) usa a query do módulo, que por sua vez usa o
   repositório Prisma, que usa o domínio para orquestrar a lógica.

Nada disso é mágico: todos os pontos são código claro que você pode abrir.
