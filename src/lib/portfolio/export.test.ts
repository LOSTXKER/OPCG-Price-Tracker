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

describe("printing identity in the CSV", () => {
  it("writes the printed card number, never the internal `_p2` suffix", () => {
    const csv = buildPortfolioLotsCsv([
      holding({ card: { ...holding().card, cardCode: "OP09-001_p2", rarity: "P-L" } }),
    ])

    expect(csv).not.toMatch(/_p\d/i)
    expect(csv.split("\n")[1]).toMatch(/^OP09-001,/)
  })

  it("keeps two printings of one number distinguishable via the Printing column", () => {
    // Owner ruling removed `_p1`/`_p2` from everything a person reads — but a
    // spreadsheet has no artwork to fall back on, so the printing is spelled
    // out instead of dropped. OP09-001 really does have two P-L parallels.
    const csv = buildPortfolioLotsCsv([
      holding({ lots: [], card: { ...holding().card, cardCode: "OP09-001_p1", rarity: "P-L" } }),
      holding({ lots: [], card: { ...holding().card, cardCode: "OP09-001_p2", rarity: "P-L" } }),
    ])
    const [header, first, second] = csv.split("\n")

    expect(header.startsWith("Card Code,Printing,Name,")).toBe(true)
    expect(first).toContain("OP09-001,Parallel 1,")
    expect(second).toContain("OP09-001,Parallel 2,")
    expect(first).not.toBe(second)
  })

  it("spells out a reprint and leaves the column empty for a standard print", () => {
    const reprint = buildPortfolioLotsCsv([
      holding({ lots: [], card: { ...holding().card, cardCode: "EB01-006_r1" } }),
    ])
    const standard = buildPortfolioLotsCsv([holding({ lots: [] })])

    expect(reprint.split("\n")[1]).toContain("EB01-006,Reprint 1,")
    expect(standard.split("\n")[1]).toContain("OP01-001,,")
  })
})
