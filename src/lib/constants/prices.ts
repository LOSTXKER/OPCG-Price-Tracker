/**
 * Mirrors the Prisma `PriceSource` enum. Kept as a local type so this module
 * stays client-safe (Prisma runtime cannot be bundled for the browser).
 */
export type PriceSource =
  | "YUYUTEI"
  | "SNKRDUNK"
  | "EBAY_JP"
  | "MERCARI_JP"
  | "PORTFOLIO"
  | "MARKETPLACE"
  | "CARDMARKET"
  | "TCGPLAYER";

export const PRICE_SOURCE = {
  YUYUTEI: "YUYUTEI",
  SNKRDUNK: "SNKRDUNK",
  PSA_10: "PSA 10",
} as const;

export const PRICE_SOURCE_LABELS: Record<PriceSource, string> = {
  YUYUTEI: "Yuyutei",
  SNKRDUNK: "SNKRDUNK",
  EBAY_JP: "eBay JP",
  MERCARI_JP: "Mercari JP",
  PORTFOLIO: "Portfolio",
  MARKETPLACE: "Marketplace",
  CARDMARKET: "Cardmarket",
  TCGPLAYER: "TCGPlayer",
};

export const FALLBACK_JPY_THB_RATE = 0.21;

export const DEFAULT_JPY_USD = 0.0067;

export const MAX_COMPARE = 6;
