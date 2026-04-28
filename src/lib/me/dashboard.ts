import { ListingStatus } from "@/generated/prisma/client";
import { cardInclude } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";
import { canCheckinToday } from "@/lib/honey";
import { getHoneyLevel } from "@/lib/honey/levels";

export type DashboardUser = {
  id: string;
  honeyPoints: number;
  honeyLifetimeEarned: number;
  checkinStreak: number;
  tier: string;
  tierExpiresAt: Date | null;
  trialStartedAt: Date | null;
  trialUsed: boolean;
  stripeSubscriptionId: string | null;
  lineUserId: string | null;
};

/**
 * Aggregate the data the `/me` dashboard needs in a single round trip. Reads
 * are run in parallel; the route is reduced to "fetch + return".
 */
export async function getDashboardSnapshot(user: DashboardUser) {
  const userId = user.id;

  const [listings, counts, portfolioItems, latestSnapshot, canCheckin] = await Promise.all([
    prisma.listing.findMany({
      where: { userId, status: ListingStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { card: { include: cardInclude } },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            portfolios: true,
            watchlistItems: true,
            priceAlerts: true,
            decks: true,
            listings: true,
            reviewsReceived: true,
          },
        },
      },
    }),
    prisma.portfolioItem.findMany({
      where: { portfolio: { userId } },
      select: { quantity: true, card: { select: { latestPriceJpy: true } } },
    }),
    prisma.portfolioSnapshot.findFirst({
      where: { portfolio: { userId } },
      orderBy: { snapshotAt: "desc" },
      select: { totalJpy: true },
    }),
    canCheckinToday(userId),
  ]);

  const portfolioTotalValueJpy =
    latestSnapshot?.totalJpy ??
    portfolioItems.reduce(
      (sum, item) => sum + (item.card.latestPriceJpy ?? 0) * item.quantity,
      0,
    );

  const stats = {
    portfolioCount: counts?._count.portfolios ?? 0,
    portfolioTotalValueJpy,
    portfolioCardCount: portfolioItems.length,
    watchlistCount: counts?._count.watchlistItems ?? 0,
    priceAlertCount: counts?._count.priceAlerts ?? 0,
    deckCount: counts?._count.decks ?? 0,
    activeListingCount: counts?._count.listings ?? 0,
    reviewCount: counts?._count.reviewsReceived ?? 0,
  };

  const honey = {
    points: user.honeyPoints,
    streak: user.checkinStreak,
    canCheckin,
    level: getHoneyLevel(user.honeyLifetimeEarned),
  };

  const subscription = {
    tier: user.tier,
    tierExpiresAt: user.tierExpiresAt,
    trialStartedAt: user.trialStartedAt,
    trialUsed: user.trialUsed,
    hasStripeSubscription: !!user.stripeSubscriptionId,
    lineConnected: !!user.lineUserId,
  };

  return { listings, stats, honey, subscription };
}
