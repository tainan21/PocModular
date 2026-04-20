/**
 * HTTP implementation of PlatformClient (v5).
 *
 * Zero dependência de framework. Consome apenas `fetch` (global) e os paths
 * definidos em @poc/platform-contracts/endpoints.
 *
 * Novidades v5:
 *  - `actor` opcional -> vira header X-Platform-Actor em todas as requests
 *  - query params padronizada (page, pageSize, q, filtros específicos)
 *  - os listers devolvem `Page<T>` (consumidor lê `.items` e `.meta`)
 */

import {
  PlatformEndpoints,
  PlatformError,
  type PlatformErrorBody,
  type ModuleDTO,
  type CatalogEntryDTO,
  type FeatureDTO,
  type RuntimeInfoDTO,
  type RouteEntryDTO,
  type DashboardDTO,
  type HealthDTO,
  type OnboardingSnapshotDTO,
  type OnboardingStateDTO,
  type AdminSaveCatalogRequest,
  type AdminSetFlagRequest,
  type OkResponse,
  type Page,
  type ModulesQuery,
  type FeaturesQuery,
  type CatalogQuery,
  type RuntimeQuery,
} from "@poc/platform-contracts"
import type { PlatformClient } from "./client"

export interface HttpPlatformClientOptions {
  /**
   * Base URL para prefixar os endpoints. Pode ser:
   *  - "" (default, relativo à origem atual) — usar em browsers
   *  - "http://host:port" — usar a partir de outro app/server
   */
  baseUrl?: string
  /**
   * Identidade opcional enviada como header `X-Platform-Actor`.
   * Formatos reconhecidos pelo server: "admin", "admin:alice", "user:bob".
   * Ausente => guest.
   */
  actor?: string
  /** Fetch custom (útil em tests) */
  fetchImpl?: typeof fetch
  /** Cache do Next.js (útil em RSC): "no-store" | "force-cache" etc. */
  cache?: RequestCache
  /** Headers adicionais aplicados em toda request. */
  headers?: Record<string, string>
}

function qs<T extends object>(record?: T): string {
  if (!record) return ""
  const parts: string[] = []
  for (const [k, v] of Object.entries(record as Record<string, unknown>)) {
    if (v === undefined || v === null) continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return parts.length ? `?${parts.join("&")}` : ""
}

export function createHttpPlatformClient(
  opts: HttpPlatformClientOptions = {},
): PlatformClient {
  const base = opts.baseUrl ?? ""
  const fetchImpl = opts.fetchImpl ?? fetch
  const defaultCache = opts.cache ?? "no-store"
  const staticHeaders: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
    ...(opts.headers ?? {}),
  }
  if (opts.actor) staticHeaders["x-platform-actor"] = opts.actor

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = base + path
    const res = await fetchImpl(url, {
      cache: defaultCache,
      ...init,
      headers: {
        ...staticHeaders,
        ...(init?.headers ?? {}),
      },
    })
    if (!res.ok) {
      let body: PlatformErrorBody | null = null
      try {
        body = (await res.json()) as PlatformErrorBody
      } catch {
        body = null
      }
      throw new PlatformError(
        body?.error?.code ?? "internal",
        body?.error?.message ?? `HTTP ${res.status}`,
        res.status,
        body?.error?.details,
      )
    }
    return (await res.json()) as T
  }

  return {
    mode: "http",

    listModules: (q?: ModulesQuery) =>
      request<Page<ModuleDTO>>(PlatformEndpoints.modules + qs(q)),
    getModule: (id: string) =>
      request<ModuleDTO>(PlatformEndpoints.module(id)).catch((err) => {
        if (err instanceof PlatformError && err.code === "not_found") return null
        throw err
      }),
    listFeatures: (q?: FeaturesQuery) =>
      request<Page<FeatureDTO>>(PlatformEndpoints.features + qs(q)),
    listCatalog: (q?: CatalogQuery) =>
      request<Page<CatalogEntryDTO>>(PlatformEndpoints.catalog + qs(q)),
    listRoutes: () => request<RouteEntryDTO[]>(PlatformEndpoints.routes),

    listRuntime: (q?: RuntimeQuery) =>
      request<Page<RuntimeInfoDTO>>(PlatformEndpoints.runtime + qs(q)),
    getDashboard: () => request<DashboardDTO>(PlatformEndpoints.dashboard),
    getOnboarding: () => request<OnboardingSnapshotDTO>(PlatformEndpoints.onboarding),
    getHealth: () => request<HealthDTO>(PlatformEndpoints.health),

    setOnboardingIntent: (intent: string) =>
      request<OnboardingStateDTO>(PlatformEndpoints.onboardingIntent, {
        method: "POST",
        body: JSON.stringify({ intent }),
      }),
    setOnboardingSelection: (moduleIds: string[]) =>
      request<OnboardingStateDTO>(PlatformEndpoints.onboardingSelection, {
        method: "POST",
        body: JSON.stringify({ moduleIds }),
      }),
    finishOnboarding: () =>
      request<OnboardingStateDTO>(PlatformEndpoints.onboardingFinish, {
        method: "POST",
      }),

    saveCatalog: (input: AdminSaveCatalogRequest) =>
      request<OkResponse>(PlatformEndpoints.adminCatalog, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    setFlag: (input: AdminSetFlagRequest) =>
      request<OkResponse>(PlatformEndpoints.adminFlag, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    resetOnboarding: () =>
      request<OnboardingStateDTO>(PlatformEndpoints.adminReset, {
        method: "POST",
      }),
  }
}
