import * as Icons from "lucide-react"
import type { LucideIcon } from "lucide-react"

/**
 * Resolve um nome de ícone (string no manifest) no componente Lucide.
 * Se não existir, cai em `Circle`.
 */
export function ManifestIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = ((name && (Icons as unknown as Record<string, LucideIcon>)[name]) ??
    Icons.Circle) as LucideIcon
  return <Icon className={className} />
}
