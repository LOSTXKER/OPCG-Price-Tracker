import { ListingStatus } from "@/generated/prisma/client";
import { requireAuthUser } from "@/lib/api/auth";
import { cardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { canCheckinToday } from "@/lib/honey";
import { getHoneyLevel } from "@/lib/honey/levels";
import { createLog } from "@/lib/logger";
import { apiHandler } from "@/lib/api/api-handler";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:me");

const RESERVED_HANDLES = new Set([
  "admin", "administrator", "api", "auth", "billing", "cards", "checkout",
  "community", "dashboard", "deck", "decks", "drop-calculator", "explore",
  "help", "home", "honey", "image", "images", "login", "logout", "marketplace",
  "me", "messages", "news", "notifications", "onboarding", "orders", "page",
  "pages", "portfolio", "pricing", "privacy", "profile", "public", "saved",
  "search", "seller", "settings", "share", "signup", "signin", "static",
  "stats", "support", "terms", "user", "users", "watchlist", "wrap", "you",
  "meecard", "root", "system", "null", "undefined",
]);

export const GET = apiHandler(async () => {
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
});

export const PATCH = apiHandler(async (request: NextRequest) => {
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
      hidePortfolioPrices?: boolean;
      hidePortfolioQty?: boolean;
      profileSummaryOnly?: boolean;
      handle?: string | null;
      socialLine?: string | null;
      socialIg?: string | null;
      socialTwitter?: string | null;
      socialFacebook?: string | null;
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

    for (const key of [
      "showCollection",
      "showListings",
      "showDecks",
      "showStats",
      "hidePortfolioPrices",
      "hidePortfolioQty",
      "profileSummaryOnly",
    ] as const) {
      if (parsed.body[key] !== undefined) {
        data[key] = !!parsed.body[key];
      }
    }

    // Optional social/contact handles. Stored as plain text — visitors copy/click
    // them on the public profile. Light validation only.
    const SOCIAL_LIMITS: Record<"socialLine" | "socialIg" | "socialTwitter" | "socialFacebook", number> = {
      socialLine: 60,
      socialIg: 60,
      socialTwitter: 60,
      socialFacebook: 120,
    };
    for (const key of ["socialLine", "socialIg", "socialTwitter", "socialFacebook"] as const) {
      const raw = parsed.body[key];
      if (raw === undefined) continue;
      if (raw === null || raw === "") {
        data[key] = null;
        continue;
      }
      if (typeof raw !== "string") continue;
      const trimmed = raw.trim().slice(0, SOCIAL_LIMITS[key]);
      data[key] = trimmed || null;
    }

    if (parsed.body.handle !== undefined) {
      const raw = parsed.body.handle;
      if (raw === null || raw === "") {
        data.handle = null;
      } else if (typeof raw === "string") {
        const handle = raw.trim().toLowerCase().replace(/^@/, "");
        if (!/^[a-z0-9_]{3,24}$/.test(handle)) {
          return NextResponse.json(
            { error: "Handle must be 3-24 chars: lowercase letters, numbers, underscore" },
            { status: 400 },
          );
        }
        if (RESERVED_HANDLES.has(handle)) {
          return NextResponse.json({ error: "This handle is reserved" }, { status: 400 });
        }
        const existing = await prisma.user.findUnique({
          where: { handle },
          select: { id: true },
        });
        if (existing && existing.id !== dbUser.id) {
          return NextResponse.json({ error: "This handle is already taken" }, { status: 409 });
        }
        data.handle = handle;
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
});

export const DELETE = apiHandler(async () => {
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
});
