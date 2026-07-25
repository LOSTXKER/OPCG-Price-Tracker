import type { TranslationKey } from "@/lib/i18n";
import type { UserTier } from "@/generated/prisma/client";
import { tierRank } from "./limits";

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
  | "adFree"
  | "honeyMultiplier";

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
  /** Numeric quota to compare between the current and target plans. */
  limitKey?: QuantifiedTierLimitKey;
  /** Optional localized template for a finite value, e.g. "{n} days". */
  limitFormatKey?: TranslationKey;
};

export type QuantifiedTierLimitKey =
  | "portfolioCards"
  | "portfolioCount"
  | "watchlistCards"
  | "priceAlerts"
  | "deckCount"
  | "savedFilters"
  | "priceHistoryDays"
  | "compareCards"
  | "bulkPriceLookup"
  | "honeyMultiplier";

/**
 * Single source of truth for the upgrade dialog content. Each surface in the
 * app passes one of these `featureKey`s when triggering the upgrade dialog,
 * so wording stays consistent across the site.
 */
export const TIER_FEATURES: Record<TierFeatureKey, TierFeatureDef> = {
  priceHistoryExtended: {
    requiredTier: "PRO",
    titleKey: "featPriceHistory",
    limitKey: "priceHistoryDays",
    limitFormatKey: "pricingHistoryDaysValue",
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
    limitKey: "priceAlerts",
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
    limitKey: "compareCards",
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
    limitKey: "portfolioCount",
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
    limitKey: "portfolioCards",
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
    limitKey: "watchlistCards",
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
    limitKey: "deckCount",
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
    limitKey: "savedFilters",
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
    limitKey: "bulkPriceLookup",
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
  honeyMultiplier: {
    requiredTier: "PRO",
    titleKey: "featHoneyMultiplier",
    limitKey: "honeyMultiplier",
    limitFormatKey: "pricingHoneyMultiplierValue",
    benefitKeys: [
      "featHoneyMultiplier",
      "featPriceHistory",
      "featPortfolioCards",
      "featPriceAlerts",
    ],
  },
};

export function getTierFeature(key: TierFeatureKey): TierFeatureDef {
  return TIER_FEATURES[key];
}

/**
 * Quota features remain useful on Pro, but hitting their Pro cap should offer
 * Pro+ rather than sending the user back to the plan they already have.
 */
export function resolveUpgradeTier(
  currentTier: UserTier,
  requiredTier: RequiredTier,
): RequiredTier {
  // Lifetime plans cannot currently be replaced by recurring subscriptions.
  // Keep their required tier unchanged; the dialog explains that there is no
  // direct upgrade path instead of presenting a checkout that the API rejects.
  if (
    currentTier === "LIFETIME_PRO" ||
    currentTier === "LIFETIME_PRO_PLUS"
  ) {
    return requiredTier;
  }
  if (requiredTier === "PRO" && tierRank(currentTier) >= tierRank("PRO")) {
    return "PRO_PLUS";
  }
  return requiredTier;
}
