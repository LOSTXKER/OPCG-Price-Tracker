export type DbUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  tier: string;
  sellerRating: number | null;
  sellerReviewCount: number;
  createdAt: string;
};

export type ListingBrief = {
  id: number;
  priceJpy: number;
  priceThb: number | null;
  card: { cardCode: string; nameJp: string; nameEn?: string | null };
};

export type ProfileStats = {
  portfolioCount: number;
  portfolioTotalValueJpy: number;
  portfolioCardCount: number;
  watchlistCount: number;
  priceAlertCount: number;
  deckCount: number;
  activeListingCount: number;
  reviewCount: number;
};

export type HoneyData = {
  points: number;
  streak: number;
  canCheckin: boolean;
};

export type SubscriptionData = {
  tier: string;
  tierExpiresAt: string | null;
  trialStartedAt: string | null;
  trialUsed: boolean;
  hasStripeSubscription: boolean;
  lineConnected: boolean;
};

export type SettingsData = {
  tier: string;
  tierExpiresAt: string | null;
  trialUsed: boolean;
  trialStartedAt: string | null;
  stripeCustomerId: boolean;
  stripeSubscriptionId: boolean;
  honeyPoints: number;
  lineConnected: boolean;
  emailAlerts: boolean;
  lineAlerts: boolean;
  weeklyDigest: boolean;
};

export type ProfileData = {
  user: DbUser;
  listings: ListingBrief[];
  stats: ProfileStats;
  honey: HoneyData;
  subscription: SubscriptionData;
};

export function getTierConfig(tier: string) {
  if (tier === "PRO_PLUS" || tier === "LIFETIME_PRO_PLUS")
    return { label: "Pro+", color: "bg-purple-500 text-white", ring: "ring-purple-500/30" };
  if (tier === "PRO" || tier === "LIFETIME_PRO")
    return { label: "Pro", color: "bg-blue-500 text-white", ring: "ring-blue-500/30" };
  return { label: "Free", color: "bg-muted text-muted-foreground", ring: "ring-border" };
}
