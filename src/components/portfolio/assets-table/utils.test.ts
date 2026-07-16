import { describe, expect, it } from "vitest"

import type { AssetRow } from "@/lib/types/portfolio"

import { pnlCalc, sortAssets } from "./utils"

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
    purchasePrice: 100,
    currentPrice: 200,
    currentPriceThb: null,
    priceChange24h: null,
    priceChange7d: null,
    condition: "NM",
    notes: null,
    game: null,
    ...overrides,
  }
}

describe("portfolio asset P/L", () => {
  it("keeps absolute P/L but leaves ROI undefined when recorded cost is zero", () => {
    expect(pnlCalc(asset({ purchasePrice: 0, currentPrice: 300, quantity: 2 }))).toEqual({
      pnl: 600,
      pct: null,
    })
  })

  it("sorts holdings with undefined ROI after comparable holdings in either direction", () => {
    const gain = asset({ itemId: 1, purchasePrice: 100, currentPrice: 200 })
    const loss = asset({ itemId: 2, purchasePrice: 100, currentPrice: 50 })
    const zeroCost = asset({ itemId: 3, purchasePrice: 0, currentPrice: 300 })

    expect(sortAssets([zeroCost, loss, gain], "pnl", "desc").map((row) => row.itemId)).toEqual([
      1,
      2,
      3,
    ])
    expect(sortAssets([zeroCost, gain, loss], "pnl", "asc").map((row) => row.itemId)).toEqual([
      2,
      1,
      3,
    ])
  })
})
