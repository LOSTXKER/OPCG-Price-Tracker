import { ListingStatus, OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

const RARE_RARITIES = ["SR", "SEC", "L", "SP", "P-SR", "P-SEC"];

export type ProfileSocialLinks = {
  line: string | null;
  ig: string | null;
  twitter: string | null;
  facebook: string | null;
};

export type ProfileAchievement = {
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  badgeImageUrl: string | null;
  earnedAt: string;
};

export type ProfileBadge = {
  id: number;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  imageUrl: string | null;
  grantedAt: string;
};

export type CollectionStats = {
  totalCards: number;
  uniqueCards: number;
  setsCollected: number;
  rareCount: number;
  topSets: Array<{
    code: string;
    name: string;
    nameEn: string | null;
    cardsOwned: number;
    cardCount: number;
    completionPct: number;
  }>;
};

export type SellerStats = {
  rating: number | null;
  reviewCount: number;
  completedDeals: number;
  responseHours: number | null;
  topReview: {
    rating: number;
    comment: string | null;
    reviewerName: string | null;
    createdAt: string;
  } | null;
  isVerified: boolean;
  /**
   * Best-effort "last seen" timestamp derived from existing signals — most
   * recent of: daily check-in, login event, or sent message. Null when the
   * seller has never produced any of those signals (brand new account).
   */
  lastSeenAt: string | null;
};

export type ProfilePrivacyFlags = {
  hidePortfolioPrices: boolean;
  hidePortfolioQty: boolean;
  summaryOnly: boolean;
  showListings: boolean;
  showCollection: boolean;
  showDecks: boolean;
  showStats: boolean;
};

/**
 * Resolve whether the viewer (current request) owns this profile.
 * Cached per request via Next.js dedupe.
 */
export async function resolveIsOwner(profileUserId: string): Promise<boolean> {
  try {
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
      const firstUser = await prisma.user.findFirst({ select: { id: true } });
      return firstUser?.id === profileUserId;
    }
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return false;
    const dbViewer = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      select: { id: true },
    });
    return dbViewer?.id === profileUserId;
  } catch {
    return false;
  }
}

export type ProfileUserSelect = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  tier: string;
  sellerRating: number | null;
  sellerReviewCount: number;
  createdAt: Date;
  handle: string | null;
  profileVisibility: string;
  showCollection: boolean;
  showListings: boolean;
  showDecks: boolean;
  showStats: boolean;
  hidePortfolioPrices: boolean;
  hidePortfolioQty: boolean;
  profileSummaryOnly: boolean;
  socialLine: string | null;
  socialIg: string | null;
  socialTwitter: string | null;
  socialFacebook: string | null;
  lastCheckinAt: Date | null;
  _count: {
    listings: number;
    reviewsReceived: number;
  };
};

export const profileUserSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  tier: true,
  sellerRating: true,
  sellerReviewCount: true,
  createdAt: true,
  handle: true,
  profileVisibility: true,
  showCollection: true,
  showListings: true,
  showDecks: true,
  showStats: true,
  hidePortfolioPrices: true,
  hidePortfolioQty: true,
  profileSummaryOnly: true,
  socialLine: true,
  socialIg: true,
  socialTwitter: true,
  socialFacebook: true,
  lastCheckinAt: true,
  _count: {
    select: {
      listings: { where: { status: ListingStatus.ACTIVE } },
      reviewsReceived: true,
    },
  },
} as const;

/**
 * Load all data needed for the public profile page given the user record.
 * Respects all privacy flags. Returns a fully-serialized payload safe to pass
 * into client components.
 */
