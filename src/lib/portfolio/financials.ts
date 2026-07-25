export type PortfolioFinancialItem = {
  quantity: number
  purchasePrice: number | null
  /**
   * Exact sum of the known acquisition lots for this holding. New lot-aware
   * reads should provide this together with `costedCopyCount`; callers that do
   * not yet include lots continue to fall back to `purchasePrice * quantity`.
   */
  recordedCostJpy?: number
  /** Number of physical copies whose lot cost is known (zero is still known). */
  costedCopyCount?: number
  card: {
    latestPriceJpy: number | null
  }
}

export type PortfolioFinancialRollup = {
  /** Sum of copies whose current market price is known. */
  estimatedValueJpy: number
  /** Sum of copies whose recorded purchase price is known. */
  recordedCostJpy: number
  totalCopyCount: number
  valuedCopyCount: number
  costedCopyCount: number
  valuationComplete: boolean
  performanceComplete: boolean
  pnlJpy: number | null
  roiPct: number | null
}

/**
 * Roll up portfolio money without treating missing prices or costs as zero.
 * Coverage is counted by physical copy because one holding row can represent
 * several cards that all share the same market price and recorded unit cost.
 */
export function getPortfolioFinancials(
  items: readonly PortfolioFinancialItem[],
): PortfolioFinancialRollup {
  let estimatedValueJpy = 0
  let recordedCostJpy = 0
  let totalCopyCount = 0
  let valuedCopyCount = 0
  let costedCopyCount = 0

  for (const item of items) {
    const { quantity } = item
    totalCopyCount += quantity

    if (item.card.latestPriceJpy !== null) {
      estimatedValueJpy += item.card.latestPriceJpy * quantity
      valuedCopyCount += quantity
    }

    if (
      item.recordedCostJpy !== undefined &&
      item.costedCopyCount !== undefined
    ) {
      recordedCostJpy += item.recordedCostJpy
      costedCopyCount += item.costedCopyCount
    } else if (item.purchasePrice !== null) {
      recordedCostJpy += item.purchasePrice * quantity
      costedCopyCount += quantity
    }
  }

  const valuationComplete =
    totalCopyCount > 0 && valuedCopyCount === totalCopyCount
  const performanceComplete =
    valuationComplete && costedCopyCount === totalCopyCount
  const pnlJpy = performanceComplete
    ? estimatedValueJpy - recordedCostJpy
    : null
  const roiPct =
    pnlJpy !== null && recordedCostJpy > 0
      ? (pnlJpy / recordedCostJpy) * 100
      : null

  return {
    estimatedValueJpy,
    recordedCostJpy,
    totalCopyCount,
    valuedCopyCount,
    costedCopyCount,
    valuationComplete,
    performanceComplete,
    pnlJpy,
    roiPct,
  }
}
