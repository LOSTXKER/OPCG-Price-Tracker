import { describe, expect, it } from "vitest"

import type {
  AssetRow,
  HistoryPoint,
  PortfolioStats,
} from "@/lib/types/portfolio"

import {
  filterPortfolioHistoryByDays,
  getAsset24hImpactJpy,
  getPortfolio24hPerformance,
  getPortfolioConcentration,
  getPortfolioTrackedSpan,
  mergePortfolioHistoryWithLive,
} from "./insights"

function stats(overrides: Partial<PortfolioStats> = {}): PortfolioStats {
  return {
    estimatedValueJpy: 300,
    recordedCostJpy: 200,
    totalCopyCount: 2,
    valuedCopyCount: 2,
    costedCopyCount: 2,
    valuationComplete: true,
    performanceComplete: true,
    pnlJpy: 100,
    roiPct: 50,
    totalValueJpy: 300,
    totalCostJpy: 200,
    unrealizedPnl: 100,
    unrealizedPnlPercent: 50,
    bestPerformer: null,
    worstPerformer: null,
    ...overrides,
  }
}

function historyPoint(date: string, value = 100): HistoryPoint {
  return {
    label: date.slice(5, 10),
    date,
    value,
    cost: 80,
    netInvested: 80,
    cardCount: 1,
    isInflow: false,
  }
}

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

describe("mergePortfolioHistoryWithLive", () => {
  const now = new Date("2026-07-20T06:00:00.000Z")

  it("starts with one truthful live point when no snapshots exist", () => {
    const result = mergePortfolioHistoryWithLive([], stats(), {
      now,
      liveLabel: "วันนี้",
      timeZone: "Asia/Bangkok",
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      label: "วันนี้",
      value: 300,
      source: "live",
      valuationStatus: "complete",
      valuationCoverage: {
        totalCopyCount: 2,
        coveredCopyCount: 2,
        complete: true,
      },
    })
  })

  it("marks a partially-valued live point with copy coverage", () => {
    const [point] = mergePortfolioHistoryWithLive(
      [],
      stats({
        estimatedValueJpy: 120,
        totalValueJpy: 120,
        totalCopyCount: 4,
        valuedCopyCount: 1,
        valuationComplete: false,
        performanceComplete: false,
        pnlJpy: null,
        roiPct: null,
      }),
      { now, timeZone: "UTC" },
    )

    expect(point).toMatchObject({
      value: 120,
      source: "live",
      valuationStatus: "partial",
      valuationCoverage: {
        totalCopyCount: 4,
        coveredCopyCount: 1,
        percent: 25,
        complete: false,
      },
    })
  })

  it("does not invent a zero point when no copy has a known price", () => {
    expect(
      mergePortfolioHistoryWithLive(
        [],
        stats({
          estimatedValueJpy: 0,
          totalValueJpy: 0,
          valuedCopyCount: 0,
          valuationComplete: false,
          performanceComplete: false,
          pnlJpy: null,
          roiPct: null,
        }),
        { now, timeZone: "UTC" },
      ),
    ).toEqual([])
  })

  it("keeps a real known zero valuation", () => {
    const result = mergePortfolioHistoryWithLive(
      [],
      stats({
        estimatedValueJpy: 0,
        totalValueJpy: 0,
        totalCopyCount: 1,
        valuedCopyCount: 1,
      }),
      { now, timeZone: "UTC" },
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.value).toBe(0)
  })

  it("replaces the latest point on the same calendar day instead of duplicating it", () => {
    const result = mergePortfolioHistoryWithLive(
      [
        historyPoint("2026-07-19T20:00:00.000Z", 100),
        historyPoint("2026-07-20T01:00:00.000Z", 150),
      ],
      stats(),
      { now, timeZone: "Asia/Bangkok" },
    )

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ source: "live", value: 300 })
  })

  it("adds live value after exactly one older snapshot", () => {
    const result = mergePortfolioHistoryWithLive(
      [historyPoint("2026-07-19T06:00:00.000Z", 190)],
      stats(),
      { now, timeZone: "UTC" },
    )

    expect(result.map((point) => [point.source, point.value])).toEqual([
      ["snapshot", 190],
      ["live", 300],
    ])
  })

  it("marks an added uncosted copy as an inflow when copy coverage is available", () => {
    const previous = {
      ...historyPoint("2026-07-19T06:00:00.000Z", 190),
      totalCopyCount: 1,
      costedCopyCount: 1,
    }
    const result = mergePortfolioHistoryWithLive(
      [previous],
      stats({
        totalCopyCount: 2,
        valuedCopyCount: 2,
        costedCopyCount: 1,
        recordedCostJpy: previous.netInvested,
      }),
      { now, timeZone: "UTC" },
    )

    expect(result.at(-1)).toMatchObject({
      source: "live",
      totalCopyCount: 2,
      costedCopyCount: 1,
      isInflow: true,
    })
  })

  it("does not mark a late cost-only edit as a live inflow", () => {
    const previous = {
      ...historyPoint("2026-07-19T06:00:00.000Z", 190),
      totalCopyCount: 2,
      costedCopyCount: 1,
    }
    const result = mergePortfolioHistoryWithLive(
      [previous],
      stats({
        totalCopyCount: 2,
        valuedCopyCount: 2,
        costedCopyCount: 2,
        recordedCostJpy: previous.netInvested + 100,
      }),
      { now, timeZone: "UTC" },
    )

    expect(result.at(-1)).toMatchObject({
      source: "live",
      totalCopyCount: 2,
      costedCopyCount: 2,
      isInflow: false,
    })
  })

  it("merges one or many older snapshots in chronological order", () => {
    const result = mergePortfolioHistoryWithLive(
      [
        historyPoint("2026-07-19T06:00:00.000Z", 190),
        historyPoint("2026-07-17T06:00:00.000Z", 170),
        historyPoint("2026-07-18T06:00:00.000Z", 180),
      ],
      stats(),
      { now, timeZone: "UTC" },
    )

    expect(result.map((point) => point.value)).toEqual([170, 180, 190, 300])
    expect(result.map((point) => point.source)).toEqual([
      "snapshot",
      "snapshot",
      "snapshot",
      "live",
    ])
  })
})

