import { describe, expect, it } from "vitest"

import { getPortfolioFinancials } from "./financials"

function item({
  quantity = 1,
  price,
  cost,
}: {
  quantity?: number
  price: number | null
  cost: number | null
}) {
  return {
    quantity,
    purchasePrice: cost,
    card: { latestPriceJpy: price },
  }
}

describe("getPortfolioFinancials", () => {
  it("keeps an empty portfolio incomplete", () => {
    expect(getPortfolioFinancials([])).toEqual({
      estimatedValueJpy: 0,
      recordedCostJpy: 0,
      totalCopyCount: 0,
      valuedCopyCount: 0,
      costedCopyCount: 0,
      valuationComplete: false,
      performanceComplete: false,
      pnlJpy: null,
      roiPct: null,
    })
  })

  it("rolls up complete holdings by physical copy", () => {
    expect(
      getPortfolioFinancials([
        item({ quantity: 2, price: 150, cost: 100 }),
        item({ quantity: 1, price: 300, cost: 200 }),
      ]),
    ).toEqual({
      estimatedValueJpy: 600,
      recordedCostJpy: 400,
      totalCopyCount: 3,
      valuedCopyCount: 3,
      costedCopyCount: 3,
      valuationComplete: true,
      performanceComplete: true,
      pnlJpy: 200,
      roiPct: 50,
    })
  })

  it("keeps known value but withholds performance when a market price is missing", () => {
    expect(
      getPortfolioFinancials([
        item({ quantity: 2, price: 150, cost: 100 }),
        item({ quantity: 1, price: null, cost: 200 }),
      ]),
    ).toEqual({
      estimatedValueJpy: 300,
      recordedCostJpy: 400,
      totalCopyCount: 3,
      valuedCopyCount: 2,
      costedCopyCount: 3,
      valuationComplete: false,
      performanceComplete: false,
      pnlJpy: null,
      roiPct: null,
    })
  })

  it("keeps recorded cost but withholds performance when a cost is missing", () => {
    expect(
      getPortfolioFinancials([
        item({ quantity: 2, price: 150, cost: 100 }),
        item({ quantity: 1, price: 300, cost: null }),
      ]),
    ).toEqual({
      estimatedValueJpy: 600,
      recordedCostJpy: 200,
      totalCopyCount: 3,
      valuedCopyCount: 3,
      costedCopyCount: 2,
      valuationComplete: true,
      performanceComplete: false,
      pnlJpy: null,
      roiPct: null,
    })
  })

  it("treats zero price and zero cost as known values", () => {
    expect(
      getPortfolioFinancials([item({ quantity: 2, price: 0, cost: 0 })]),
    ).toEqual({
      estimatedValueJpy: 0,
      recordedCostJpy: 0,
      totalCopyCount: 2,
      valuedCopyCount: 2,
      costedCopyCount: 2,
      valuationComplete: true,
      performanceComplete: true,
      pnlJpy: 0,
      roiPct: null,
    })
  })

  it("returns profit but no ROI when complete recorded cost is zero", () => {
    const result = getPortfolioFinancials([
      item({ quantity: 2, price: 150, cost: 0 }),
    ])

    expect(result.performanceComplete).toBe(true)
    expect(result.pnlJpy).toBe(300)
    expect(result.roiPct).toBeNull()
  })
})
