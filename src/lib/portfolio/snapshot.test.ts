import { describe, expect, it } from "vitest"

import {
  buildPortfolioSnapshot,
  getHonestPortfolioSnapshotPnl,
} from "./snapshot"

describe("buildPortfolioSnapshot", () => {
  it("returns null for an empty portfolio", () => {
    expect(buildPortfolioSnapshot({ id: 1, items: [] })).toBeNull()
  })

  it("uses exact lot costs and preserves parent holding count", () => {
    expect(
      buildPortfolioSnapshot({
        id: 7,
        items: [
          {
            quantity: 3,
            purchasePrice: 167,
            lots: [
              { quantity: 1, unitCostJpy: 100 },
              { quantity: 2, unitCostJpy: 200 },
            ],
            card: { latestPriceJpy: 250, latestPriceThb: 60 },
          },
        ],
      }),
    ).toEqual({
      portfolioId: 7,
      totalJpy: 750,
      totalThb: 180,
      totalCost: 500,
      netInvestedJpy: 500,
      pnl: 250,
      cardCount: 1,
      totalCopyCount: 3,
      costedCopyCount: 3,
    })
  })

  it("records coverage without treating an unknown lot cost as zero", () => {
    const snapshot = buildPortfolioSnapshot({
      id: 1,
      items: [
        {
          quantity: 2,
          purchasePrice: null,
          lots: [
            { quantity: 1, unitCostJpy: 0 },
            { quantity: 1, unitCostJpy: null },
          ],
          card: { latestPriceJpy: 300, latestPriceThb: null },
        },
      ],
    })

    expect(snapshot).toMatchObject({
      totalCost: 0,
      totalCopyCount: 2,
      costedCopyCount: 1,
      cardCount: 1,
    })
    expect(getHonestPortfolioSnapshotPnl(snapshot!)).toBeNull()
  })

  it("falls back to legacy item cost while lots are not present", () => {
    expect(
      buildPortfolioSnapshot({
        id: 1,
        items: [
          {
            quantity: 2,
            purchasePrice: 125,
            card: { latestPriceJpy: 200, latestPriceThb: 45 },
          },
        ],
      }),
    ).toMatchObject({
      totalJpy: 400,
      totalThb: 90,
      totalCost: 250,
      totalCopyCount: 2,
      costedCopyCount: 2,
    })
  })

  it("exposes snapshot P/L only when every copy has a known cost", () => {
    expect(
      getHonestPortfolioSnapshotPnl({
        pnl: 250,
        totalCopyCount: 3,
        costedCopyCount: 3,
      }),
    ).toBe(250)
    expect(
      getHonestPortfolioSnapshotPnl({
        pnl: 500,
        totalCopyCount: 3,
        costedCopyCount: 2,
      }),
    ).toBeNull()
    expect(
      getHonestPortfolioSnapshotPnl({
        pnl: 500,
        totalCopyCount: null,
        costedCopyCount: null,
      }),
    ).toBeNull()
  })
})