describe("portfolio history range and tracked span", () => {
  it("filters a sparse series by real elapsed days, not point count", () => {
    const points = [
      historyPoint("2026-07-01T12:00:00.000Z"),
      historyPoint("2026-07-12T12:00:00.000Z"),
      historyPoint("2026-07-18T12:00:00.000Z"),
      historyPoint("2026-07-20T12:00:00.000Z"),
    ]

    expect(
      filterPortfolioHistoryByDays(
        points,
        7,
        new Date("2026-07-20T12:00:00.000Z"),
      ).map((point) => point.date),
    ).toEqual([
      "2026-07-18T12:00:00.000Z",
      "2026-07-20T12:00:00.000Z",
    ])
  })

  it("reports empty, single-day, and multi-day spans", () => {
    expect(getPortfolioTrackedSpan([])).toEqual({
      startedAt: null,
      latestAt: null,
      daySpan: 0,
      pointCount: 0,
      snapshotCount: 0,
    })

    const live = mergePortfolioHistoryWithLive([], stats(), {
      now: new Date("2026-07-20T06:00:00.000Z"),
      timeZone: "UTC",
    })
    expect(getPortfolioTrackedSpan(live, { timeZone: "UTC" })).toMatchObject({
      daySpan: 1,
      pointCount: 1,
      snapshotCount: 0,
    })

    const span = getPortfolioTrackedSpan(
      [
        historyPoint("2026-07-18T20:00:00.000Z"),
        historyPoint("2026-07-20T01:00:00.000Z"),
      ],
      { timeZone: "Asia/Bangkok" },
    )
    expect(span).toMatchObject({
      startedAt: "2026-07-18T20:00:00.000Z",
      latestAt: "2026-07-20T01:00:00.000Z",
      daySpan: 2,
      pointCount: 2,
      snapshotCount: 2,
    })
  })
})

