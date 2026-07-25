import { describe, expect, it } from "vitest"

import type { AssetRow } from "@/lib/types/portfolio"

import { t } from "@/lib/i18n"

import {
  formatPurchaseRowDate,
  formatPurchaseRowQuantity,
  getPurchaseRowLabel,
  getPurchaseRowEditTarget,
  getStablePurchaseLotNumber,
  holdingCost,
  mapAssetsToPurchaseRows,
  matchesPurchaseRow,
  parseCostValue,
  pnlCalc,
  purchaseRowPnlCalc,
  resolveUnitCostJpy,
  sortAssets,
  sortPurchaseRows,
} from "./utils"

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
    priceChange24h: null,
    priceChange7d: null,
    condition: "NM",
    notes: null,
    game: null,
    ...overrides,
  }
}

describe("purchase-row presentation", () => {
  it("formats the number of physical cards in readable localized language", () => {
    expect(formatPurchaseRowQuantity(1, "TH")).toBe("1 ใบ")
    expect(formatPurchaseRowQuantity(1, "EN")).toBe("1 card")
    expect(formatPurchaseRowQuantity(2, "EN")).toBe("2 cards")
    expect(formatPurchaseRowQuantity(2, "JP")).toBe("2枚")
  })

  it("keeps the full year on desktop and drops a same-year one on mobile", () => {
    const year = new Date().getUTCFullYear()
    const thisYear = `${year}-03-14T00:00:00.000Z`
    const older = `${year - 3}-03-14T00:00:00.000Z`

    expect(formatPurchaseRowDate(thisYear, "EN")).toContain(String(year))
    // compact: this year needs no year at all…
    expect(formatPurchaseRowDate(thisYear, "EN", "compact")).not.toMatch(/\d{4}/)
    expect(formatPurchaseRowDate(thisYear, "EN", "compact")).toContain("14")
    // …an older purchase still says which year, in two digits.
    expect(formatPurchaseRowDate(older, "EN", "compact")).toContain(
      String(year - 3).slice(-2),
    )
    expect(formatPurchaseRowDate(older, "EN", "compact")).not.toContain(
      String(year - 3),
    )
    expect(formatPurchaseRowDate(null, "TH", "compact")).toBe(
      t("TH", "dateNotSpecified"),
    )
  })
})

