export function getVolatility(
  change24h?: number | null,
  change7d?: number | null
): { label: string; color: string } {
  const abs24 = Math.abs(change24h ?? 0)
  const abs7d = Math.abs(change7d ?? 0)
  const maxChange = Math.max(abs24, abs7d)
  if (maxChange > 15) return { label: "High", color: "text-destructive" }
  if (maxChange > 5) return { label: "Medium", color: "text-warning" }
  return { label: "Low", color: "text-price-up" }
}

export function formatPriceChange(change: number | null | undefined): string {
  if (change == null) return "—"
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
}