describe("getPortfolioConcentration", () => {
  it("groups conditions by card id before calculating Top 1 and Top 3", () => {
    const result = getPortfolioConcentration([
      asset({ itemId: 1, cardId: 1, quantity: 1, currentPrice: 100 }),
      asset({ itemId: 2, cardId: 1, quantity: 2, currentPrice: 100, condition: "LP" }),
      asset({ itemId: 3, cardId: 2, cardCode: "OP01-002", currentPrice: 200 }),
      asset({ itemId: 4, cardId: 3, cardCode: "OP01-003", currentPrice: 150 }),
      asset({ itemId: 5, cardId: 4, cardCode: "OP01-004", currentPrice: 50 }),
    ])

    expect(result.groups.map((group) => [group.cardId, group.quantity])).toEqual([
      [1, 3],
      [2, 1],
      [3, 1],
      [4, 1],
    ])
    expect(result.totalValueJpy).toBe(700)
    expect(result.top1ValueJpy).toBe(300)
    expect(result.top3ValueJpy).toBe(650)
    expect(result.top1Percent).toBeCloseTo((300 / 700) * 100)
    expect(result.top3Percent).toBeCloseTo((650 / 700) * 100)
  })

  it("withholds concentration percentages when any physical copy is unvalued", () => {
    const result = getPortfolioConcentration([
      asset({ quantity: 2, currentPrice: 100 }),
      asset({ itemId: 2, cardId: 2, quantity: 3, currentPrice: null }),
    ])

    expect(result.coverage).toMatchObject({
      totalCopyCount: 5,
      coveredCopyCount: 2,
      percent: 40,
      complete: false,
    })
    expect(result.top1Percent).toBeNull()
    expect(result.top3Percent).toBeNull()
  })

  it("counts a zero market price as covered", () => {
    const result = getPortfolioConcentration([
      asset({ currentPrice: 0, quantity: 2 }),
    ])

    expect(result.coverage.complete).toBe(true)
    expect(result.totalValueJpy).toBe(0)
    expect(result.top1Percent).toBeNull()
  })
})

describe("getPortfolio24hPerformance", () => {
  it("reconstructs aggregate impact and return from current prices", () => {
    const result = getPortfolio24hPerformance([
      asset({ currentPrice: 200, priceChange24h: 100, quantity: 1 }),
      asset({ itemId: 2, cardId: 2, currentPrice: 90, priceChange24h: -10, quantity: 2 }),
    ])

    expect(result.coverage.complete).toBe(true)
    expect(result.currentValueJpy).toBe(380)
    expect(result.previousValueJpy).toBeCloseTo(300)
    expect(result.impactJpy).toBeCloseTo(80)
    expect(result.returnPct).toBeCloseTo((80 / 300) * 100)
  })

  it("withholds aggregate movement unless every copy is covered", () => {
    const result = getPortfolio24hPerformance([
      asset({ quantity: 2, currentPrice: 200, priceChange24h: 10 }),
      asset({ itemId: 2, cardId: 2, quantity: 3, priceChange24h: null }),
    ])

    expect(result.coverage).toMatchObject({
      totalCopyCount: 5,
      coveredCopyCount: 2,
      percent: 40,
      complete: false,
    })
    expect(result.impactJpy).toBeNull()
    expect(result.returnPct).toBeNull()
    expect(result.currentValueJpy).toBeNull()
    expect(result.previousValueJpy).toBeNull()
  })

  it("treats a real 0% move as complete data", () => {
    const result = getPortfolio24hPerformance([
      asset({ currentPrice: 100, priceChange24h: 0, quantity: 2 }),
    ])

    expect(result.coverage.complete).toBe(true)
    expect(result.impactJpy).toBe(0)
    expect(result.returnPct).toBe(0)
  })

  it("keeps a non-reconstructable -100% move uncovered", () => {
    expect(getAsset24hImpactJpy(0, -100, 1)).toBeNull()
    expect(
      getPortfolio24hPerformance([
        asset({ currentPrice: 0, priceChange24h: -100 }),
      ]).coverage.complete,
    ).toBe(false)
  })
})
