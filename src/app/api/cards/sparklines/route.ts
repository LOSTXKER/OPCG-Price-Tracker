import { apiHandler } from "@/lib/api/api-handler";
import { PRICE_SOURCE } from "@/lib/constants/prices";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:cards");
const DAY_MS = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 30;
const MAX_CARD_IDS = 50;
const RAW_SPARKLINE_FILTER = {
  source: PRICE_SOURCE.YUYUTEI,
  type: "SELL" as const,
  gradeCondition: null,
  priceJpy: { not: null },
};

type SparklinePrice = {
  cardId: number;
  priceJpy: number | null;
  scrapedAt: Date;
};

function buildSparklines(prices: SparklinePrice[]): Record<number, number[]> {
  const dailyPricesByCard = new Map<number, Map<string, SparklinePrice>>();

  for (const price of prices) {
    if (price.priceJpy == null) continue;

    const day = price.scrapedAt.toISOString().slice(0, 10);
    const dailyPrices = dailyPricesByCard.get(price.cardId) ?? new Map();
    const current = dailyPrices.get(day);

    // The query is chronological, so equal timestamps also resolve to the
    // later-created row via the secondary id ordering.
    if (!current || current.scrapedAt.getTime() <= price.scrapedAt.getTime()) {
      dailyPrices.set(day, price);
    }
    dailyPricesByCard.set(price.cardId, dailyPrices);
  }

  const sparklines: Record<number, number[]> = {};
  for (const [cardId, dailyPrices] of dailyPricesByCard) {
    sparklines[cardId] = [...dailyPrices.values()]
      .sort((a, b) => a.scrapedAt.getTime() - b.scrapedAt.getTime())
      .map((price) => price.priceJpy!);
  }

  return sparklines;
}

export const GET = apiHandler(async (request: NextRequest) => {
  const ids = request.nextUrl.searchParams.get("ids") || "";
  if (!ids) {
    return NextResponse.json({ sparklines: {} });
  }

  const cardIds = [...new Set(
    ids
      .split(",")
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id)),
  )].slice(0, MAX_CARD_IDS);

  if (cardIds.length === 0) {
    return NextResponse.json({ sparklines: {} });
  }

  const latestSnapshots = await prisma.cardPrice
    .groupBy({
      by: ["cardId"],
      where: {
        cardId: { in: cardIds },
        ...RAW_SPARKLINE_FILTER,
      },
      _max: { scrapedAt: true },
    })
    .catch((error: unknown) => {
      log.error("Error fetching latest sparkline snapshots", error);
      return null;
    });

  if (!latestSnapshots) {
    return NextResponse.json({ sparklines: {} });
  }

  const latestByCardId = new Map<number, Date>();
  for (const snapshot of latestSnapshots) {
    if (snapshot._max.scrapedAt) {
      latestByCardId.set(snapshot.cardId, snapshot._max.scrapedAt);
    }
  }
  const cardWindows = cardIds.flatMap((cardId) => {
    const latest = latestByCardId.get(cardId);
    if (!latest) return [];
    return [{
      cardId,
      scrapedAt: {
        gte: new Date(latest.getTime() - LOOKBACK_DAYS * DAY_MS),
        lte: latest,
      },
    }];
  });

  if (cardWindows.length === 0) {
    return NextResponse.json({ sparklines: {} });
  }

  let prices: SparklinePrice[];
  try {
    prices = await prisma.cardPrice.findMany({
      where: {
        ...RAW_SPARKLINE_FILTER,
        OR: cardWindows,
      },
      orderBy: [{ scrapedAt: "asc" }, { id: "asc" }],
      select: {
        cardId: true,
        priceJpy: true,
        scrapedAt: true,
      },
    });
  } catch (error) {
    log.error("Error fetching sparklines", error);
    return NextResponse.json({ sparklines: {} });
  }

  return NextResponse.json({ sparklines: buildSparklines(prices) });
});
