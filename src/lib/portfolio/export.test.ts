import { describe, expect, it } from "vitest"

import { buildPortfolioLotsCsv, type PortfolioExportItem } from "./export"

function holding(
  overrides: Partial<PortfolioExportItem> = {},
): PortfolioExportItem {
  return {
    quantity: 3,
    purchasePrice: 167,
    condition: "NM",
    notes: null,
    lots: [
      {
        id: 10,
        quantity: 1,
        unitCostJpy: 100,
        acquiredAt: new Date("2026-07-01T00:00:00.000Z"),
        note: "first",
        source: "MANUAL",
      },
      {
        id: 11,
        quantity: 2,
        unitCostJpy: 200,
        acquiredAt: null,
        note: null,
        source: "MANUAL",
      },
    ],
    card: {
      cardCode: "OP01-001",
      nameJp: "カード",
      nameEn: 'Luffy, "Leader"',
      rarity: "L",
      latestPriceJpy: 250,
      set: { code: "OP01" },
    },
    ...overrides,
  }
}

describe("buildPortfolioLotsCsv", () => {
  it("keeps separate acquisition prices on separate rows", () => {
    const csv = buildPortfolioLotsCsv([holding()])
    const lines = csv.split("\n")

    expect(lines).toHaveLength(3)
    expect(lines[1]).toContain(",10,MANUAL,1,100,2026-07-01,first,250")
    expect(lines[2]).toContain(",11,MANUAL,2,200,,,250")
    expect(lines[1]).toContain('"Luffy, ""Leader"""')
  })

  it("falls back to one undated opening balance without inventing cost", () => {
    const csv = buildPortfolioLotsCsv([
      holding({
        quantity: 2,
        purchasePrice: null,
        notes: "before lots",
        lots: [],
      }),
    ])

    expect(csv.split("\n")[1]).toContain(
      ",,LEGACY_OPENING_BALANCE,2,,,before lots,250",
    )
  })
})
