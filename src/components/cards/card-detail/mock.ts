/**
 * Prototype mock fill for the card-detail surface (เบส: "ถ้าอันไหนไม่มี ใช้
 * mockdata ไปก่อน จะได้เห็นโครงสร้าง UI ครบ"). Deterministic — seeded by a
 * numeric value so a given card renders the same clean shape every load (no RNG;
 * Math.random throws in this runtime). Swap for real data when the pipeline lands
 * (VISION §6); only this file + grades.ts change.
 */

const RANGE_POINTS: Record<string, number> = { "1M": 30, "3M": 40, "1Y": 52, All: 64 }

/** A smooth, clean price series seeded by `base` (the grade's value). */
export function mockSeries(base: number | null, up: boolean, range = "3M"): number[] {
  const b = base && base > 0 ? base : 1200
  const n = RANGE_POINTS[range] ?? 40
  const dir = up ? 1 : -1
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const trend = dir * 0.004 * i // gentle drift over the window
    const wave = 0.05 * Math.sin(i / 5 + (b % 9)) + 0.022 * Math.sin(i / 2.4 + (b % 5))
    out.push(Math.round(b * (1 - dir * 0.08 + trend + wave)))
  }
  // land the last point on the real value so the chart ties to the headline
  out[out.length - 1] = Math.round(b)
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
