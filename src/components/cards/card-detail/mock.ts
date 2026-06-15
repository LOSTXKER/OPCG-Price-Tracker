/**
 * Prototype mock fill for the card-detail surface (เบส: "ถ้าอันไหนไม่มี ใช้
 * mockdata ไปก่อน จะได้เห็นโครงสร้าง UI ครบ"). Deterministic — seeded by a
 * numeric value so a given card renders the same clean shape every load (no RNG;
 * Math.random throws in this runtime). Swap for real data when the pipeline lands
 * (VISION §6); only this file + grades.ts change.
 */

// Finer point counts so the line reads as real ticks, not a hand-drawn curve.
const RANGE_POINTS: Record<string, number> = { "1M": 60, "3M": 90, "1Y": 180, All: 260 }

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
export function mockSeries(base: number | null, up: boolean, range = "3M"): number[] {
  const b = base && base > 0 ? base : 1200
  const n = RANGE_POINTS[range] ?? 90
  const seed = b % 1000
  const drift = (up ? 1 : -1) * 0.0016 // gentle per-step trend
  let v = b * (1 - (up ? 1 : -1) * 0.085) // start ~8.5% off so drift lands on b
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const r1 = hash(i * 12.9898 + seed * 78.233) // layered hashes → reads random
    const r2 = hash(i * 39.346 + seed * 11.135)
    const shock = (r1 - 0.5) * 0.05 + (r2 - 0.5) * 0.018 // ±~2.5% jitter + fine grain
    const meanRevert = ((b - v) / b) * 0.04 // pull back toward base
    v = v * (1 + drift + shock + meanRevert)
    out.push(Math.round(v))
  }
  out[out.length - 1] = Math.round(b) // pin last point to the grade value
  return out
}

/**
 * Per-grade series for the overlay chart. Each grade's `base` MUST already be in
 * the active DISPLAY currency (caller converts via jpy/usdToDisplayValue), so all
 * returned series share one honest scale — MiniAreaChart then pools them onto a
 * single global min/max and the grade ladder (PSA10 high → Raw low) reads true.
 */
export function mockGradeSeries(
  grades: { key: string; base: number | null; up: boolean }[],
  range = "3M",
): Record<string, number[]> {
  const out: Record<string, number[]> = {}
  for (const g of grades) out[g.key] = mockSeries(g.base, g.up, range)
  return out
}

export type MockComp = { source: string; grade: string; price: number; whenDays: number }

const SOURCES = ["SNKRDUNK", "eBay", "Yuyutei", "TCGplayer", "Cardmarket"]

/** A clean recent-sales list (proto-style) seeded by `base`. */
export function mockComps(base: number | null, gradeLabel: string, count = 7): MockComp[] {
  const b = base && base > 0 ? base : 1200
  return Array.from({ length: count }, (_, i) => ({
    source: SOURCES[(i + (b % SOURCES.length)) % SOURCES.length],
    grade: gradeLabel,
    price: Math.round(b * (1 + 0.05 * Math.sin(i + (b % 7)) - (0.015 * i) / count)),
    whenDays: i === 0 ? 1 : i * 2 + (b % 3),
  }))
}

/** A plausible 30-day sales count seeded by `base`. */
export function mockSales30d(base: number | null): number {
  const b = base && base > 0 ? base : 1200
  return 120 + (Math.abs(Math.round(b)) % 1400)
}
