/**
 * Actor / RBAC-lite da Platform API (v5).
 *
 * Princípios:
 *  - Não é um sistema de auth. É um mecanismo declarativo suficiente para
 *    distinguir "qualquer leitor" de "operador administrativo" enquanto a
 *    POC não decide sobre sessão real.
 *  - O actor chega por header `X-Platform-Actor` em cada request (simples,
 *    reproduzível, plugável a JWT / sessão no futuro).
 *  - Cada rota declara a política que quer — ninguém faz check ad-hoc.
 *
 * Roles reconhecidas na POC:
 *  - `guest`  -> anônimo / sem header
 *  - `user`   -> leitor autenticado (pode ver seu dashboard, fazer onboarding)
 *  - `admin`  -> operações em /api/platform/admin/*
 *
 * Políticas:
 *  - `public`        -> qualquer um
 *  - `user`          -> user OU admin
 *  - `admin`         -> admin
 */

import { PlatformError } from "@poc/platform-contracts"

export type ActorRole = "guest" | "user" | "admin"
export type Policy = "public" | "user" | "admin"

export interface Actor {
  id: string
  role: ActorRole
}

const GUEST: Actor = { id: "anon", role: "guest" }

/**
 * Formato do header X-Platform-Actor:
 *   "admin"                -> admin / id = "admin"
 *   "admin:alice"          -> admin / id = "alice"
 *   "user:bob"             -> user  / id = "bob"
 *   (ausente / inválido)   -> guest
 *
 * Intencionalmente simples. Trocar por JWT/sessão depois é trocar APENAS
 * esta função — o resto da stack não sabe.
 */
export function parseActor(headerValue: string | null | undefined): Actor {
  if (!headerValue) return GUEST
  const raw = String(headerValue).trim()
  if (!raw) return GUEST
  const [rolePart, idPart] = raw.split(":")
  const role: ActorRole =
    rolePart === "admin" ? "admin" : rolePart === "user" ? "user" : "guest"
  if (role === "guest") return GUEST
  const id = (idPart && idPart.trim()) || role
  return { id, role }
}

export function canAct(actor: Actor, policy: Policy): boolean {
  if (policy === "public") return true
  if (policy === "user") return actor.role === "user" || actor.role === "admin"
  if (policy === "admin") return actor.role === "admin"
  return false
}

/**
 * Sobe um PlatformError quando o actor não atende à política. A fachada HTTP
 * já traduz PlatformError para status adequado (401/403/404/400/500).
 */
export function requirePolicy(actor: Actor, policy: Policy): void {
  if (canAct(actor, policy)) return
  if (actor.role === "guest" && policy !== "public") {
    throw new PlatformError("unauthorized", "Authentication required")
  }
  throw new PlatformError("forbidden", `Requires role '${policy}' (actor is '${actor.role}')`)
}
