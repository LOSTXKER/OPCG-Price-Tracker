/**
 * Prototype mock fill for the card-detail surface (เบส: "ถ้าอันไหนไม่มี ใช้
 * mockdata ไปก่อน จะได้เห็นโครงสร้าง UI ครบ"). Deterministic — seeded by a
 * numeric value so a given card renders the same clean shape every load (no RNG;
 * Math.random throws in this runtime). Swap for real data when the pipeline lands
 * (VISION §6); only this file + grades.ts change.
 */

import type { Stat } from "./grades"

// ~1 point/day (or sparser) — honest cadence: the real scrape yields one price/day, so
// the mock must NOT imply sub-daily resolution (7D=28 read as 4 pts/day = fake intraday;
// INTRADAY_ENABLED=false). Short windows = daily; long windows stay ≤ daily. Swap for real
// dated points when the pipeline lands (then plot a node at each real observation).
const RANGE_POINTS: Record<string, number> = { "7D": 8, "1M": 31, "3M": 91, "1Y": 180, All: 260 }

// fract(sin(n)*k) — a cheap deterministic hash in [0,1). Pure: same n → same out.
// (RNG + clock APIs throw in this runtime, so all "randomness" is seeded.)
function hash(n: number): number {
  const s = Math.sin(n) * 43758.5453
  return s - Math.floor(s)
}

/**
 * Jagged, bounded, deterministic price series seeded by `base` (the grade's value
 * in display currency). Mean-reverts toward base so it never runs away, and lands
 * EXACTLY on base at the last point so the chart ties to the headline price.
 */
export function mockSeries(base: number | null, up: boolean, range = "3M", deltaPct?: number | null): number[] {
  const b = base && base > 0 ? base : 1200
  const n = RANGE_POINTS[range] ?? 90
  const seed = b % 1000
  const drift = (up ? 1 : -1) * 0.0016 // gentle per-step trend
  // Start so the line climbs/falls by the REAL headline % over the window — a
  // +350% move must read as a +350% climb, not a fixed bump (the y-domain then
  // auto-stretches to it). Clamp so a ≤-100% delta can't divide-by-zero/flip;
  // fall back to ±8.5% only when no delta is known.
  const startMul =
    deltaPct != null && Number.isFinite(deltaPct)
      ? 1 / (1 + Math.max(-95, deltaPct) / 100)
      : 1 - (up ? 1 : -1) * 0.085
  let v = b * startMul // start offset so drift+rescale land on b
  let vel = 0 // momentum — makes moves persist into trends, not per-point noise
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const r1 = hash(i * 12.9898 + seed * 78.233) // layered hashes → reads random
    const r2 = hash(i * 39.346 + seed * 11.135)
    const kick = (r1 - 0.5) * 0.04 + (r2 - 0.5) * 0.012
    vel = vel * 0.74 + kick * 0.26 // smooth the shock so the line trends, not spikes
    const meanRevert = ((b - v) / b) * 0.05 // pull back toward base
    v = v * (1 + drift + vel + meanRevert)
    out.push(v)
  }
  // tie the series to the headline by SCALING the whole line so the last point
  // lands exactly on `base` — preserves the shape, no artificial end-cliff.
  // Keep float precision (don't round to whole units): a cheap card (~25฿) spans
  // only a few integers, so rounding would collapse the line into a staircase.
  // The chart plots floats; the hero/tooltip round for display.
  const lastRaw = out[out.length - 1]
  const k = lastRaw > 0 ? b / lastRaw : 1
  return out.map((x) => x * k)
}

/**
 * Per-grade series for the overlay chart. Each grade's `base` MUST already be in
 * the active DISPLAY currency (caller converts via jpy/usdToDisplayValue), so all
 * returned series share one honest scale — MiniAreaChart then pools them onto a
 * single global min/max and the grade ladder (PSA10 high → Raw low) reads true.
 */
export function mockGradeSeries(
  grades: { key: string; base: number | null; up: boolean; pct?: number | null }[],
  range = "3M",
): Record<string, number[]> {
  const out: Record<string, number[]> = {}
  for (const g of grades) out[g.key] = mockSeries(g.base, g.up, range, g.pct)
  return out
}

export type MockComp = {
  source: string
  grade: string
  price: number
  priceJpy?: number | null
  priceUsd?: number | null
  whenDays: number
}

type MockCompOptions = {
  /** Forces the newest receipt row to match the hero/triad "last sale". */
  firstSale?: Stat | null
}

const SOURCES = ["SNKRDUNK", "eBay", "Yuyutei", "TCGplayer", "Cardmarket"]

/** A clean recent-sales list (proto-style) seeded by `base`. */
export function mockComps(
  base: number | null,
  gradeLabel: string,
  count = 7,
  options: MockCompOptions = {},
): MockComp[] {
  const b = base && base > 0 ? base : 1200
  const sourceSeed = Math.abs(Math.round(b)) % SOURCES.length
  return Array.from({ length: count }, (_, i) => ({
    source: SOURCES[(i + sourceSeed) % SOURCES.length],
    grade: gradeLabel,
    ...(() => {
      if (i === 0 && options.firstSale && (options.firstSale.jpy != null || options.firstSale.usd != null)) {
        return {
          source: "SNKRDUNK",
          price: Math.round(options.firstSale.jpy ?? options.firstSale.usd ?? b),
          priceJpy: options.firstSale.jpy,
          priceUsd: options.firstSale.usd,
          whenDays: 0,
        }
      }
      return {
        price: Math.round(b * (1 + 0.05 * Math.sin(i + (b % 7)) - (0.015 * i) / count)),
        priceJpy: null,
        priceUsd: null,
        whenDays: i === 0 ? 1 : i * 2 + (Math.round(b) % 3),
      }
    })(),
  })).sort((a, b) => a.whenDays - b.whenDays)
}

/** A plausible 30-day sales count seeded by `base`. */
export function mockSales30d(base: number | null): number {
  const b = base && base > 0 ? base : 1200
  return 120 + (Math.abs(Math.round(b)) % 1400)
}
