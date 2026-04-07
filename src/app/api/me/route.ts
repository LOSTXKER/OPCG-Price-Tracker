import { ListingStatus } from "@/generated/prisma/client";
import { requireAuthUser } from "@/lib/api/auth";
import { cardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { canCheckinToday } from "@/lib/honey";
import { getHoneyLevel } from "@/lib/honey/levels";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:me");

export async function GET() {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

    const userId = dbUser.id;

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

    const portfolioTotalValueJpy = latestSnapshot?.totalJpy
      ?? portfolioItems.reduce(
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
      points: dbUser.honeyPoints,
      streak: dbUser.checkinStreak,
      canCheckin,
      level: getHoneyLevel(dbUser.honeyLifetimeEarned),
    };

    const subscription = {
      tier: dbUser.tier,
      tierExpiresAt: dbUser.tierExpiresAt,
      trialStartedAt: dbUser.trialStartedAt,
      trialUsed: dbUser.trialUsed,
      hasStripeSubscription: !!dbUser.stripeSubscriptionId,
      lineConnected: !!dbUser.lineUserId,
    };

    return NextResponse.json({ user: dbUser, listings, stats, honey, subscription });
  } catch (error) {
    log.error("GET /api/me", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

    const parsed = await parseJsonBody<{
      displayName?: string;
      bio?: string | null;
      profileVisibility?: string;
      showCollection?: boolean;
      showListings?: boolean;
      showDecks?: boolean;
      showStats?: boolean;
    }>(request);
    if (!parsed.ok) return parsed.response;

    const data: Record<string, unknown> = {};

    if (parsed.body.displayName !== undefined) {
      const displayName =
        typeof parsed.body.displayName === "string"
          ? parsed.body.displayName.trim().slice(0, 120)
          : "";
      if (!displayName) {
        return NextResponse.json({ error: "displayName is required" }, { status: 400 });
      }
      data.displayName = displayName;
    }

    if (parsed.body.bio !== undefined) {
      data.bio = typeof parsed.body.bio === "string"
        ? parsed.body.bio.trim().slice(0, 500) || null
        : null;
    }

    if (parsed.body.profileVisibility !== undefined) {
      const valid = ["public", "friends", "private"];
      if (valid.includes(parsed.body.profileVisibility)) {
        data.profileVisibility = parsed.body.profileVisibility;
      }
    }

    for (const key of ["showCollection", "showListings", "showDecks", "showStats"] as const) {
      if (parsed.body[key] !== undefined) {
        data[key] = !!parsed.body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data,
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    log.error("PATCH /api/me", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error("DELETE /api/me", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
