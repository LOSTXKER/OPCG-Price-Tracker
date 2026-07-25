import type { HistoryPoint } from "@/lib/types/portfolio"

export type PortfolioHistorySnapshot = {
  totalJpy: number
  totalThb: number | null
  totalCost: number
  netInvestedJpy: number | null
  /** Null when copy-level cost coverage is incomplete or unknown. */
  pnl: number | null
  cardCount: number
  totalCopyCount?: number | null
  costedCopyCount?: number | null
  snapshotAt: string
}

/**
 * Converts persisted snapshots into chart points without mistaking late cost
 * entry for a new purchase. New snapshots carry copy counts, so an inflow
 * follows a physical copy increase even when cost is still unknown. Legacy
 * snapshots have no copy count and retain the original cost-only fallback.
 */
export function toPortfolioHistoryPoints(
  snapshots: PortfolioHistorySnapshot[],
  locale: string,
): HistoryPoint[] {
  let prevInvested: number | null = null
  let prevTotalCopyCount: number | null = null

  return snapshots.map((snapshot) => {
    const netInvested = snapshot.netInvestedJpy ?? snapshot.totalCost
    const investedIncreased =
      prevInvested != null && netInvested > prevInvested
    const hasComparableCopyCounts =
      prevTotalCopyCount != null && snapshot.totalCopyCount != null
    const copiesIncreased =
      prevTotalCopyCount != null &&
      snapshot.totalCopyCount != null &&
      snapshot.totalCopyCount > prevTotalCopyCount
    // Modern snapshots know the physical copy count, so adding a card remains
    // an inflow even when its cost has not been recorded yet. This also keeps a
    // late cost-only edit from looking like a new purchase. Legacy snapshots
    // have no copy coverage and retain the invested-cost fallback.
    const isInflow = hasComparableCopyCounts
      ? copiesIncreased
      : investedIncreased

    prevInvested = netInvested
    prevTotalCopyCount = snapshot.totalCopyCount ?? null

    return {
      label: new Date(snapshot.snapshotAt).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      }),
      date: snapshot.snapshotAt,
      value: snapshot.totalJpy,
      cost: snapshot.totalCost,
      netInvested,
      cardCount: snapshot.cardCount,
      totalCopyCount: snapshot.totalCopyCount,
      costedCopyCount: snapshot.costedCopyCount,
      isInflow,
    }
  })
}
