/**
 * Grade model + per-grade data derivation for the card-detail pricing surface
 * (VISION §5.1). One card carries multiple grades (Raw A/B/C · PSA 10/9/8 · BGS);
 * selecting a grade re-prices the whole page.
 *
 * Real anchors come from the scrape pipeline:
 *   - Raw family  → Yuyutei market price (JPY)  [card.price]
 *   - PSA 10      → SNKRDUNK ask/sold (USD)      [snkrdunkPrices]
 *
 * To show the FULL picture (เบส: "เติมตัวอย่าง + ติดป้าย est"), every stat is
 * filled. Anything NOT backed by a real scrape is a modeled estimate carrying
 * `isEst: true`, and the UI puts an "est" marker on exactly those values — so a
 * modeled number is never read as real. When the Grade enum + comps pipeline
 * land (VISION §6) buildGradeData swaps estimates for real data; no component
 * changes.
 *
 * ⚠️ PROTOTYPE: the EST_* multipliers + sales-sample are representative
 * placeholders. Replace with real per-grade pricing + comp counts later.
 */

export type GradeFamily = "raw" | "psa" | "bgs"
export type GradeKey =
  | "raw_a" | "raw_b" | "raw_c"
  | "psa_10" | "psa_9" | "psa_8"
  | "bgs_95"

export interface GradeTier {
  key: GradeKey
  label: string
  short: string
  family: GradeFamily
}

// Best-first within each family (VISION §5.1): Raw A·B·C, then PSA 10·9·8, then
// BGS. Order is presentation-only — buildGradeData/defaultGradeKey look tiers up
// by key, and the EST_* multipliers are name-keyed, so reordering is safe.
export const GRADE_TIERS: GradeTier[] = [
  { key: "raw_a", label: "Raw A", short: "Raw A", family: "raw" },
  { key: "raw_b", label: "Raw B", short: "Raw B", family: "raw" },
  { key: "raw_c", label: "Raw C", short: "Raw C", family: "raw" },
  { key: "psa_10", label: "PSA 10", short: "PSA 10", family: "psa" },
  { key: "psa_9", label: "PSA 9", short: "PSA 9", family: "psa" },
  { key: "psa_8", label: "PSA 8", short: "PSA 8", family: "psa" },
  { key: "bgs_95", label: "BGS 9.5", short: "BGS 9.5", family: "bgs" },
]

/** A money stat in its native currency, flagged when modeled. */
export interface Stat {
  jpy: number | null
  usd: number | null
  /** true = modeled estimate (UI shows an "est" marker); false = real scrape. */
  isEst: boolean
}

export interface GradeDatum {
  tier: GradeTier
  currency: "JPY" | "USD"
  /** Hero reference-market value. */
  value: Stat
  /** Most recent settled sale. */
  lastSale: Stat
  /** Lowest current listing/ask. */
  lowestAsk: Stat
  /** Honest attribution for a REAL last sale (e.g. "SNKRDUNK"); null otherwise. */
  lastSaleSource: string | null
  /** 30-day % change + whether modeled. null = not shown. */
  delta30d: { pct: number; isEst: boolean } | null
  /** Sales in the last 30 days (sample for now — always est). */
  sales30d: number | null
  isReal: boolean
  isEst: boolean
  hasData: boolean
}

const EST_RAW: Record<"raw_a" | "raw_b" | "raw_c", number> = { raw_a: 1, raw_b: 0.78, raw_c: 0.52 }
const EST_PSA: Record<"psa_10" | "psa_9" | "psa_8", number> = { psa_10: 1, psa_9: 0.5, psa_8: 0.32 }
const EST_BGS95_FROM_PSA10 = 1.15
const EST_LAST_SALE = 0.96 // settled sales sit a touch under market
const EST_LOWEST_ASK = 1.03 // lowest ask a touch over market

export interface GradeInput {
  rawAnchorJpy: number | null
  rawAnchorThb: number | null
  psa10AskUsd: number | null
  psa10SoldUsd: number | null
  rawLastSoldUsd: number | null
  rawDelta30d: number | null
}

const r = (n: number) => Math.round(n)
/** deterministic sample sales count (no RNG — RNG throws in this runtime). */
const sampleSales = (v: number | null) => (v != null ? 80 + (Math.abs(r(v)) % 740) : null)

