"use client"

/**
 * BrowserDraftStore
 * -----------------
 * Camada honesta sobre `window.localStorage`, usada APENAS para:
 *   - rascunhos de formulário
 *   - preferências de UI por dispositivo (ex.: densidade, tema local)
 *
 * Regras:
 *   - Não substitui persistência server-side (Prisma).
 *   - Se `localStorage` não estiver disponível (SSR, modo privado, Tauri
 *     sem window), os métodos viram no-op silencioso.
 *   - Chaves devem ser explicitamente namespaced com o prefixo "poc.".
 */

const PREFIX = "poc."

function available(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    const k = "__poc_probe__"
    window.localStorage.setItem(k, "1")
    window.localStorage.removeItem(k)
    return window.localStorage
  } catch {
    return null
  }
}

export interface BrowserDraftStore<T> {
  read(): T | undefined
  write(value: T): void
  clear(): void
}

export function createBrowserDraftStore<T>(key: string): BrowserDraftStore<T> {
  const fullKey = `${PREFIX}${key}`
  return {
    read(): T | undefined {
      const ls = available()
      if (!ls) return undefined
      const raw = ls.getItem(fullKey)
      if (!raw) return undefined
      try {
        return JSON.parse(raw) as T
      } catch {
        return undefined
      }
    },
    write(value: T): void {
      const ls = available()
      if (!ls) return
      try {
        ls.setItem(fullKey, JSON.stringify(value))
      } catch {
        // quota / modo privado — ignoramos
      }
    },
    clear(): void {
      const ls = available()
      if (!ls) return
      ls.removeItem(fullKey)
    },
  }
}
