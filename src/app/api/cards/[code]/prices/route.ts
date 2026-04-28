import { getAuthUser } from "@/lib/auth";
import { apiHandler } from "@/lib/api/api-handler";
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
  const source = request.nextUrl.searchParams.get("source") || undefined;
  const grade = request.nextUrl.searchParams.get("grade") || undefined;

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

  const now = new Date();
  const since = effectiveDays === Infinity
    ? new Date(0)
    : new Date(now.getTime() - effectiveDays * 24 * 60 * 60 * 1000);

  const whereClause: Record<string, unknown> = {
    cardId: card.id,
    scrapedAt: { gte: since },
  };

  if (source) {
    whereClause.source = source;
  }

  if (grade === "raw") {
    whereClause.gradeCondition = null;
  } else if (grade) {
    whereClause.gradeCondition = grade;
  }

  const prices = await prisma.cardPrice.findMany({
    where: whereClause,
    orderBy: { scrapedAt: "asc" },
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
  });

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

  return NextResponse.json({ prices, high, low, avg, sources, currency });
});
