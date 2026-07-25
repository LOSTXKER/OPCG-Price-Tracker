import { describe, expect, it } from "vitest"

import type { AssetRow } from "@/lib/types/portfolio"

import { getMoverSwingJpy, getPortfolioMovers } from "./portfolio-movers"

function asset(overrides: Partial<AssetRow> = {}): AssetRow {
  return {
    itemId: 1,
    cardId: 1,
    cardCode: "OP01-001",
    baseCode: "OP01-001",
    nameJp: "カード",
    nameEn: "Card",
    rarity: "R",
    imageUrl: null,
    quantity: 1,
    lots: [],
    lotCount: 1,
    recordedCostJpy: 100,
    costedCopyCount: 1,
    purchasePrice: 100,
    currentPrice: 200,
    currentPriceThb: null,
    priceChange24h: 100,
    priceChange7d: null,
    condition: "NM",
    notes: null,
    game: null,
    ...overrides,
  }
}

describe("portfolio movers", () => {
  it("derives the money move from the previous price, not the current price", () => {
    expect(getMoverSwingJpy(200, 100, 1)).toBe(100)
    expect(getMoverSwingJpy(90, -10, 2)).toBeCloseTo(-20)
    expect(getMoverSwingJpy(0, -100, 1)).toBeNull()
  })

  it("sorts by absolute money impact and respects the requested limit", () => {
    const movers = getPortfolioMovers(
      [
        asset({ itemId: 1, currentPrice: 110, priceChange24h: 10 }),
        asset({ itemId: 2, currentPrice: 300, priceChange24h: 20 }),
        asset({ itemId: 3, currentPrice: 90, priceChange24h: -10, quantity: 6 }),
      ],
      2,
    )

    expect(movers.map((mover) => mover.row.itemId)).toEqual([3, 2])
    expect(movers).toHaveLength(2)
  })

  it("keeps percentage-only movement honest when price data is unavailable", () => {
    const [mover] = getPortfolioMovers([
      asset({ currentPrice: null, priceChange24h: 12 }),
    ])

    expect(mover?.pct).toBe(12)
    expect(mover?.swingJpy).toBeNull()
  })
})
