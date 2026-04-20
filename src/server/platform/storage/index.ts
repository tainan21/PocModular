/**
 * Factory do PlatformStateStore.
 *
 * Escolha da impl (em ordem):
 *
 *   1. PLATFORM_STORE=memory       -> MemoryPlatformStore (explícito, força)
 *   2. PLATFORM_STORE=prisma       -> PrismaPlatformStore (explícito, exige DATABASE_URL)
 *   3. não setado + DATABASE_URL   -> tenta Prisma; se a conexão falhar, cai para Memory
 *                                     com aviso único no console (degraded mode)
 *   4. não setado + sem DATABASE_URL -> Memory direto (dev / preview offline)
 *
 * O resto da aplicação (services, route handlers) depende APENAS da porta
 * `PlatformStateStore`, então este degradado é invisível para chamadores.
 */

import type { PlatformStateStore } from "./store"
import { MemoryPlatformStore } from "./memory-store"
import { hasPlausibleDatabaseUrl, isDatasourceError } from "../resilience"

export type { PlatformStateStore } from "./store"
export { MemoryPlatformStore }

let cached: PlatformStateStore | null = null
let cachedKind: "prisma" | "memory" = "memory"
let cachedDegraded = false
let warnedOnce = false
// Dedup: quando várias Promises chamam `getPlatformStore()` ao mesmo tempo
// (típico no launcher, que faz Promise.all de 4 chamadas da Platform API),
// todas aguardam a mesma promessa de inicialização para evitar N probes em
// paralelo — qualquer um deles resolveria o fallback, e não queremos
// instanciar N PrismaClient.
let initPromise: Promise<PlatformStateStore> | null = null

function warnFallback(reason: string): void {
  if (warnedOnce) return
  warnedOnce = true
  // eslint-disable-next-line no-console
  console.warn(
    `[platform] DB indisponível (${reason}). Caindo para MemoryPlatformStore. ` +
      `Defina DATABASE_URL e rode \`pnpm db:push && pnpm db:seed\` para usar Prisma.`,
  )
}

/**
 * Factory assíncrona do store. Em modo "memory" nunca carregamos o módulo
 * Prisma — isso mantém o bundle leve e permite rodar smoke sem DB. Em modo
 * "prisma" o import é dinâmico e, em caso de erro real de conexão, a fachada
 * degrada para memória silenciosamente (com um único warning).
 */
export async function getPlatformStore(): Promise<PlatformStateStore> {
  if (cached) return cached
  if (initPromise) return initPromise
  initPromise = initStore().finally(() => {
    // Mantemos initPromise vivo enquanto `cached` não firmou; em caso de
    // sucesso, limpamos para liberar o closure.
    if (cached) initPromise = null
  })
  return initPromise
}

async function initStore(): Promise<PlatformStateStore> {
  const explicit = (process.env.PLATFORM_STORE ?? "").toLowerCase()

  // 1) Forçado memory
  if (explicit === "memory") {
    cached = new MemoryPlatformStore()
    cachedKind = "memory"
    return cached
  }

  // 2) Forçado prisma: não tem fallback, erro real sobe.
  if (explicit === "prisma") {
    const mod = await import("./prisma-store")
    cached = new mod.PrismaPlatformStore()
    cachedKind = "prisma"
    return cached
  }

  // 3/4) Sem override: tenta Prisma só se DATABASE_URL for plausível.
  if (!hasPlausibleDatabaseUrl()) {
    warnFallback("DATABASE_URL ausente ou inválida")
    cached = new MemoryPlatformStore()
    cachedKind = "memory"
    cachedDegraded = true
    return cached
  }

  try {
    const mod = await import("./prisma-store")
    const store = new mod.PrismaPlatformStore()
    // Probe em três camadas:
    //   (a) $queryRaw SELECT 1 valida datasource + abre conexão.
    //   (b) loadModuleOverrides confirma que o schema foi aplicado.
    //   (c) getDemoUserId garante que operações de ESCRITA funcionam
    //       (esta é a que pega a maioria dos bugs reais: DB read-only,
    //       permissão negada, coluna ausente).
    const { prisma } = await import("@server/db/prisma")
    await prisma.$queryRawUnsafe("SELECT 1")
    await store.loadModuleOverrides()
    await store.getDemoUserId()

    // Wrap num proxy-safety: se em runtime qualquer método explodir com um
    // erro de datasource (típico quando o SQLite some no meio do dev — o
    // sandbox faz isso), o próximo acesso pega isso, troca para memory e
    // replaya o método contra o novo store. O usuário vê `health.degraded`
    // ficar true, mas a página renderiza.
    cached = wrapWithRuntimeFallback(store)
    cachedKind = "prisma"
    return cached
  } catch (err) {
    warnFallback(err instanceof Error ? err.message.split("\n")[0] : String(err))
    cached = new MemoryPlatformStore()
    cachedKind = "memory"
    cachedDegraded = true
    return cached
  }
}

/**
 * Envolve o PrismaStore num Proxy que, quando um método falha com erro de
 * datasource, degrada para memória de forma permanente neste worker e
 * tenta replay do método contra o novo store. Funções que não são
 * datasource-errors (ex.: ZodError, invariantes) passam intactas.
 *
 * A lógica de detecção vive em `../resilience.ts` para ser reusada pelos
 * repositórios de cada módulo (tasks, catalog, etc.).
 */
function wrapWithRuntimeFallback(real: PlatformStateStore): PlatformStateStore {
  return new Proxy(real, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== "function") return value
      return async function wrapped(...args: unknown[]) {
        try {
          return await (value as (...a: unknown[]) => unknown).apply(target, args)
        } catch (err) {
          if (!isDatasourceError(err)) throw err
          warnFallback(
            err instanceof Error ? err.message.split("\n")[0] : String(err),
          )
          const fallback = new MemoryPlatformStore()
          cached = fallback
          cachedKind = "memory"
          cachedDegraded = true
          const replay = (fallback as unknown as Record<string, unknown>)[
            prop as string
          ]
          if (typeof replay !== "function") {
            throw err
          }
          return await (replay as (...a: unknown[]) => unknown).apply(
            fallback,
            args,
          )
        }
      }
    },
  })
}

export function getPlatformStoreKind(): "prisma" | "memory" {
  return cachedKind
}

/** True quando a factory quis Prisma mas caiu para memória em runtime. */
export function isPlatformStoreDegraded(): boolean {
  return cachedDegraded
}

/** Usado APENAS em testes (smoke) para trocar impl explicitamente. */
export function setPlatformStoreForTests(
  store: PlatformStateStore,
  kind: "prisma" | "memory" = "memory",
): void {
  cached = store
  cachedKind = kind
  cachedDegraded = false
  initPromise = null
}

/** Limpa o cache — útil quando testes querem re-derivar a impl a partir da env. */
export function resetPlatformStoreForTests(): void {
  cached = null
  cachedKind = "memory"
  cachedDegraded = false
  warnedOnce = false
  initPromise = null
}
