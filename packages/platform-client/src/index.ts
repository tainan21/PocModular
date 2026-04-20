/**
 * @poc/platform-client
 *
 * Exporta a interface `PlatformClient` e a impl HTTP (`createHttpPlatformClient`).
 *
 * A impl LOCAL vive em `src/server/platform/local-client.ts` dentro do app
 * porque importa os services server-side. Assim este pacote continua puro
 * (sem framework, sem Prisma, sem Next) e pode ser publicado / movido para
 * outro repositório sem mudança alguma.
 */

export type { PlatformClient } from "./client"
export {
  createHttpPlatformClient,
  type HttpPlatformClientOptions,
} from "./http-client"
