import { getAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { PriceSource, type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { PRICE_SOURCE } from "@/lib/constants/prices";
import { effectiveTier, getLimits } from "@/lib/billing";
import { findCardByCode } from "@/lib/data/card-detail";
import { NextRequest, NextResponse } from "next/server";

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) => {
  const { code } = await params;
  const period = request.nextUrl.searchParams.get("period") || "7d";
  const sourceParam = request.nextUrl.searchParams.get("source") || undefined;
  const source = sourceParam && Object.values(PriceSource).includes(sourceParam as PriceSource)
    ? sourceParam as PriceSource
    : undefined;
  const grade = request.nextUrl.searchParams.get("grade") || undefined;

  if (sourceParam && !source) {
    return NextResponse.json({ error: "Invalid price source" }, { status: 400 });
  }

  const card = await findCardByCode(code, { select: { id: true } });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const dbUser = await getAuthUser();
  const tier = dbUser ? effectiveTier(dbUser.tier, dbUser.tierExpiresAt) : "FREE";
  const limits = getLimits(tier);
  const maxDays = limits.priceHistoryDays === Infinity ? Infinity : limits.priceHistoryDays;

  const PERIOD_DAYS: Record<string, number> = {
    "24h": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
    all: Infinity,
  };
  const requestedDays = PERIOD_DAYS[period] ?? 7;
  const effectiveDays = maxDays === Infinity ? requestedDays : Math.min(requestedDays, maxDays);

  const whereClause: Prisma.CardPriceWhereInput = {
    cardId: card.id,
    type: "SELL",
  };

  if (source) {
    whereClause.source = source;
  }

  if (grade === "raw") {
    whereClause.gradeCondition = null;
  } else if (grade) {
    whereClause.gradeCondition = grade;
  }

  if (source === PRICE_SOURCE.YUYUTEI) {
    whereClause.priceJpy = { gt: 0 };
  } else if (source === PRICE_SOURCE.SNKRDUNK) {
    whereClause.priceUsd = { gt: 0 };
  }

  // A card can be stale while still having valid history. End the requested
  // window at its newest matching observation instead of at the wall clock.
  const latest = await prisma.cardPrice.findFirst({
    where: whereClause,
    orderBy: { scrapedAt: "desc" },
    select: { scrapedAt: true },
  });

  const since = latest && effectiveDays !== Infinity
    ? new Date(latest.scrapedAt.getTime() - effectiveDays * 24 * 60 * 60 * 1000)
    : null;

  const prices = latest
    ? await prisma.cardPrice.findMany({
        where: {
          ...whereClause,
          scrapedAt: since
            ? { gte: since, lte: latest.scrapedAt }
            : { lte: latest.scrapedAt },
        },
        orderBy: [{ scrapedAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          source: true,
          type: true,
          priceJpy: true,
          priceThb: true,
          priceUsd: true,
          priceEur: true,
          inStock: true,
          gradeCondition: true,
          scrapedAt: true,
        },
      })
    : [];

  const useUsd = source === PRICE_SOURCE.SNKRDUNK;
  const currency = useUsd ? "USD" : "JPY";

  let high: number, low: number, avg: number;
  if (useUsd) {
    const usdPrices = prices
      .filter((p) => p.priceUsd !== null)
      .map((p) => p.priceUsd!);
    high = usdPrices.length ? Math.max(...usdPrices) : 0;
    low = usdPrices.length ? Math.min(...usdPrices) : 0;
    avg = usdPrices.length
      ? Math.round(usdPrices.reduce((a, b) => a + b, 0) / usdPrices.length)
      : 0;
  } else {
    const jpyPrices = prices
      .filter((p) => p.priceJpy !== null)
      .map((p) => p.priceJpy!);
    high = jpyPrices.length ? Math.max(...jpyPrices) : 0;
    low = jpyPrices.length ? Math.min(...jpyPrices) : 0;
    avg = jpyPrices.length
      ? Math.round(jpyPrices.reduce((a, b) => a + b, 0) / jpyPrices.length)
      : 0;
  }

  const sources = [...new Set(prices.map((p) => p.source))];

  return NextResponse.json({
    prices,
    high,
    low,
    avg,
    sources,
    currency,
    // JSON cannot represent Infinity. Match the other quota endpoints: null
    // means the effective plan allows the complete stored history.
    effectiveDays: effectiveDays === Infinity ? null : effectiveDays,
  });
});
