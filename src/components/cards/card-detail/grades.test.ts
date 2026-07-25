import { describe, expect, it } from "vitest"

import {
  buildGradeData,
  defaultGradeKey,
  gradeToChartMode,
} from "./grades"

describe("card-detail grade model", () => {
  it("preserves real anchors and marks only derived grade values as estimates", () => {
    const data = buildGradeData({
      rawAnchorJpy: 10_000,
      rawAnchorThb: 2_300,
      psa10AskUsd: 100,
      psa10SoldUsd: 92,
      rawLastSoldUsd: null,
      rawDelta30d: 12.5,
    })

    expect(data.raw.value).toEqual({ jpy: 10_000, usd: null, isEst: false })
    expect(data.psa_10.value).toEqual({ jpy: null, usd: 100, isEst: false })
    expect(data.psa_10.lastSale).toEqual({ jpy: null, usd: 92, isEst: false })
    expect(data.psa_9.value).toEqual({ jpy: null, usd: 50, isEst: true })
    expect(data.psa_8.value).toEqual({ jpy: null, usd: 32, isEst: true })
    expect(data.bgs_95.value).toEqual({ jpy: null, usd: 115, isEst: true })
  })

  it("keeps default selection and chart-series compatibility", () => {
    const data = buildGradeData({
      rawAnchorJpy: 10_000,
      rawAnchorThb: 2_300,
      psa10AskUsd: null,
      psa10SoldUsd: null,
      rawLastSoldUsd: null,
      rawDelta30d: null,
    })

    expect(defaultGradeKey(data)).toBe("raw")
    expect(gradeToChartMode("raw")).toBe("raw")
    expect(gradeToChartMode("psa_9")).toBe("psa10")
    expect(gradeToChartMode("bgs_95")).toBe("psa10")
  })
})
