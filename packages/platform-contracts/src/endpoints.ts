/**
 * Endpoints da Platform API.
 *
 * Este arquivo é a ÚNICA fonte de verdade dos caminhos.
 * Serve tanto para os route handlers (app/api/platform/**) registrarem
 * o path correto quanto para o client (packages/platform-client) consumir
 * sem espalhar strings mágicas pelo código.
 *
 * Convenção:
 *   - todos os endpoints vivem sob /api/platform
 *   - GET devolve DTO puro e serializável
 *   - POST recebe body JSON e devolve { ok: true } ou o recurso atualizado
 *
 * Mantido sem framework (sem Next, sem fetch). Apenas strings e tipos.
 */

export const PLATFORM_API_BASE = "/api/platform"

export const PlatformEndpoints = {
  // Descoberta
  modules: `${PLATFORM_API_BASE}/modules`,
  module: (id: string) => `${PLATFORM_API_BASE}/modules/${encodeURIComponent(id)}`,
  features: `${PLATFORM_API_BASE}/features`,
  catalog: `${PLATFORM_API_BASE}/catalog`,
  routes: `${PLATFORM_API_BASE}/routes`,

  // Estado e composição
  runtime: `${PLATFORM_API_BASE}/runtime`,
  dashboard: `${PLATFORM_API_BASE}/dashboard`,
  onboarding: `${PLATFORM_API_BASE}/onboarding`,
  health: `${PLATFORM_API_BASE}/health`,

  // Operações administrativas
  adminCatalog: `${PLATFORM_API_BASE}/admin/catalog`,
  adminFlag: `${PLATFORM_API_BASE}/admin/flag`,
  adminReset: `${PLATFORM_API_BASE}/admin/reset-onboarding`,

  // Operações do usuário (onboarding steps)
  onboardingIntent: `${PLATFORM_API_BASE}/onboarding/intent`,
  onboardingSelection: `${PLATFORM_API_BASE}/onboarding/selection`,
  onboardingFinish: `${PLATFORM_API_BASE}/onboarding/finish`,
} as const

export type PlatformEndpointKey = keyof typeof PlatformEndpoints
