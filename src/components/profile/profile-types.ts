export type DbUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  tier: string;
  sellerRating: number | null;
  sellerReviewCount: number;
  honeyPoints: number;
  csvExportCredits: number;
  extraPriceAlertSlots: number;
  ticketBalance: number;
  profileVisibility: string;
  showCollection: boolean;
  showListings: boolean;
  showDecks: boolean;
  showStats: boolean;
  hidePortfolioPrices: boolean;
  hidePortfolioQty: boolean;
  profileSummaryOnly: boolean;
  handle: string | null;
  socialLine?: string | null;
  socialIg?: string | null;
  socialTwitter?: string | null;
  socialFacebook?: string | null;
  stripeCustomerId?: string | null;
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
  level?: { level: number; label: string; nextThreshold: number | null };
};

export type SubscriptionData = {
  tier: string;
  tierExpiresAt: string | null;
  trialStartedAt: string | null;
  trialUsed: boolean;
  hasStripeSubscription: boolean;
  lineConnected: boolean;
};

export type InvoiceItem = {
  id: string;
  number: string | null;
  amountPaid: number;
  currency: string;
  status: string | null;
  created: number;
  pdfUrl: string | null;
  hostedUrl: string | null;
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
  notifyPriceEmail: boolean;
  notifyPriceWeb: boolean;
  notifyPriceLine: boolean;
  notifyMarketEmail: boolean;
  notifyMarketWeb: boolean;
  notifyMarketLine: boolean;
  notifyHoneyEmail: boolean;
  notifyHoneyWeb: boolean;
  notifyHoneyLine: boolean;
  notifyDigestEmail: boolean;
  notifyDigestWeb: boolean;
  notifyDigestLine: boolean;
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
    return { label: "Pro+", color: "bg-amber-600 text-white", ring: "ring-amber-500/30" };
  if (tier === "PRO" || tier === "LIFETIME_PRO")
    return { label: "Pro", color: "bg-[#73533E] text-white", ring: "ring-[#A57E61]/30" };
  return { label: "Free", color: "bg-muted text-muted-foreground", ring: "ring-muted-foreground/30" };
}
