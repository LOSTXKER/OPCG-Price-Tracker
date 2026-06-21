import { describe, it, expect } from "vitest"

import { niceTicks, rebaseToIndex, xAxisTicks } from "./card-chart"

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

describe("niceTicks", () => {
  const stepUnit = (step: number) => step / 10 ** Math.floor(Math.log10(step))

  it("produces round ฿-domain ticks (50K-style), not 56K/134K/209K/285K", () => {
    const ticks = niceTicks(56000, 285000, 5)
    expect(ticks.length).toBeGreaterThanOrEqual(3)
    const step = ticks[1] - ticks[0]
    // step is a clean 1/2/5 × 10ⁿ value, and every tick is a multiple of it
    expect([1, 2, 5]).toContain(Math.round(stepUnit(step)))
    for (const v of ticks) expect(Math.round(v / step) * step).toBeCloseTo(v)
  })

  it("produces round %-domain ticks for the indexed compare axis", () => {
    const ticks = niceTicks(88, 142, 5)
    expect(ticks).toContain(100) // the 100 baseline (+0%) is on a tick
    for (const v of ticks) expect(v % 10).toBe(0)
  })

  it("does not divide-by-zero on a flat (min===max) series", () => {
    const ticks = niceTicks(50, 50)
    expect(ticks.length).toBeGreaterThanOrEqual(1)
    expect(Number.isFinite(ticks[0])).toBe(true)
  })

  it("never excludes 2.5 → no tick that compactDisplayValue would mislabel as 3K", () => {
    const ticks = niceTicks(0, 12500, 5)
    const step = ticks[1] - ticks[0]
    expect([1, 2, 5]).toContain(Math.round(stepUnit(step)))
  })

  it("keeps every returned tick within [lo, hi]", () => {
    const cases: [number, number][] = [
      [311, 980],
      [9000, 46200],
      [100, 165],
      [56000, 285000],
    ]
    for (const [lo, hi] of cases) {
      for (const v of niceTicks(lo, hi, 5)) {
        expect(v).toBeGreaterThanOrEqual(lo)
        expect(v).toBeLessThanOrEqual(hi)
      }
    }
  })
})

describe("xAxisTicks", () => {
  const refMs = new Date("2026-04-05T00:00:00").getTime() // fixed "today" — function is pure
  const PLOT_W = 400 // → maxTicks 4, minGap 0.2
  const fracs = (range: Parameters<typeof xAxisTicks>[1]) =>
    xAxisTicks(refMs, range, "EN", PLOT_W).map((t) => t.frac)
  const gaps = (fs: number[]) => fs.slice(1).map((f, i) => f - fs[i])

  for (const range of ["7D", "1M", "3M", "1Y", "All"] as const) {
    it(`${range}: fracs are strictly increasing within [0,1] and pin "today" at the right edge`, () => {
      const fs = fracs(range)
      expect(fs.length).toBeGreaterThanOrEqual(2)
      expect(fs[0]).toBeGreaterThanOrEqual(0)
      expect(fs[fs.length - 1]).toBe(1) // today on the right edge
      for (const g of gaps(fs)) expect(g).toBeGreaterThan(0)
    })

    it(`${range}: no two labels collide (every gap ≥ one label width)`, () => {
      // minGap = 80 / plotW = 0.2 — the today-pin must drop a calendar tick that hugs
      // the edge rather than overlap it (the old 1-Apr / 5-Apr collision on 3M).
      for (const g of gaps(fracs(range))) expect(g).toBeGreaterThanOrEqual(0.2 - 1e-9)
    })
  }

  it("1M is evenly spaced — no uneven double-gap (8·15·29·5 regression)", () => {
    const g = gaps(fracs("1M"))
    // every interior gap within 25% of the mean → uniform, not a 2× hole where a
    // Math.round thin once dropped the middle tick.
    const mean = g.reduce((a, b) => a + b, 0) / g.length
    for (const x of g) expect(Math.abs(x - mean) / mean).toBeLessThan(0.25)
  })
})
