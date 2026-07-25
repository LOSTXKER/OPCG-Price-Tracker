/**
 * Grade model + per-grade data derivation for the card-detail pricing surface
 * (VISION §5.1). One card carries multiple grades (Raw · PSA 10/9/8 · BGS);
 * selecting a grade re-prices the whole page.
 *
 * Real anchors come from the scrape pipeline:
 *   - Raw family  → Yuyutei market price (JPY)  [card.price]
 *   - PSA 10      → SNKRDUNK ask/sold (USD)      [snkrdunkPrices]
 *
 * Grades without a real scrape remain modeled values carrying `isEst: true` in
 * the data layer. The owner intentionally removed estimate markers from the UI;
 * keep the flag so a future per-grade comps pipeline can replace derived values
 * without changing the component contract.
 *
 * ⚠️ PROTOTYPE: the EST_* multipliers + sales-sample are representative
 * placeholders. Replace with real per-grade pricing + comp counts later.
 */

import {
  GRADE_TIER_BY_KEY,
  GRADE_TIERS,
  getGradePriceUsd,
  type GradeKey,
  type GradeTier,
} from "@/lib/pricing/grade-tiers"

// Compatibility exports: card-detail callers historically imported the grade
// registry from this module. Keep that public surface while the actual model is
// now shared by every price/grade filter in the app.
export {
  GLOBAL_GRADE_TIERS,
  GRADE_PRICE_MULTIPLIERS,
  GRADE_TIER_BY_KEY,
  GRADE_TIERS,
  getGradePriceUsd,
  getGradePriceValue,
  getGradeTier,
  hasGradePrice,
  isModeledGrade,
  isRawGrade,
  type GradeDataKind,
  type GradeFamily,
  type GradeKey,
  type GradeNativeCurrency,
  type GradePriceAnchors,
  type GradePriceSource,
  type GradePriceValue,
  type GradeTier,
} from "@/lib/pricing/grade-tiers"

/** A money stat in its native currency, flagged when modeled. */
export interface Stat {
  jpy: number | null
  usd: number | null
  /** true = modeled estimate; false = real scrape. */
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
  isEst: boolean
  hasData: boolean
}

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

export function buildGradeData(input: GradeInput): Record<GradeKey, GradeDatum> {
  const { rawAnchorJpy, psa10AskUsd, psa10SoldUsd, rawLastSoldUsd, rawDelta30d } = input
  const psa10Anchor = psa10AskUsd ?? psa10SoldUsd ?? null
  const byKey = GRADE_TIER_BY_KEY

  function rawDatum(): GradeDatum {
    // Raw is a single REAL market price (Yuyutei, JPY) — no modeled A/B/C tiers.
    const has = rawAnchorJpy != null && rawAnchorJpy > 0
    const v = has ? r(rawAnchorJpy!) : null
    const realSale = rawLastSoldUsd != null
    return {
      tier: byKey.raw,
      currency: "JPY",
      value: { jpy: v, usd: null, isEst: false },
      lastSale: realSale
        ? { jpy: null, usd: rawLastSoldUsd, isEst: false }
        : { jpy: v != null ? r(v * EST_LAST_SALE) : null, usd: null, isEst: true },
      lowestAsk: { jpy: v, usd: null, isEst: false },
      lastSaleSource: realSale ? "SNKRDUNK" : null,
      delta30d: rawDelta30d != null ? { pct: rawDelta30d, isEst: false } : null,
      isEst: false,
      hasData: has,
    }
  }

  function psaDatum(key: "psa_10" | "psa_9" | "psa_8"): GradeDatum {
    const real = key === "psa_10"
    const has = psa10Anchor != null && psa10Anchor > 0
    const v = real
      ? psa10AskUsd ?? psa10SoldUsd
      : getGradePriceUsd(psa10Anchor, key)
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
      // no real graded 30d series yet — use the raw card's 30d move as a flagged
      // estimate across all graded tiers (swapped for a real series when comps land)
      delta30d: rawDelta30d != null ? { pct: rawDelta30d, isEst: true } : null,
      isEst: !real && has,
      hasData: has,
    }
  }

  const bgsV = getGradePriceUsd(psa10Anchor, "bgs_95")

  return {
    raw: rawDatum(),
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
      isEst: bgsV != null,
      hasData: bgsV != null,
    },
  }
}

export function defaultGradeKey(data: Record<GradeKey, GradeDatum>): GradeKey {
  // Prefer the headline premium grade (PSA 10), then Raw, else first with data.
  if (data.psa_10.hasData) return "psa_10"
  if (data.raw.hasData) return "raw"
  return GRADE_TIERS.find((t) => data[t.key].hasData)?.key ?? "raw"
}

export function gradeToChartMode(key: GradeKey): "raw" | "psa10" {
  return GRADE_TIERS.find((t) => t.key === key)?.family === "raw" ? "raw" : "psa10"
}
