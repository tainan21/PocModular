/**
 * Helpers para route handlers da Platform API (v5).
 *
 * Responsabilidades:
 *  - `json()` / `ok()`       — serializa sucessos
 *  - `handle(policy, fn)`    — envelopa o handler, aplica RBAC, converte
 *                              PlatformError em Response e erros inesperados
 *                              em 500 previsível
 *  - `readJson(req, schema)` — body JSON validado por zod
 *  - `readQuery(req, schema)`— query validada por zod (coerções numéricas etc)
 *
 * Objetivo: manter `route.ts` super finos. Toda a lógica vive em services.
 */

import { NextResponse } from "next/server"
import { PlatformError } from "@poc/platform-contracts"
import type { ZodError, ZodTypeAny, z } from "zod"
import { parseActor, requirePolicy, type Actor, type Policy } from "./actor"

const ACTOR_HEADER = "x-platform-actor"

export function json<T>(data: T, status = 200): Response {
  return NextResponse.json(data, { status })
}

export function ok(): Response {
  return json({ ok: true }, 200)
}

export function currentActor(req: Request): Actor {
  return parseActor(req.headers.get(ACTOR_HEADER))
}

/**
 * Wrapper único para route handlers. A assinatura é deliberada:
 *
 *   GET  /api/platform/modules       -> handle(req, "public", async (ctx) => ...)
 *   POST /api/platform/admin/flag    -> handle(req, "admin",  async (ctx) => ...)
 *
 * O handler recebe `ctx` com `{ req, actor }` para evitar que cada rota tenha
 * que buscar headers de novo.
 */
export async function handle<T>(
  req: Request,
  policy: Policy,
  fn: (ctx: { req: Request; actor: Actor }) => Promise<T>,
): Promise<Response> {
  try {
    const actor = parseActor(req.headers.get(ACTOR_HEADER))
    requirePolicy(actor, policy)
    const data = await fn({ req, actor })
    return json(data)
  } catch (err) {
    if (err instanceof PlatformError) {
      return NextResponse.json(err.toBody(), { status: err.status })
    }
    // Zod errors -> invalid_input previsível
    if (isZodError(err)) {
      const details: Record<string, unknown> = {
        issues: err.issues.map((i) => ({
          path: i.path.join("."),
          code: i.code,
          message: i.message,
        })),
      }
      const body = new PlatformError("invalid_input", "Validação falhou", undefined, details).toBody()
      return NextResponse.json(body, { status: 400 })
    }
    console.error("[platform-api] unexpected error:", err)
    return NextResponse.json(
      {
        error: {
          code: "internal",
          message: err instanceof Error ? err.message : "Erro interno",
        },
      },
      { status: 500 },
    )
  }
}

function isZodError(err: unknown): err is ZodError {
  return !!err && typeof err === "object" && (err as { name?: string }).name === "ZodError"
}

/**
 * Lê o body JSON e valida com o schema fornecido.
 * Usamos `z.infer<S>` para que o retorno seja o **output** do schema, o que
 * permite schemas com `.transform()` (ex.: string→boolean nas queries).
 */
export async function readJson<S extends ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<z.infer<S>> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    throw new PlatformError("invalid_input", "JSON inválido no body")
  }
  return schema.parse(raw) as z.infer<S>
}

/** Lê e valida a query-string. Aceita schemas com transform (ex.: "true"→true). */
export function readQuery<S extends ZodTypeAny>(req: Request, schema: S): z.infer<S> {
  const url = new URL(req.url)
  const obj: Record<string, string> = {}
  for (const [k, v] of url.searchParams.entries()) obj[k] = v
  return schema.parse(obj) as z.infer<S>
}
