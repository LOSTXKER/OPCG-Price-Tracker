export const PRICE_SOURCE = {
  YUYUTEI: "YUYUTEI",
  SNKRDUNK: "SNKRDUNK",
  PSA_10: "PSA 10",
} as const;

export type PriceSource = (typeof PRICE_SOURCE)[keyof typeof PRICE_SOURCE];

export const FALLBACK_JPY_THB_RATE = 0.21;

export const MAX_COMPARE = 6;
