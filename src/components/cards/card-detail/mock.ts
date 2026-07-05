/**
 * Prototype mock fill for the card-detail surface (เบส: "ถ้าอันไหนไม่มี ใช้
 * mockdata ไปก่อน จะได้เห็นโครงสร้าง UI ครบ"). Deterministic — seeded by a
 * numeric value so a given card renders the same clean shape every load (no RNG;
 * Math.random throws in this runtime). Swap for real data when the pipeline lands
 * (VISION §6); only this file + grades.ts change.
 */

import type { CardListing } from "@/components/cards/card-detail/types"

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

// ── Recent sale history (multi-source) ──────────────────────────────────────
// Sample feed for the "ประวัติการซื้อขายล่าสุด" section — pooled settled sales /
// listings across several Japanese + global markets (our edge over a single-source
// competitor page). Deterministic (seeded by base + index, no RNG/clock in render).
// SWAP for real data when the SNKRDUNK used-listings list is persisted to the DB
// (scraper already fetches it; only this generator + the wiring change).
const DAY_MS = 86_400_000

export type MockSale = {
  source: string
  /** Condition / grade label, e.g. "PSA 10" · "BGS 9.5" · "A" · "Raw". */
  condition: string
  /** Grading family for the logo ("psa" | "bgs" | "cgc" | "ars"); null = ungraded. */
  family: string | null
  priceJpy: number
  soldAtIso: string
}

// Grade pool with a price multiplier vs the raw base + which source tends to carry it.
const SALE_GRADES: { condition: string; family: string | null; mult: number }[] = [
  { condition: "PSA 10", family: "psa", mult: 3.1 },
  { condition: "PSA 9", family: "psa", mult: 1.9 },
  { condition: "BGS 9.5", family: "bgs", mult: 2.6 },
  { condition: "ARS 10+", family: "ars", mult: 2.4 },
  { condition: "A", family: null, mult: 1.12 },
  { condition: "B", family: null, mult: 1.0 },
  { condition: "C", family: null, mult: 0.9 },
  { condition: "D", family: null, mult: 0.8 },
]
const SALE_SOURCES = ["SNKRDUNK", "Yuyutei", "Mercari JP", "eBay JP"]

/**
 * A deterministic SETTLED-sale feed (sold only — no active listings) seeded by
 * `baseJpy` (the card's raw JPY price) and anchored to `nowIso` (the freshest
 * scrape time, passed from the server so no `Date.now()` runs during render).
 * Newest first.
 */
export function mockRecentSales(baseJpy: number | null, nowIso: string | null, count = 12): MockSale[] {
  const b = baseJpy && baseJpy > 0 ? baseJpy : 1200
  const seed = Math.abs(Math.round(b))
  const nowMs = nowIso ? new Date(nowIso).getTime() : 0
  return Array.from({ length: count }, (_, i) => {
    const g = SALE_GRADES[(seed + i) % SALE_GRADES.length]
    const jitter = 1 + (hash(i * 7.13 + seed * 0.137) - 0.5) * 0.12 // ±6% wobble
    const whenDays = i === 0 ? 0 : i * 2 + (seed % 3)
    return {
      source: SALE_SOURCES[(seed + i * 3) % SALE_SOURCES.length],
      condition: g.condition,
      family: g.family,
      priceJpy: Math.max(1, Math.round((b * g.mult * jitter) / 10) * 10),
      soldAtIso: nowMs > 0 ? new Date(nowMs - whenDays * DAY_MS).toISOString() : "",
    }
  })
}

// ── Meecard marketplace asks (active listings) ───────────────────────────────
// Sample feed for "ขายอยู่บน Meecard" when the DB has no real listings yet
// (marketplace flag-gated). Deterministic, ascending by ask price. SWAP when
// marketplace goes live and getListingsForCard returns real rows.

const MOCK_SELLERS: { displayName: string; rating: number; reviews: number }[] = [
  { displayName: "CardShop_BKK", rating: 4.8, reviews: 42 },
  { displayName: "OPTCG_TH", rating: 4.6, reviews: 18 },
  { displayName: "MintCollector", rating: 4.9, reviews: 67 },
  { displayName: "DeckBuilder99", rating: 4.3, reviews: 9 },
  { displayName: "RarePulls", rating: 4.7, reviews: 31 },
  { displayName: "TCG_Hub", rating: 4.5, reviews: 24 },
  { displayName: "BangkokCards", rating: 4.4, reviews: 15 },
  { displayName: "OPKingdom", rating: 4.8, reviews: 55 },
  { displayName: "CardVault_TH", rating: 4.6, reviews: 28 },
  { displayName: "TreasureCruise", rating: 4.2, reviews: 11 },
  { displayName: "GrandLineTCG", rating: 4.9, reviews: 73 },
  { displayName: "PirateMarket", rating: 4.5, reviews: 19 },
]

/**
 * Deterministic active-ask feed for the Meecard marketplace rail. Spreads several
 * grades/conditions so the page's grade filter can narrow the table. Asks are
 * priced slightly above the raw base (listings, not settled sales).
 */
export function mockMeecardListings(baseJpy: number | null, nowIso: string | null, count = 18): CardListing[] {
  const b = baseJpy && baseJpy > 0 ? baseJpy : 1200
  const seed = Math.abs(Math.round(b))
  const nowMs = nowIso ? new Date(nowIso).getTime() : 0
  const rows = Array.from({ length: count }, (_, i) => {
    const g = SALE_GRADES[(seed + i * 2) % SALE_GRADES.length]
    const askPremium = 1.02 + hash(i * 3.71 + seed * 0.091) * 0.1 // +2–12% vs settled
    const jitter = 1 + (hash(i * 5.17 + seed * 0.213) - 0.5) * 0.08
    const seller = MOCK_SELLERS[(seed + i) % MOCK_SELLERS.length]
    const listedDays = i + (seed % 4)
    return {
      id: `mock-${seed}-${i}`,
      priceJpy: Math.max(1, Math.round((b * g.mult * askPremium * jitter) / 10) * 10),
      priceThb: null,
      condition: g.condition,
      listedAtIso: nowMs > 0 ? new Date(nowMs - listedDays * DAY_MS).toISOString() : "",
      user: {
        displayName: seller.displayName,
        avatarUrl: null,
        sellerRating: seller.rating,
        sellerReviewCount: seller.reviews,
      },
    }
  })
  return rows.sort((a, b) => a.priceJpy - b.priceJpy)
}
