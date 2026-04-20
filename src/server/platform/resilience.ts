/**
 * Camada de resiliência para qualquer repositório/adaptador que fale Prisma.
 *
 * Contexto: a Platform API tem fallback memoria em `getPlatformStore()`, mas
 * os módulos individuais (tasks, catalog, settings) têm seus próprios
 * repositórios que tocam Prisma diretamente. Sem essa camada, qualquer erro
 * de datasource num módulo (ex.: sandbox perdeu o SQLite, DATABASE_URL sumiu
 * na hot-reload) quebrava a tela inteira.
 *
 * A regra é simples:
 *  - primeira chamada tenta Prisma
 *  - se a exceção bate com um padrão de erro de INFRAESTRUTURA
 *    (não erro de app, não erro de validação), troca para Memory
 *    de forma permanente neste worker e repete a chamada
 *  - chamadas subsequentes usam Memory direto (sem latência extra)
 *
 * Isso é intencionalmente silencioso: queremos que a POC renderize mesmo
 * em estado degradado, com um único aviso no console.
 */
import "server-only"

/** Padrões de erro que indicam "DB quebrou, não é bug de app". */
const DATASOURCE_ERROR_PATTERNS = [
  /url must start with the protocol/i,
  /Error validating datasource/i,
  /Unable to open the database file/i,
  /no such table/i,
  /database is locked/i,
  /PrismaClientInitializationError/i,
  /PrismaClientRustPanicError/i,
  /P1001/i, // can't reach db
  /P1003/i, // db does not exist
  /P1010/i, // access denied
  /P1017/i, // server closed the connection
  /P2021/i, // table does not exist
]

export function isDatasourceError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "")
  const name = err instanceof Error ? err.name : ""
  return (
    DATASOURCE_ERROR_PATTERNS.some((re) => re.test(msg)) ||
    DATASOURCE_ERROR_PATTERNS.some((re) => re.test(name))
  )
}

/**
 * Verifica se `DATABASE_URL` está num shape plausível ANTES de tocar Prisma.
 * O objetivo é evitar a situação em que `new PrismaClient()` é criado com
 * uma URL vazia — o cliente não lança na criação, mas a primeira query
 * lança "url must start with the protocol `file:`", que é o erro que
 * estamos tentando prevenir.
 */
export function hasPlausibleDatabaseUrl(): boolean {
  const raw = process.env.DATABASE_URL
  if (!raw || typeof raw !== "string") return false
  const trimmed = raw.trim().replace(/^["']|["']$/g, "")
  if (trimmed.length === 0) return false
  return (
    trimmed.startsWith("file:") ||
    trimmed.startsWith("postgres://") ||
    trimmed.startsWith("postgresql://") ||
    trimmed.startsWith("mysql://") ||
    trimmed.startsWith("sqlserver://") ||
    trimmed.startsWith("mongodb://") ||
    trimmed.startsWith("mongodb+srv://")
  )
}

const warned = new Set<string>()
function warnOnce(label: string, reason: string): void {
  if (warned.has(label)) return
  warned.add(label)
  // eslint-disable-next-line no-console
  console.warn(
    `[resilience] ${label}: DB indisponível (${reason}). Usando repositório em memória. ` +
      `Restaure o banco e recarregue para voltar ao Prisma.`,
  )
}

/**
 * Envolve um repositório que fala Prisma com fallback automático para uma
 * implementação em memória. Idempotente: a mesma instância é retornada em
 * múltiplas chamadas (módulos que fazem `new PrismaXRepo()` a cada import
 * devem cachear em module-scope).
 *
 * Requisitos para que o replay funcione: Prisma e Memory devem expor a
 * MESMA interface (mesmos métodos, mesma semântica). Isso é garantido por
 * implementarem a mesma `XRepository` do domínio.
 */
export function withDatasourceFallback<T extends object>(
  label: string,
  prismaImpl: T,
  createMemoryImpl: () => T,
): T {
  let fallback: T | null = null

  return new Proxy(prismaImpl, {
    get(target, prop, receiver) {
      // Se já degradou, todas as chamadas vão direto pro memory impl.
      if (fallback) {
        return Reflect.get(fallback as object, prop)
      }

      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== "function") return value

      // Embrulha métodos async: tenta Prisma, cai pra memória em erro de infra.
      return async function wrapped(...args: unknown[]) {
        if (fallback) {
          // Race: outra chamada disparou fallback enquanto esta estava no
          // event loop. Reencaminha.
          const replay = (fallback as unknown as Record<string, unknown>)[
            prop as string
          ]
          if (typeof replay === "function") {
            return (replay as (...a: unknown[]) => unknown).apply(
              fallback,
              args,
            )
          }
        }
        try {
          return await (value as (...a: unknown[]) => unknown).apply(
            target,
            args,
          )
        } catch (err) {
          if (!isDatasourceError(err)) throw err
          warnOnce(
            label,
            err instanceof Error ? err.message.split("\n")[0] : String(err),
          )
          fallback = createMemoryImpl()
          const replay = (fallback as unknown as Record<string, unknown>)[
            prop as string
          ]
          if (typeof replay !== "function") throw err
          return (replay as (...a: unknown[]) => unknown).apply(fallback, args)
        }
      }
    },
  })
}
