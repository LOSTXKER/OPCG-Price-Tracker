import type { TranslationKey } from "@/lib/i18n";

export type RequiredTier = "PRO" | "PRO_PLUS";

export type TierFeatureKey =
  | "priceHistoryExtended"
  | "priceAlerts"
  | "lineAlerts"
  | "weeklyDigest"
  | "csvExport"
  | "comparePlus"
  | "portfolioCount"
  | "portfolioCards"
  | "watchlistCards"
  | "deckCount"
  | "savedFilters"
  | "bulkPriceLookup"
  | "autoPricing"
  | "listingBoost"
  | "adFree";

export type TierFeatureDef = {
  /** Minimum tier required to use the feature */
  requiredTier: RequiredTier;
  /** Translation key used as the dialog feature label/headline */
  titleKey: TranslationKey;
  /** Optional second-level description key */
  descriptionKey?: TranslationKey;
  /**
   * Translation keys to display as bullet benefits in the upgrade dialog.
   * Pulled from the existing `feat*` strings used by `/pricing`.
   */
  benefitKeys: TranslationKey[];
};

/**
 * Single source of truth for the upgrade dialog content. Each surface in the
 * app passes one of these `featureKey`s when triggering the upgrade dialog,
 * so wording stays consistent across the site.
 */
export const TIER_FEATURES: Record<TierFeatureKey, TierFeatureDef> = {
  priceHistoryExtended: {
    requiredTier: "PRO",
    titleKey: "featPriceHistory",
    benefitKeys: [
      "featPriceHistory",
      "featCardCompare",
      "featPriceAlerts",
      "featCsvExport",
    ],
  },
  priceAlerts: {
    requiredTier: "PRO",
    titleKey: "featPriceAlerts",
    benefitKeys: [
      "featPriceAlerts",
      "featLineAlerts",
      "featWeeklyDigest",
      "featPriceHistory",
    ],
  },
  lineAlerts: {
    requiredTier: "PRO",
    titleKey: "featLineAlerts",
    benefitKeys: [
      "featLineAlerts",
      "featPriceAlerts",
      "featWeeklyDigest",
      "featPriceHistory",
    ],
  },
  weeklyDigest: {
    requiredTier: "PRO",
    titleKey: "featWeeklyDigest",
    benefitKeys: [
      "featWeeklyDigest",
      "featLineAlerts",
      "featPriceAlerts",
      "featPriceHistory",
    ],
  },
  csvExport: {
    requiredTier: "PRO",
    titleKey: "featCsvExport",
    benefitKeys: [
      "featCsvExport",
      "featPortfolioCards",
      "featPriceHistory",
      "featPriceAlerts",
    ],
  },
  comparePlus: {
    requiredTier: "PRO",
    titleKey: "featCardCompare",
    benefitKeys: [
      "featCardCompare",
      "featPriceHistory",
      "featPriceAlerts",
      "featCsvExport",
    ],
  },
  portfolioCount: {
    requiredTier: "PRO",
    titleKey: "featPortfolioCount",
    benefitKeys: [
      "featPortfolioCount",
      "featPortfolioCards",
      "featCsvExport",
      "featPriceAlerts",
    ],
  },
  portfolioCards: {
    requiredTier: "PRO",
    titleKey: "featPortfolioCards",
    benefitKeys: [
      "featPortfolioCards",
      "featPortfolioCount",
      "featCsvExport",
      "featPriceHistory",
    ],
  },
  watchlistCards: {
    requiredTier: "PRO",
    titleKey: "featWatchlistCards",
    benefitKeys: [
      "featWatchlistCards",
      "featPriceAlerts",
      "featLineAlerts",
      "featCsvExport",
    ],
  },
  deckCount: {
    requiredTier: "PRO",
    titleKey: "featDecks",
    benefitKeys: [
      "featDecks",
      "featPortfolioCount",
      "featCsvExport",
      "featPriceAlerts",
    ],
  },
  // No dedicated `featSavedFilters` translation key yet — fall back to
  // featCardCompare which is the closest "advanced filters" copy and keeps
  // historical behaviour. Replace when copy lands.
  savedFilters: {
    requiredTier: "PRO",
    titleKey: "featCardCompare",
    benefitKeys: [
      "featCardCompare",
      "featPriceHistory",
      "featPriceAlerts",
      "featCsvExport",
    ],
  },
  bulkPriceLookup: {
    requiredTier: "PRO",
    titleKey: "featBulkPriceLookup",
    benefitKeys: [
      "featBulkPriceLookup",
      "featCsvExport",
      "featPriceHistory",
      "featPriceAlerts",
    ],
  },
  autoPricing: {
    requiredTier: "PRO_PLUS",
    titleKey: "featAutoPricing",
    benefitKeys: [
      "featAutoPricing",
      "featBulkPriceLookup",
      "featListingBoost",
      "featMarketplaceFee",
    ],
  },
  listingBoost: {
    requiredTier: "PRO_PLUS",
    titleKey: "featListingBoost",
    benefitKeys: [
      "featListingBoost",
      "featAutoPricing",
      "featMarketplaceFee",
      "featBulkPriceLookup",
    ],
  },
  adFree: {
    requiredTier: "PRO",
    titleKey: "featAdFree",
    benefitKeys: [
      "featAdFree",
      "featPriceHistory",
      "featPriceAlerts",
      "featCsvExport",
    ],
  },
};

export function getTierFeature(key: TierFeatureKey): TierFeatureDef {
  return TIER_FEATURES[key];
}
