import type { UserTier } from "@/generated/prisma/client";

/**
 * Source of truth for plan numeric limits and tier comparison helpers.
 *
 * Everything billing-related (entitlements UI, tier gates, pricing tables,
 * upgrade dialogs) derives from `TIER_LIMITS` so changing a number ripples
 * to /pricing, /settings/subscription, and the upgrade dialog at once.
 *
 * Lifetime tiers are mapped onto their paid equivalents via `tierRank` /
 * `effectiveTier`, so `getLimits` returns the correct row regardless of
 * whether the user is on a subscription or a one-time purchase.
 */

const TIER_RANK: Record<UserTier, number> = {
  FREE: 0,
  PRO: 1,
  PRO_PLUS: 2,
  LIFETIME_PRO: 1,
  LIFETIME_PRO_PLUS: 2,
};

export function tierRank(tier: UserTier): number {
  return TIER_RANK[tier] ?? 0;
}

export function isAtLeast(userTier: UserTier, required: UserTier): boolean {
  return tierRank(userTier) >= tierRank(required);
}

export function isPro(tier: UserTier): boolean {
  return isAtLeast(tier, "PRO");
}

export function isProPlus(tier: UserTier): boolean {
  return isAtLeast(tier, "PRO_PLUS");
}

export function isLifetime(tier: UserTier): boolean {
  return tier === "LIFETIME_PRO" || tier === "LIFETIME_PRO_PLUS";
}

export function isTierActive(tier: UserTier, expiresAt: Date | null): boolean {
  if (tier === "FREE") return true;
  if (isLifetime(tier)) return true;
  if (!expiresAt) return false;
  return expiresAt > new Date();
}

export function effectiveTier(tier: UserTier, expiresAt: Date | null): UserTier {
  if (isTierActive(tier, expiresAt)) return tier;
  return "FREE";
}

export const TIER_LIMITS = {
  FREE: {
    portfolioCards: 30,
    portfolioCount: 1,
    watchlistCards: 15,
    priceAlerts: 3,
    deckCount: 1,
    savedFilters: 3,
    priceHistoryDays: 30,
    csvExport: false,
    compareCards: 2,
    marketplaceFeePercent: 5,
    bulkPriceLookup: 0,
    lineAlerts: false,
    weeklyDigest: false,
    honeyMultiplier: 1,
    listingBoostFree: 0,
    autoPricing: false,
  },
  PRO: {
    portfolioCards: 300,
    portfolioCount: 5,
    watchlistCards: 100,
    priceAlerts: 30,
    deckCount: 10,
    savedFilters: 10,
    priceHistoryDays: 365,
    csvExport: true,
    compareCards: 5,
    marketplaceFeePercent: 4,
    bulkPriceLookup: 100,
    lineAlerts: true,
    weeklyDigest: true,
    honeyMultiplier: 2,
    listingBoostFree: 1,
    autoPricing: false,
  },
  PRO_PLUS: {
    portfolioCards: Infinity,
    portfolioCount: Infinity,
    watchlistCards: Infinity,
    priceAlerts: Infinity,
    deckCount: Infinity,
    savedFilters: Infinity,
    priceHistoryDays: Infinity,
    csvExport: true,
    compareCards: Infinity,
    marketplaceFeePercent: 3,
    bulkPriceLookup: 500,
    lineAlerts: true,
    weeklyDigest: true,
    honeyMultiplier: 3,
    listingBoostFree: 3,
    autoPricing: true,
  },
} as const;

export type TierLimits = (typeof TIER_LIMITS)[keyof typeof TIER_LIMITS];

/**
 * Resolve plan limits for a tier (handles Lifetime variants & FREE fallback).
 * Use this everywhere instead of indexing TIER_LIMITS directly so Lifetime
 * tiers don't fall through to FREE.
 */
export function getLimits(tier: UserTier): TierLimits {
  if (isProPlus(tier)) return TIER_LIMITS.PRO_PLUS;
  if (isPro(tier)) return TIER_LIMITS.PRO;
  return TIER_LIMITS.FREE;
}
