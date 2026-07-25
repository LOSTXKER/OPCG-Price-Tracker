/**
 * Client-safe single source of truth for collectible grades that can be used as
 * a global price lens. A certification grade is intentionally separate from a
 * raw card's physical `CardCondition` (NM/LP/etc.) — those are different filter
 * dimensions and must never share this key space.
 *
 * Data truth today:
 * - Raw is a real Yuyutei market price in JPY.
 * - PSA 10 is a real SNKRDUNK reference in USD.
 * - PSA 9, PSA 8, and BGS 9.5 are clearly-labelled estimates derived from the
 *   card's PSA 10 anchor until per-grade market data is available.
 */

export type GradeFamily = "raw" | "psa" | "bgs"
export type GradeKey =
  | "raw"
  | "psa_10"
  | "psa_9"
  | "psa_8"
  | "bgs_95"

export type GradeDataKind = "real" | "modeled"
export type GradePriceSource = "YUYUTEI" | "SNKRDUNK"
export type GradeNativeCurrency = "JPY" | "USD"

export interface GradeTier {
  key: GradeKey
  label: string
  short: string
  family: GradeFamily
  dataKind: GradeDataKind
  /** Source of the real value, or of the anchor used by a modeled value. */
  source: GradePriceSource
  nativeCurrency: GradeNativeCurrency
  /** Whether this tier belongs in the shared site-wide grade selector. */
  globalFilter: boolean
  /** null for Raw; graded estimates are derived from the PSA 10 anchor. */
  psa10Multiplier: number | null
}

export const GRADE_PRICE_MULTIPLIERS = {
  raw: null,
  psa_10: 1,
  psa_9: 0.5,
  psa_8: 0.32,
  bgs_95: 1.15,
} as const satisfies Record<GradeKey, number | null>

// Best-first by family: one ungraded Raw tier, PSA 10/9/8, then BGS 9.5.
export const GRADE_TIERS = [
  {
    key: "raw",
    label: "Raw",
    short: "Raw",
    family: "raw",
    dataKind: "real",
    source: "YUYUTEI",
    nativeCurrency: "JPY",
    globalFilter: true,
    psa10Multiplier: GRADE_PRICE_MULTIPLIERS.raw,
  },
  {
    key: "psa_10",
    label: "PSA 10",
    short: "PSA 10",
    family: "psa",
    dataKind: "real",
    source: "SNKRDUNK",
    nativeCurrency: "USD",
    globalFilter: true,
    psa10Multiplier: GRADE_PRICE_MULTIPLIERS.psa_10,
  },
  {
    key: "psa_9",
    label: "PSA 9",
    short: "PSA 9",
    family: "psa",
    dataKind: "modeled",
    source: "SNKRDUNK",
    nativeCurrency: "USD",
    globalFilter: true,
    psa10Multiplier: GRADE_PRICE_MULTIPLIERS.psa_9,
  },
  {
    key: "psa_8",
    label: "PSA 8",
    short: "PSA 8",
    family: "psa",
    dataKind: "modeled",
    source: "SNKRDUNK",
    nativeCurrency: "USD",
    globalFilter: true,
    psa10Multiplier: GRADE_PRICE_MULTIPLIERS.psa_8,
  },
  {
    key: "bgs_95",
    label: "BGS 9.5",
    short: "BGS 9.5",
    family: "bgs",
    dataKind: "modeled",
    source: "SNKRDUNK",
    nativeCurrency: "USD",
    globalFilter: true,
    psa10Multiplier: GRADE_PRICE_MULTIPLIERS.bgs_95,
  },
] as const satisfies readonly GradeTier[]

export const GRADE_TIER_BY_KEY = Object.fromEntries(
  GRADE_TIERS.map((tier) => [tier.key, tier]),
) as Record<GradeKey, GradeTier>

export const GLOBAL_GRADE_TIERS = GRADE_TIERS.filter(
  (tier) => tier.globalFilter,
)

export interface GradePriceAnchors {
  rawPriceJpy: number | null | undefined
  psa10PriceUsd: number | null | undefined
}

export interface GradePriceValue {
  amount: number
  currency: GradeNativeCurrency
  dataKind: GradeDataKind
  source: GradePriceSource
}

function isAvailablePrice(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

export function getGradeTier(grade: GradeKey): GradeTier {
  return GRADE_TIER_BY_KEY[grade]
}

export function isRawGrade(grade: GradeKey): grade is "raw" {
  return grade === "raw"
}

export function isModeledGrade(grade: GradeKey): boolean {
  return GRADE_TIER_BY_KEY[grade].dataKind === "modeled"
}

/**
 * Return a graded value in USD. Raw deliberately returns null because its real
 * anchor is JPY; currency conversion belongs to the display layer.
 */
export function getGradePriceUsd(
  psa10PriceUsd: number | null | undefined,
  grade: GradeKey,
): number | null {
  const multiplier = GRADE_PRICE_MULTIPLIERS[grade]
  if (multiplier == null || !isAvailablePrice(psa10PriceUsd)) return null
  return Math.round(psa10PriceUsd * multiplier)
}

/** Resolve the grade's native value without mixing currencies. */
export function getGradePriceValue(
  anchors: GradePriceAnchors,
  grade: GradeKey,
): GradePriceValue | null {
  const tier = GRADE_TIER_BY_KEY[grade]
  const amount = isRawGrade(grade)
    ? anchors.rawPriceJpy
    : getGradePriceUsd(anchors.psa10PriceUsd, grade)

  if (!isAvailablePrice(amount)) return null
  return {
    amount,
    currency: tier.nativeCurrency,
    dataKind: tier.dataKind,
    source: tier.source,
  }
}

export function hasGradePrice(
  anchors: GradePriceAnchors,
  grade: GradeKey,
): boolean {
  return getGradePriceValue(anchors, grade) != null
}