describe("portfolio asset P/L", () => {
  it("uses the exact sum of separate purchase lots instead of a rounded average", () => {
    const row = asset({
      quantity: 3,
      purchasePrice: 167,
      recordedCostJpy: 500,
      costedCopyCount: 3,
      currentPrice: 300,
      lots: [
        {
          id: 1,
          quantity: 1,
          unitCostJpy: 100,
          acquiredAt: null,
          note: null,
          source: "MANUAL",
          createdAt: "2026-07-23T00:00:00.000Z",
          updatedAt: "2026-07-23T00:00:00.000Z",
        },
        {
          id: 2,
          quantity: 2,
          unitCostJpy: 200,
          acquiredAt: null,
          note: null,
          source: "MANUAL",
          createdAt: "2026-07-23T00:00:00.000Z",
          updatedAt: "2026-07-23T00:00:00.000Z",
        },
      ],
      lotCount: 2,
    })

    expect(holdingCost(row)).toBe(500)
    expect(pnlCalc(row)).toEqual({ pnl: 400, pct: 80 })
  })

  it("does not calculate P/L while any purchase lot still has unknown cost", () => {
    const row = asset({
      quantity: 2,
      purchasePrice: null,
      recordedCostJpy: 100,
      costedCopyCount: 1,
      currentPrice: 300,
    })

    expect(holdingCost(row)).toBeNull()
    expect(pnlCalc(row)).toBeNull()
  })

  it("computes the displayed holding cost from per-card cost and quantity", () => {
    expect(
      holdingCost(
        asset({
          purchasePrice: 125,
          quantity: 3,
          recordedCostJpy: 375,
          costedCopyCount: 3,
        }),
      ),
    ).toBe(375)
    expect(
      holdingCost(
        asset({
          purchasePrice: null,
          quantity: 3,
          recordedCostJpy: 250,
          costedCopyCount: 2,
        }),
      ),
    ).toBeNull()
  })

  it("keeps absolute P/L but leaves ROI undefined when recorded cost is zero", () => {
    expect(
      pnlCalc(
        asset({
          purchasePrice: 0,
          currentPrice: 300,
          quantity: 2,
          recordedCostJpy: 0,
          costedCopyCount: 2,
        }),
      ),
    ).toEqual({ pnl: 600, pct: null })
  })

  it("sorts the primary P/L amount and keeps missing comparisons last", () => {
    const gain = asset({ itemId: 1, recordedCostJpy: 100, currentPrice: 200 })
    const loss = asset({ itemId: 2, recordedCostJpy: 100, currentPrice: 50 })
    const zeroCost = asset({ itemId: 3, purchasePrice: 0, recordedCostJpy: 0, currentPrice: 300 })
    const unknown = asset({
      itemId: 4,
      purchasePrice: null,
      recordedCostJpy: 0,
      costedCopyCount: 0,
      currentPrice: 500,
    })

    expect(
      sortAssets([unknown, zeroCost, loss, gain], "pnl", "desc").map((row) => row.itemId),
    ).toEqual([3, 1, 2, 4])
    expect(
      sortAssets([unknown, zeroCost, gain, loss], "pnl", "asc").map((row) => row.itemId),
    ).toEqual([2, 1, 3, 4])
  })

  it("sorts unknown costs after recorded costs in either direction", () => {
    const low = asset({ itemId: 1, purchasePrice: 50, quantity: 2, recordedCostJpy: 100, costedCopyCount: 2 })
    const high = asset({ itemId: 2, purchasePrice: 200, quantity: 2, recordedCostJpy: 400, costedCopyCount: 2 })
    const unknown = asset({ itemId: 3, purchasePrice: null, recordedCostJpy: 0, costedCopyCount: 0 })

    expect(sortAssets([unknown, low, high], "cost", "desc").map((row) => row.itemId)).toEqual([
      2,
      1,
      3,
    ])
    expect(sortAssets([unknown, high, low], "cost", "asc").map((row) => row.itemId)).toEqual([
      1,
      2,
      3,
    ])
  })

  it("keeps missing market prices last in either direction", () => {
    const low = asset({ itemId: 1, currentPrice: 50 })
    const high = asset({ itemId: 2, currentPrice: 200 })
    const unknown = asset({ itemId: 3, currentPrice: null })

    expect(sortAssets([unknown, low, high], "price", "desc").map((row) => row.itemId)).toEqual([
      2,
      1,
      3,
    ])
    expect(sortAssets([unknown, high, low], "price", "asc").map((row) => row.itemId)).toEqual([
      1,
      2,
      3,
    ])
  })
})

