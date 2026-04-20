/**
 * Util local para concatenar classes do Tailwind sem dep extra.
 * Intencionalmente pequeno — não tenta resolver conflito de classes
 * (o que `tailwind-merge` faria); ordem do call-site decide.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ")
}
