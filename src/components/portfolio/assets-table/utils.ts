import type { AssetRow } from "@/lib/types/portfolio"

export type SortKey = "value" | "pnl" | "change24h" | "cost" | "qty" | "price"
export type SortDir = "desc" | "asc"
export type HoldingsView = "grid" | "list"

export function pnlCalc(row: AssetRow): { pnl: number; pct: number | null } | null {
  if (row.purchasePrice == null || row.currentPrice == null) return null
  const pnl = (row.currentPrice - row.purchasePrice) * row.quantity
  const pct =
    row.purchasePrice > 0
      ? ((row.currentPrice - row.purchasePrice) / row.purchasePrice) * 100
      : null
  return { pnl, pct }
}

export function holdingValue(row: AssetRow): number {
  return (row.currentPrice ?? 0) * row.quantity
}

export function sortAssets(assets: AssetRow[], key: SortKey, dir: SortDir): AssetRow[] {
  const m = dir === "asc" ? 1 : -1
  return [...assets].sort((a, b) => {
    switch (key) {
      case "value":
        return (holdingValue(a) - holdingValue(b)) * m
      case "pnl": {
        const pa = pnlCalc(a)
        const pb = pnlCalc(b)
        if (pa?.pct == null && pb?.pct == null) return 0
        if (pa?.pct == null) return 1
        if (pb?.pct == null) return -1
        return (pa.pct - pb.pct) * m
      }
      case "change24h":
        return ((a.priceChange24h ?? -Infinity) - (b.priceChange24h ?? -Infinity)) * m
      case "cost": {
        const ca = (a.purchasePrice ?? 0) * a.quantity
        const cb = (b.purchasePrice ?? 0) * b.quantity
        return (ca - cb) * m
      }
      case "qty":
        return (a.quantity - b.quantity) * m
      case "price":
        return ((a.currentPrice ?? -Infinity) - (b.currentPrice ?? -Infinity)) * m
      default:
        return 0
    }
  })
}

export function parseCostValue(raw: string): number | null | undefined {
  const trimmed = raw.trim()
  if (trimmed === "") return null
  const p = Math.round(parseFloat(trimmed))
  if (isNaN(p)) return undefined
  return p
}