describe("portfolio purchase rows", () => {
  it("maps each acquisition lot to a separate stable row", () => {
    const rows = mapAssetsToPurchaseRows([
      asset({
        quantity: 3,
        lots: [
          {
            id: 11,
            quantity: 1,
            unitCostJpy: 100,
            acquiredAt: "2026-07-20T00:00:00.000Z",
            note: "first copy",
            source: "MANUAL",
            createdAt: "2026-07-20T00:00:00.000Z",
            updatedAt: "2026-07-20T00:00:00.000Z",
          },
          {
            id: 12,
            quantity: 2,
            unitCostJpy: 250,
            acquiredAt: null,
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-21T00:00:00.000Z",
            updatedAt: "2026-07-21T00:00:00.000Z",
          },
        ],
        lotCount: 2,
      }),
    ])

    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.rowKey)).toEqual([
      "holding:1:lot:11",
      "holding:1:lot:12",
    ])
    expect(rows.map((row) => row.lotId)).toEqual([11, 12])
    expect(rows.map((row) => row.lotIndex)).toEqual([1, 2])
    expect(rows.map((row) => row.quantity)).toEqual([1, 2])
    expect(rows.map((row) => row.unitCostJpy)).toEqual([100, 250])
    expect(rows[0]).toMatchObject({
      lotIndex: 1,
      purchaseCount: 2,
      purchaseNote: "first copy",
      isCompatibilityRow: false,
    })
    expect(getPurchaseRowLabel(rows[0], "EN")).toBe("Purchase #1")
    expect(getPurchaseRowLabel(rows[1], "EN")).toBe("Purchase #2")
    expect(getPurchaseRowEditTarget(rows[1])).toEqual({
      itemId: 1,
      initialLotId: 12,
    })
  })

  it("keeps one opening-balance compatibility row when lots are absent", () => {
    const [row] = mapAssetsToPurchaseRows([
      asset({
        quantity: 3,
        lots: [],
        lotCount: 0,
        purchasePrice: 125,
      }),
    ])

    expect(row).toMatchObject({
      rowKey: "holding:1:compat",
      lotId: null,
      lotIndex: 1,
      purchaseCount: 1,
      isCompatibilityRow: true,
      source: "LEGACY_OPENING_BALANCE",
      quantity: 3,
      unitCostJpy: 125,
    })
    expect(getPurchaseRowLabel(row, "TH")).toBe("ยอดตั้งต้น")
  })

  it("keeps purchase numbers stable when acquired dates reorder the API list", () => {
    const openingBalance = {
      id: 70,
      quantity: 1,
      unitCostJpy: 100,
      acquiredAt: null,
      note: null,
      source: "LEGACY_OPENING_BALANCE" as const,
      createdAt: "2026-07-20T00:00:00.000Z",
      updatedAt: "2026-07-20T00:00:00.000Z",
    }
    const firstPurchase = {
      id: 71,
      quantity: 1,
      unitCostJpy: 150,
      acquiredAt: "2026-07-23T00:00:00.000Z",
      note: null,
      source: "MANUAL" as const,
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z",
    }
    const secondPurchase = {
      id: 72,
      quantity: 1,
      unitCostJpy: 200,
      acquiredAt: "2026-07-22T00:00:00.000Z",
      note: null,
      source: "MANUAL" as const,
      createdAt: "2026-07-22T00:00:00.000Z",
      updatedAt: "2026-07-22T00:00:00.000Z",
    }
    const initialLots = [firstPurchase, secondPurchase, openingBalance]
    const reorderedLots = [
      { ...secondPurchase, acquiredAt: "2026-07-24T00:00:00.000Z" },
      { ...firstPurchase, acquiredAt: "2026-07-18T00:00:00.000Z" },
      openingBalance,
    ]

    const initialRows = mapAssetsToPurchaseRows([
      asset({ quantity: 3, lots: initialLots, lotCount: 3 }),
    ])
    const reorderedRows = mapAssetsToPurchaseRows([
      asset({ quantity: 3, lots: reorderedLots, lotCount: 3 }),
    ])
    const initialNumbers = new Map(
      initialRows.map((row) => [row.lotId, row.lotIndex]),
    )
    const reorderedNumbers = new Map(
      reorderedRows.map((row) => [row.lotId, row.lotIndex]),
    )

    expect(initialNumbers.get(71)).toBe(1)
    expect(initialNumbers.get(72)).toBe(2)
    expect(reorderedNumbers.get(71)).toBe(1)
    expect(reorderedNumbers.get(72)).toBe(2)
    expect(getStablePurchaseLotNumber(reorderedLots, 70)).toBeNull()
    expect(getStablePurchaseLotNumber(reorderedLots, 71)).toBe(1)
    expect(getStablePurchaseLotNumber(reorderedLots, 72)).toBe(2)
  })

  it("calculates P/L per purchase quantity and preserves unknown/free semantics", () => {
    const [known, unknown, free] = mapAssetsToPurchaseRows([
      asset({
        currentPrice: 300,
        quantity: 4,
        lots: [
          {
            id: 21,
            quantity: 2,
            unitCostJpy: 100,
            acquiredAt: null,
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-20T00:00:00.000Z",
            updatedAt: "2026-07-20T00:00:00.000Z",
          },
          {
            id: 22,
            quantity: 1,
            unitCostJpy: null,
            acquiredAt: null,
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-21T00:00:00.000Z",
            updatedAt: "2026-07-21T00:00:00.000Z",
          },
          {
            id: 23,
            quantity: 1,
            unitCostJpy: 0,
            acquiredAt: null,
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-22T00:00:00.000Z",
            updatedAt: "2026-07-22T00:00:00.000Z",
          },
        ],
        lotCount: 3,
      }),
    ])

    expect(purchaseRowPnlCalc(known)).toEqual({ pnl: 400, pct: 200 })
    expect(purchaseRowPnlCalc(unknown)).toBeNull()
    expect(purchaseRowPnlCalc(free)).toEqual({ pnl: 300, pct: null })
  })

  it("sorts by unit cost or row P/L and leaves unknown comparisons last", () => {
    const rows = mapAssetsToPurchaseRows([
      asset({
        currentPrice: 300,
        quantity: 4,
        lots: [
          {
            id: 31,
            quantity: 2,
            unitCostJpy: 250,
            acquiredAt: null,
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-20T00:00:00.000Z",
            updatedAt: "2026-07-20T00:00:00.000Z",
          },
          {
            id: 32,
            quantity: 1,
            unitCostJpy: null,
            acquiredAt: null,
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-21T00:00:00.000Z",
            updatedAt: "2026-07-21T00:00:00.000Z",
          },
          {
            id: 33,
            quantity: 1,
            unitCostJpy: 100,
            acquiredAt: null,
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-22T00:00:00.000Z",
            updatedAt: "2026-07-22T00:00:00.000Z",
          },
        ],
        lotCount: 3,
      }),
    ])

    expect(
      sortPurchaseRows(rows, "cost", "asc").map((row) => row.lotId),
    ).toEqual([33, 31, 32])
    expect(
      sortPurchaseRows(rows, "pnl", "desc").map((row) => row.lotId),
    ).toEqual([33, 31, 32])
  })

  it("sorts numeric keys globally across holdings", () => {
    const rows = mapAssetsToPurchaseRows([
      asset({
        itemId: 1,
        quantity: 2,
        lots: [
          {
            id: 41,
            quantity: 1,
            unitCostJpy: 1_000,
            acquiredAt: null,
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-23T00:00:00.000Z",
            updatedAt: "2026-07-23T00:00:00.000Z",
          },
          {
            id: 42,
            quantity: 1,
            unitCostJpy: 100,
            acquiredAt: null,
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-21T00:00:00.000Z",
            updatedAt: "2026-07-21T00:00:00.000Z",
          },
        ],
      }),
      asset({
        itemId: 2,
        cardId: 2,
        lots: [
          {
            id: 43,
            quantity: 1,
            unitCostJpy: 500,
            acquiredAt: null,
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-22T00:00:00.000Z",
            updatedAt: "2026-07-22T00:00:00.000Z",
          },
        ],
      }),
    ])

    expect(
      sortPurchaseRows(rows, "cost", "desc").map((row) => row.lotId),
    ).toEqual([41, 43, 42])
  })

  it("sorts purchase dates globally instead of keeping holdings grouped", () => {
    const rows = mapAssetsToPurchaseRows([
      asset({
        itemId: 1,
        quantity: 2,
        lots: [
          {
            id: 51,
            quantity: 1,
            unitCostJpy: 100,
            acquiredAt: "2026-07-20T00:00:00.000Z",
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-20T00:00:00.000Z",
            updatedAt: "2026-07-20T00:00:00.000Z",
          },
          {
            id: 52,
            quantity: 1,
            unitCostJpy: 100,
            acquiredAt: "2026-07-23T00:00:00.000Z",
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-23T00:00:00.000Z",
            updatedAt: "2026-07-23T00:00:00.000Z",
          },
        ],
        lotCount: 2,
      }),
      asset({
        itemId: 2,
        cardId: 2,
        cardCode: "OP01-002",
        baseCode: "OP01-002",
        lots: [
          {
            id: 53,
            quantity: 1,
            unitCostJpy: 100,
            acquiredAt: "2026-07-22T00:00:00.000Z",
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-22T00:00:00.000Z",
            updatedAt: "2026-07-22T00:00:00.000Z",
          },
        ],
      }),
    ])

    expect(
      sortPurchaseRows(rows, "date", "desc").map((row) => row.lotId),
    ).toEqual([52, 53, 51])
  })

  it("uses creation time and id as deterministic date-sort fallbacks", () => {
    const rows = mapAssetsToPurchaseRows([
      asset({
        itemId: 1,
        lots: [
          {
            id: 61,
            quantity: 1,
            unitCostJpy: 100,
            acquiredAt: null,
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-24T00:00:00.000Z",
            updatedAt: "2026-07-24T00:00:00.000Z",
          },
        ],
      }),
      asset({
        itemId: 2,
        cardId: 2,
        lots: [
          {
            id: 62,
            quantity: 1,
            unitCostJpy: 100,
            acquiredAt: "2026-07-22T00:00:00.000Z",
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-23T00:00:00.000Z",
            updatedAt: "2026-07-23T00:00:00.000Z",
          },
        ],
      }),
      asset({
        itemId: 3,
        cardId: 3,
        lots: [
          {
            id: 63,
            quantity: 1,
            unitCostJpy: 100,
            acquiredAt: "2026-07-22T00:00:00.000Z",
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-24T00:00:00.000Z",
            updatedAt: "2026-07-24T00:00:00.000Z",
          },
        ],
      }),
      asset({
        itemId: 4,
        cardId: 4,
        lots: [
          {
            id: 64,
            quantity: 1,
            unitCostJpy: 100,
            acquiredAt: null,
            note: null,
            source: "MANUAL",
            createdAt: "2026-07-23T00:00:00.000Z",
            updatedAt: "2026-07-23T00:00:00.000Z",
          },
        ],
      }),
    ])

    expect(
      sortPurchaseRows(rows, "date", "desc").map((row) => row.lotId),
    ).toEqual([63, 62, 61, 64])
    expect(
      sortPurchaseRows([...rows].reverse(), "date", "desc").map(
        (row) => row.lotId,
      ),
    ).toEqual([63, 62, 61, 64])
  })

  it("matches card identity and purchase notes", () => {
    const [row] = mapAssetsToPurchaseRows([
      asset({
        lots: [
          {
            id: 41,
            quantity: 1,
            unitCostJpy: 100,
            acquiredAt: null,
            note: "Bought at Osaka event",
            source: "MANUAL",
            createdAt: "2026-07-20T00:00:00.000Z",
            updatedAt: "2026-07-20T00:00:00.000Z",
          },
        ],
      }),
    ])

    expect(matchesPurchaseRow(row, "card", "EN")).toBe(true)
    expect(matchesPurchaseRow(row, "op01-001", "TH")).toBe(true)
    expect(matchesPurchaseRow(row, "osaka", "EN")).toBe(true)
    expect(matchesPurchaseRow(row, "tokyo", "EN")).toBe(false)
  })
})

describe("portfolio purchase cost conversion", () => {
  it("keeps decimals while parsing a display-currency cost", () => {
    expect(parseCostValue("0.68")).toBe(0.68)
    expect(parseCostValue(" 21.25 ")).toBe(21.25)
    expect(parseCostValue("not-a-number")).toBeUndefined()
  })

  it("preserves the exact JPY cost when a USD field was not edited", () => {
    expect(
      resolveUnitCostJpy({
        parsedDisplayCost: 0.68,
        currency: "USD",
        originalUnitCostJpy: 102,
        costEdited: false,
      }),
    ).toBe(102)

    // If the user intentionally edits the visible USD value, conversion is
    // applied once at the JPY boundary.
    expect(
      resolveUnitCostJpy({
        parsedDisplayCost: 0.68,
        currency: "USD",
        originalUnitCostJpy: 102,
        costEdited: true,
      }),
    ).toBe(101)
  })
})
