export type Pricing = "free" | "paid" | "internal" | "experimental"

const toneMap: Record<Pricing, string> = {
  free: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  paid: "bg-primary/10 text-primary ring-primary/20",
  internal: "bg-muted text-muted-foreground ring-muted/40",
  experimental: "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20",
}

const labelMap: Record<Pricing, string> = {
  free: "Free",
  paid: "Paid",
  internal: "Internal",
  experimental: "Experimental",
}

/**
 * Pequena badge visual para pricing de um módulo/feature.
 * Aceita preço em centavos para exibir no modelo "paid".
 */
export function PricingBadge({
  model,
  priceCents,
}: {
  model: Pricing
  priceCents?: number | null
}) {
  const label =
    model === "paid" && typeof priceCents === "number"
      ? `Paid · ${formatCents(priceCents)}`
      : labelMap[model]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${toneMap[model]}`}
    >
      {label}
    </span>
  )
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })
}
