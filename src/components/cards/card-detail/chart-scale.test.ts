import { describe, it, expect } from "vitest"

import { rebaseToIndex } from "./card-chart"

describe("rebaseToIndex", () => {
  it("rebases the first point to 100", () => {
    const r = rebaseToIndex([200, 220, 180])
    expect(r[0]).toBe(100)
    expect(r[1]).toBeCloseTo(110)
    expect(r[2]).toBeCloseTo(90)
  })

  it("keeps a flat series at 100", () => {
    expect(rebaseToIndex([50, 50, 50])).toEqual([100, 100, 100])
  })

  it("collapses the magnitude gap — Raw ฿9K and PSA10 ฿42K both read as 110 at +10%", () => {
    const raw = rebaseToIndex([9000, 9900])
    const psa = rebaseToIndex([42000, 46200])
    expect(raw[0]).toBe(100)
    expect(raw[1]).toBeCloseTo(110)
    expect(psa[0]).toBe(100)
    expect(psa[1]).toBeCloseTo(110)
  })

  it("returns input unchanged when the base is 0 or the series is empty", () => {
    expect(rebaseToIndex([0, 5])).toEqual([0, 5])
    expect(rebaseToIndex([])).toEqual([])
  })
})