export function buildGradeData(input: GradeInput): Record<GradeKey, GradeDatum> {
  const { rawAnchorJpy, psa10AskUsd, psa10SoldUsd, rawLastSoldUsd, rawDelta30d } = input
  const psa10Anchor = psa10AskUsd ?? psa10SoldUsd ?? null
  const byKey = Object.fromEntries(GRADE_TIERS.map((t) => [t.key, t])) as Record<GradeKey, GradeTier>

  function rawDatum(key: "raw_a" | "raw_b" | "raw_c"): GradeDatum {
    const real = key === "raw_a"
    const has = rawAnchorJpy != null && rawAnchorJpy > 0
    const v = has ? r(rawAnchorJpy! * EST_RAW[key]) : null
    const realSale = real && rawLastSoldUsd != null
    return {
      tier: byKey[key],
      currency: "JPY",
      value: { jpy: v, usd: null, isEst: !real },
      lastSale: realSale
        ? { jpy: null, usd: rawLastSoldUsd, isEst: false }
        : { jpy: v != null ? r(v * EST_LAST_SALE) : null, usd: null, isEst: true },
      lowestAsk: { jpy: v, usd: null, isEst: !real },
      lastSaleSource: realSale ? "SNKRDUNK" : null,
      delta30d: rawDelta30d != null ? { pct: rawDelta30d, isEst: !real } : null,
      sales30d: sampleSales(v),
      isReal: real && has,
      isEst: !real && has,
      hasData: has,
    }
  }

  function psaDatum(key: "psa_10" | "psa_9" | "psa_8"): GradeDatum {
    const real = key === "psa_10"
    const has = psa10Anchor != null && psa10Anchor > 0
    const v = real ? psa10AskUsd ?? psa10SoldUsd : has ? r(psa10Anchor! * EST_PSA[key]) : null
    const realSale = real && psa10SoldUsd != null
    return {
      tier: byKey[key],
      currency: "USD",
      value: { jpy: null, usd: v, isEst: !real },
      lastSale: realSale
        ? { jpy: null, usd: psa10SoldUsd, isEst: false }
        : { jpy: null, usd: v != null ? r(v * EST_LAST_SALE) : null, isEst: true },
      lowestAsk: real
        ? { jpy: null, usd: psa10AskUsd ?? v, isEst: false }
        : { jpy: null, usd: v != null ? r(v * EST_LOWEST_ASK) : null, isEst: true },
      lastSaleSource: realSale ? "SNKRDUNK" : null,
      // no real graded 30d series yet — omit on the real grade, est on modeled grades
      delta30d: !real && rawDelta30d != null ? { pct: rawDelta30d, isEst: true } : null,
      sales30d: sampleSales(v),
      isReal: real && has,
      isEst: !real && has,
      hasData: has,
    }
  }

  const bgsV = psa10Anchor != null && psa10Anchor > 0 ? r(psa10Anchor * EST_BGS95_FROM_PSA10) : null

  return {
    raw_a: rawDatum("raw_a"),
    raw_b: rawDatum("raw_b"),
    raw_c: rawDatum("raw_c"),
    psa_10: psaDatum("psa_10"),
    psa_9: psaDatum("psa_9"),
    psa_8: psaDatum("psa_8"),
    bgs_95: {
      tier: byKey.bgs_95,
      currency: "USD",
      value: { jpy: null, usd: bgsV, isEst: true },
      lastSale: { jpy: null, usd: bgsV != null ? r(bgsV * EST_LAST_SALE) : null, isEst: true },
      lowestAsk: { jpy: null, usd: bgsV != null ? r(bgsV * EST_LOWEST_ASK) : null, isEst: true },
      lastSaleSource: null,
      delta30d: bgsV != null && input.rawDelta30d != null ? { pct: input.rawDelta30d, isEst: true } : null,
      sales30d: sampleSales(bgsV),
      isReal: false,
      isEst: bgsV != null,
      hasData: bgsV != null,
    },
  }
}

export function defaultGradeKey(data: Record<GradeKey, GradeDatum>): GradeKey {
  // Prefer the headline premium grade (PSA 10), then Raw A, else first with data
  // (proto lands on PSA 10 selected).
  if (data.psa_10.hasData) return "psa_10"
  if (data.raw_a.hasData) return "raw_a"
  return GRADE_TIERS.find((t) => data[t.key].hasData)?.key ?? "raw_a"
}

export function gradeToChartMode(key: GradeKey): "raw" | "psa10" {
  return GRADE_TIERS.find((t) => t.key === key)?.family === "raw" ? "raw" : "psa10"
}
