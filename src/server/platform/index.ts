
/**
 * Barrel da camada server-side de Platform.
 *
 * Este é o entry-point consumido pelos route handlers (app/api/platform/**)
 * e pelo platform-client (modo local). Nenhum consumidor deve reachar
 * diretamente em `@server/platform/services/*` — passe sempre por aqui.
 */

export * from "./services/platform-service"
export * from "./services/dashboard-service"
export * from "./services/onboarding-service"
export * from "./services/admin-service"
export { getPlatformStore, type PlatformStateStore } from "./storage"