export async function loadPublicProfileData(user: ProfileUserSelect, isOwner: boolean) {
  const summaryOnly = !isOwner && user.profileSummaryOnly;
  const canShowListings = isOwner || user.showListings;
  const canShowCollection = isOwner || user.showCollection;
  const canShowStats = isOwner || user.showStats;
  const canShowDecks = isOwner || user.showDecks;

  const fetchListings = canShowListings;
  const fetchCollectionList = canShowCollection && !summaryOnly;

  const portfolioWhere = isOwner
    ? { portfolio: { userId: user.id } }
    : { portfolio: { userId: user.id }, isPrivate: false };

  // Look up the viewer (if signed in) so we can resolve "did the viewer save
  // this seller?" without forcing an extra round-trip in the client.
  let viewerId: string | null = null;
  if (!isOwner) {
    try {
      if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
        const first = await prisma.user.findFirst({ select: { id: true } });
        viewerId = first?.id ?? null;
      } else {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const dbViewer = await prisma.user.findUnique({
            where: { supabaseId: authUser.id },
            select: { id: true },
          });
          viewerId = dbViewer?.id ?? null;
        }
      }
    } catch {
      viewerId = null;
    }
  }

  const [
    listings,
    reviews,
    portfolioCards,
    portfolioCardCount,
    achievementRows,
    badgeRows,
    portfolioCardSummary,
    rareCount,
    topReview,
    completedDeals,
    responseHours,
    viewerSavedSeller,
    latestLogin,
    latestSentMessage,
  ] = await Promise.all([
    fetchListings
      ? prisma.listing.findMany({
          where: { userId: user.id, status: ListingStatus.ACTIVE },
          orderBy: { createdAt: "desc" },
          take: 24,
          include: {
            card: {
              include: { set: { select: { code: true, name: true, nameEn: true } } },
            },
            user: {
              select: {
                displayName: true,
                avatarUrl: true,
                sellerRating: true,
                sellerReviewCount: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    prisma.review.findMany({
      where: { revieweeId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        reviewer: { select: { displayName: true, avatarUrl: true } },
      },
    }),
    fetchCollectionList
      ? prisma.portfolioItem.findMany({
          where: portfolioWhere,
          take: 30,
          orderBy: { addedAt: "desc" },
          select: {
            id: true,
            quantity: true,
            isPrivate: true,
            card: {
              select: {
                cardCode: true,
                nameJp: true,
                nameEn: true,
                rarity: true,
                imageUrl: true,
                latestPriceJpy: true,
                latestPriceThb: true,
                set: { select: { code: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    canShowCollection
      ? prisma.portfolioItem.count({ where: portfolioWhere })
      : Promise.resolve(0),
    prisma.userAchievement.findMany({
      where: { userId: user.id },
      orderBy: { earnedAt: "desc" },
      include: { achievement: true },
    }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      orderBy: { grantedAt: "desc" },
    }),
    canShowCollection
      ? prisma.portfolioItem.findMany({
          where: portfolioWhere,
          select: {
            quantity: true,
            card: {
              select: {
                rarity: true,
                set: { select: { id: true, code: true, name: true, nameEn: true, cardCount: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    canShowCollection
      ? prisma.portfolioItem.count({
          where: {
            ...portfolioWhere,
            card: { rarity: { in: RARE_RARITIES } },
          },
        })
      : Promise.resolve(0),
    prisma.review.findFirst({
      where: { revieweeId: user.id, rating: { gte: 4 } },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      include: { reviewer: { select: { displayName: true } } },
    }),
    prisma.order
      .count({
        where: {
          sellerId: user.id,
          status: { in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED] },
        },
      })
      .catch(() => 0),
    computeMedianResponseHours(user.id).catch(() => null),
    viewerId
      ? prisma.savedSeller
          .findUnique({
            where: { userId_sellerId: { userId: viewerId, sellerId: user.id } },
            select: { id: true },
          })
          .then((row) => !!row)
          .catch(() => false)
      : Promise.resolve(false),
    // Activity heat (Item B) — most recent login, plus most recent sent
    // message. We combine these with lastCheckinAt to estimate "last seen".
    prisma.loginHistory
      .findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      })
      .catch(() => null),
    prisma.message
      .findFirst({
        where: { senderId: user.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      })
      .catch(() => null),
  ]);

  // Pick the most recent of all activity timestamps. Brand-new users with no
  // activity yet get null (we won't render anything in the UI).
  const lastSeenCandidates: Date[] = [
    user.lastCheckinAt,
    latestLogin?.createdAt ?? null,
    latestSentMessage?.createdAt ?? null,
  ].filter((d): d is Date => d != null);
  const lastSeenAt = lastSeenCandidates.length
    ? new Date(Math.max(...lastSeenCandidates.map((d) => d.getTime())))
    : null;

  // ─── Compute collection stats ───
  const setMap = new Map<
    number,
    { code: string; name: string; nameEn: string | null; cardCount: number; cardsOwned: Set<string> }
  >();
  let totalCards = 0;
  for (const item of portfolioCardSummary) {
    totalCards += item.quantity;
    const set = item.card.set;
    if (!set) continue;
    const existing = setMap.get(set.id);
    if (existing) {
      // We need cardCode here, but didn't query it; approximate with set+rarity which is unique enough.
      // For accurate uniques, we'd need cardCode — fetch separately when summarizing.
    } else {
      setMap.set(set.id, {
        code: set.code,
        name: set.name,
        nameEn: set.nameEn,
        cardCount: set.cardCount,
        cardsOwned: new Set(),
      });
    }
  }

  // Re-fetch unique cardCodes per set for accurate completion (only if collection visible)
  let topSets: CollectionStats["topSets"] = [];
  if (canShowCollection && portfolioCardSummary.length > 0) {
    const detail = await prisma.portfolioItem.findMany({
      where: portfolioWhere,
      select: {
        card: { select: { cardCode: true, set: { select: { id: true } } } },
      },
    });
    const setUniques = new Map<number, Set<string>>();
    for (const d of detail) {
      const sid = d.card.set?.id;
      if (sid == null) continue;
      let s = setUniques.get(sid);
      if (!s) {
        s = new Set();
        setUniques.set(sid, s);
      }
      s.add(d.card.cardCode);
    }
    topSets = Array.from(setMap.entries())
      .map(([id, s]) => {
        const owned = setUniques.get(id)?.size ?? 0;
        const pct = s.cardCount > 0 ? Math.round((owned / s.cardCount) * 100) : 0;
        return {
          code: s.code,
          name: s.name,
          nameEn: s.nameEn,
          cardsOwned: owned,
          cardCount: s.cardCount,
          completionPct: pct,
        };
      })
      .sort((a, b) => b.completionPct - a.completionPct || b.cardsOwned - a.cardsOwned)
      .slice(0, 3);
  }

  const collectionStats: CollectionStats = {
    totalCards,
    uniqueCards: portfolioCardSummary.length,
    setsCollected: setMap.size,
    rareCount,
    topSets,
  };

  // ─── Achievements ───
  const achievements: ProfileAchievement[] = achievementRows.map((row) => ({
    code: row.achievement.code,
    name: row.achievement.name,
    nameEn: row.achievement.nameEn,
    nameTh: row.achievement.nameTh,
    description: row.achievement.description,
    badgeImageUrl: row.achievement.badgeImageUrl,
    earnedAt: row.earnedAt.toISOString(),
  }));

  const badges: ProfileBadge[] = badgeRows.map((row) => ({
    id: row.id,
    name: row.name,
    nameEn: row.nameEn,
    nameTh: row.nameTh,
    imageUrl: row.imageUrl,
    grantedAt: row.grantedAt.toISOString(),
  }));

  // ─── Seller stats ───
  const sellerStats: SellerStats = {
    rating: user.sellerRating,
    reviewCount: user.sellerReviewCount,
    completedDeals,
    responseHours,
    topReview: topReview
      ? {
          rating: topReview.rating,
          comment: topReview.comment,
          reviewerName: topReview.reviewer.displayName,
          createdAt: topReview.createdAt.toISOString(),
        }
      : null,
    // "Verified" = a seller who has demonstrated they can complete deals.
    // We deliberately keep the bar low enough to be reachable in the first
    // month or two of selling (3 completed deals, no major review issues),
    // similar to Etsy's "Star Seller" bronze tier. The blue check next to
    // the displayName is meant as a baseline trust signal — not an elite
    // award. Sellers without ratings yet are eligible because the rating is
    // optional from the buyer side.
    isVerified:
      completedDeals >= 3 && (user.sellerRating == null || user.sellerRating >= 4),
    lastSeenAt: lastSeenAt ? lastSeenAt.toISOString() : null,
  };

  const privacyFlags: ProfilePrivacyFlags = {
    hidePortfolioPrices: !isOwner && user.hidePortfolioPrices,
    hidePortfolioQty: !isOwner && user.hidePortfolioQty,
    summaryOnly,
    showListings: canShowListings,
    showCollection: canShowCollection,
    showDecks: canShowDecks,
    showStats: canShowStats,
  };

  const serializedListings = listings.map((l) => ({
    id: l.id,
    priceJpy: l.priceJpy,
    priceThb: l.priceThb,
    condition: l.condition,
    quantity: l.quantity,
    shipping: l.shipping,
    location: l.location,
    isFeatured: l.isFeatured,
    createdAt: l.createdAt.toISOString(),
    card: {
      cardCode: l.card.cardCode,
      nameJp: l.card.nameJp,
      nameEn: l.card.nameEn,
      rarity: l.card.rarity,
      imageUrl: l.card.imageUrl,
      latestPriceJpy: l.card.latestPriceJpy,
    },
    seller: {
      displayName: l.user.displayName,
      avatarUrl: l.user.avatarUrl,
      sellerRating: l.user.sellerRating,
      sellerReviewCount: l.user.sellerReviewCount,
    },
  }));

  // First active listing acts as a "general inquiry" anchor for the
  // profile-level Message CTA. Messages are scoped to a listing in our schema,
  // so we reuse the most recent one as the conversation thread.
  const firstListingId = serializedListings[0]?.id ?? null;

  const socials: ProfileSocialLinks = {
    line: user.socialLine,
    ig: user.socialIg,
    twitter: user.socialTwitter,
    facebook: user.socialFacebook,
  };
  const hasAnySocial =
    !!socials.line || !!socials.ig || !!socials.twitter || !!socials.facebook;

  const serializedReviews = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    reviewer: {
      displayName: r.reviewer.displayName,
      avatarUrl: r.reviewer.avatarUrl,
    },
  }));

  const serializedCollection = portfolioCards.map((pi) => ({
    cardCode: pi.card.cardCode,
    nameJp: pi.card.nameJp,
    nameEn: pi.card.nameEn,
    rarity: pi.card.rarity,
    imageUrl: pi.card.imageUrl,
    priceJpy: privacyFlags.hidePortfolioPrices ? null : pi.card.latestPriceJpy,
    priceThb: privacyFlags.hidePortfolioPrices ? null : pi.card.latestPriceThb,
    setCode: pi.card.set?.code ?? null,
    quantity: privacyFlags.hidePortfolioQty ? null : pi.quantity,
    isPrivate: pi.isPrivate,
  }));

  return {
    serialized: {
      user: {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        tier: user.tier,
        sellerRating: user.sellerRating,
        sellerReviewCount: user.sellerReviewCount,
        createdAt: user.createdAt.toISOString(),
        handle: user.handle,
        socials: hasAnySocial ? socials : null,
      },
      stats: {
        listingCount: user._count.listings,
        reviewCount: user._count.reviewsReceived,
        portfolioCardCount,
      },
      listings: serializedListings,
      reviews: serializedReviews,
      collectionCards: serializedCollection,
      achievements,
      badges,
      collectionStats,
      sellerStats,
      privacyFlags,
      firstListingId,
      viewerSavedSeller,
      viewerIsSignedIn: viewerId != null,
    },
    isOwner,
  };
}

/**
 * Compute median first-response time (in hours) for the seller's recent
 * "conversations" (grouped by listingId + counterparty) where the buyer
 * messaged first. Returns null if not enough data.
 */
async function computeMedianResponseHours(userId: string): Promise<number | null> {
  const messages = await prisma.message
    .findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: "asc" },
      take: 1000,
      select: {
        listingId: true,
        senderId: true,
        receiverId: true,
        createdAt: true,
      },
    })
    .catch(() => [] as Array<{ listingId: number; senderId: string; receiverId: string; createdAt: Date }>);

  // Group by listingId + counterparty (the OTHER user)
  type ConvKey = string;
  const buckets = new Map<ConvKey, Array<{ from: string; at: Date }>>();
  for (const m of messages) {
    const counterparty = m.senderId === userId ? m.receiverId : m.senderId;
    const key = `${m.listingId}::${counterparty}`;
    let arr = buckets.get(key);
    if (!arr) {
      arr = [];
      buckets.set(key, arr);
    }
    arr.push({ from: m.senderId, at: m.createdAt });
  }

  const deltas: number[] = [];
  for (const arr of buckets.values()) {
    const firstFromOther = arr.find((m) => m.from !== userId);
    if (!firstFromOther) continue;
    const firstReply = arr.find((m) => m.from === userId && m.at > firstFromOther.at);
    if (!firstReply) continue;
    const ms = firstReply.at.getTime() - firstFromOther.at.getTime();
    if (ms > 0) deltas.push(ms / 36e5);
    if (deltas.length >= 50) break;
  }
  if (deltas.length < 3) return null;
  deltas.sort((a, b) => a - b);
  const mid = Math.floor(deltas.length / 2);
  return deltas.length % 2 ? deltas[mid] : (deltas[mid - 1] + deltas[mid]) / 2;
}
