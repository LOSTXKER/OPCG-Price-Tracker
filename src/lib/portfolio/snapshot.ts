export type SnapshotPortfolioInput = {
  id: number
  items: Array<{
    quantity: number
    purchasePrice: number | null
    lots?: Array<{
      quantity: number
      unitCostJpy: number | null
    }>
    card: {
      latestPriceJpy: number | null
      latestPriceThb: number | null
    }
  }>
}

export type PortfolioSnapshotInput = {
  portfolioId: number
  totalJpy: number
  totalThb: number
  totalCost: number
  netInvestedJpy: number
  pnl: number
  cardCount: number
  totalCopyCount: number
  costedCopyCount: number
}

type SnapshotPerformanceCoverage = {
  pnl: number
  /** Null on snapshots created before copy-level coverage was introduced. */
  totalCopyCount: number | null
  costedCopyCount: number | null
}

/**
 * The persisted P/L column is retained for compatibility, but readers must
 * withhold it unless every physical copy has a known acquisition cost.
 */
export function getHonestPortfolioSnapshotPnl(
  snapshot: SnapshotPerformanceCoverage,
): number | null {
  return snapshot.totalCopyCount != null &&
    snapshot.totalCopyCount > 0 &&
    snapshot.costedCopyCount === snapshot.totalCopyCount
    ? snapshot.pnl
    : null
}

/**
 * Build the next daily snapshot from acquisition lots. Old rows without lots
 * retain a safe compatibility path through PortfolioItem.purchasePrice during
 * the additive rollout.
 */
export function buildPortfolioSnapshot(
  portfolio: SnapshotPortfolioInput,
): PortfolioSnapshotInput | null {
  if (portfolio.items.length === 0) return null

  let totalJpy = 0
  let totalThb = 0
  let totalCost = 0
  let totalCopyCount = 0
  let costedCopyCount = 0

  for (const item of portfolio.items) {
    const lots = item.lots ?? []
    const quantity =
      lots.length > 0
        ? lots.reduce((sum, lot) => sum + lot.quantity, 0)
        : item.quantity

    totalCopyCount += quantity
    totalJpy += (item.card.latestPriceJpy ?? 0) * quantity
    totalThb += (item.card.latestPriceThb ?? 0) * quantity

    if (lots.length > 0) {
      for (const lot of lots) {
        if (lot.unitCostJpy === null) continue
        totalCost += lot.unitCostJpy * lot.quantity
        costedCopyCount += lot.quantity
      }
    } else if (item.purchasePrice !== null) {
      totalCost += item.purchasePrice * quantity
      costedCopyCount += quantity
    }
  }

  return {
    portfolioId: portfolio.id,
    totalJpy,
    totalThb,
    totalCost,
    // No realized-sale flow exists yet, so deployed cash equals the known cost
    // basis. Coverage fields make partial cost history explicit to readers.
    netInvestedJpy: totalCost,
    // Compatibility value only. Owner-facing readers gate this through
    // getHonestPortfolioSnapshotPnl so unknown cost is never treated as zero.
    pnl: totalJpy - totalCost,
    cardCount: portfolio.items.length,
    totalCopyCount,
    costedCopyCount,
  }
}
