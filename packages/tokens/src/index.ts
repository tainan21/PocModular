/**
 * @poc/tokens
 *
 * Tokens mínimos da POC. Mantidos pequenos de propósito: a POC já tem
 * tokens shadcn (`--background`, `--foreground`, etc). Este pacote adiciona
 * alguns tokens de *plataforma* que aparecem em vários componentes do
 * `@poc/module-ui` — e documenta a convenção.
 *
 * Regra de ouro: se algo aqui virou "design system", saiu do escopo.
 * Use shadcn tokens sempre que possível. Crie um token novo APENAS se
 * o valor for compartilhado por 2+ componentes ou por 2+ áreas do app.
 */

export const PLATFORM_TOKENS = {
  // elevation / surfaces extras
  surfaceElevated: "var(--platform-surface-elevated)",
  surfaceSubtle: "var(--platform-surface-subtle)",
  surfaceApi: "var(--platform-surface-api)",

  // acentos funcionais (catálogo, estado, admin)
  accentCatalog: "var(--platform-accent-catalog)",
  accentFlag: "var(--platform-accent-flag)",
  accentApi: "var(--platform-accent-api)",

  // radius / spacing
  radiusLauncher: "var(--platform-radius-launcher)",
} as const

export type PlatformTokenKey = keyof typeof PLATFORM_TOKENS
