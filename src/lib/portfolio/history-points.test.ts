import { describe, expect, it } from "vitest"

import {
  toPortfolioHistoryPoints,
  type PortfolioHistorySnapshot,
} from "./history-points"

function snapshot(
  overrides: Partial<PortfolioHistorySnapshot>,
): PortfolioHistorySnapshot {
  return {
    totalJpy: 1_000,
    totalThb: null,
    totalCost: 100,
    netInvestedJpy: 100,
    pnl: 900,
    cardCount: 1,
    totalCopyCount: 1,
    costedCopyCount: 1,
    snapshotAt: "2026-07-20T00:00:00.000Z",
    ...overrides,
  }
}

describe("portfolio history inflow markers", () => {
  it("does not mark late cost entry as a purchase when copy count is unchanged", () => {
    const points = toPortfolioHistoryPoints(
      [
        snapshot({ netInvestedJpy: 100, totalCopyCount: 1 }),
        snapshot({
          netInvestedJpy: 250,
          totalCost: 250,
          totalCopyCount: 1,
          snapshotAt: "2026-07-21T00:00:00.000Z",
        }),
        snapshot({
          netInvestedJpy: 400,
          totalCost: 400,
          totalCopyCount: 2,
          snapshotAt: "2026-07-22T00:00:00.000Z",
        }),
      ],
      "en-US",
    )

    expect(points.map((point) => point.isInflow)).toEqual([
      false,
      false,
      true,
    ])
  })

  it("marks a newly added copy even when its cost is still unknown", () => {
    const points = toPortfolioHistoryPoints(
      [
        snapshot({
          netInvestedJpy: 100,
          totalCost: 100,
          totalCopyCount: 1,
          costedCopyCount: 1,
        }),
        snapshot({
          netInvestedJpy: 100,
          totalCost: 100,
          totalCopyCount: 2,
          costedCopyCount: 1,
          snapshotAt: "2026-07-21T00:00:00.000Z",
        }),
      ],
      "en-US",
    )

    expect(points.map((point) => point.isInflow)).toEqual([false, true])
  })

  it("keeps the invested-cost fallback for legacy snapshots without copy counts", () => {
    const points = toPortfolioHistoryPoints(
      [
        snapshot({ totalCopyCount: null, netInvestedJpy: 100 }),
        snapshot({
          totalCopyCount: null,
          netInvestedJpy: 250,
          totalCost: 250,
          snapshotAt: "2026-07-21T00:00:00.000Z",
        }),
      ],
      "en-US",
    )

    expect(points.map((point) => point.isInflow)).toEqual([false, true])
  })
})
