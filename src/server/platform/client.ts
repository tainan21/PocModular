
import type { PlatformClient } from "@poc/platform-client"
import { createHttpPlatformClient } from "@poc/platform-client"
import { getLocalPlatformClient } from "./local-client"

/**
 * Resolve QUAL client este processo usa.
 *
 * - Default: client LOCAL (in-process). É o modo "monorepo, um app só" de hoje.
 * - Se POC_PLATFORM_API_URL estiver definido, usa HTTP (modo "admin separado").
 *
 * É exatamente aqui que um admin futuro, rodando em outro app/repo, mudaria
 * UMA linha: apontar POC_PLATFORM_API_URL para o host e pronto. Os DTOs e a
 * superfície de chamadas são idênticos.
 */
let cached: PlatformClient | undefined

export function getPlatformClient(): PlatformClient {
  if (cached) return cached
  const base = process.env.POC_PLATFORM_API_URL
  cached = base
    ? createHttpPlatformClient({ baseUrl: base })
    : getLocalPlatformClient()
  return cached
}
