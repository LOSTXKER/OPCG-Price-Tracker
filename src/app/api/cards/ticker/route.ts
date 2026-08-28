import { NextResponse } from "next/server";

import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";

/** How many movers per direction feed the header ticker. */
const PER_DIRECTION = 6;

/**
 * Cheapest card the ticker will report on, in JPY (~150 THB).
 *
 * Percentage alone makes a rail of junk: a ¥120 common that moved ¥24 posts the
 * same "-20.0%" as a ¥10,000 leader that moved ¥2,000, and because cheap cards
 * quantise, three of them tie at exactly -20.0% and read as broken data. VISION
 * §5.3 settles this for portfolio movers — rank by the size of the swing, not
 * the ratio. There is no stored swing column to sort on, so the floor buys the
 * same honesty while the query keeps riding the `priceChange24h` index.
 */
const MIN_PRICE_JPY = 500;

const moverSelect = {
  cardCode: true,
  nameJp: true,
  nameEn: true,
  nameTh: true,
  latestPriceJpy: true,
  latestPriceThb: true,
  priceChange24h: true,
} as const;

/**
 * Everything the header strip shows, in one small payload.
 *
 * It replaces the old `/api/cards?limit=1` call the header used for its
 * figures: that route returns a whole card row (set relation, graded price
 * join, facet scaffolding) just to read two aggregates. This one selects only
 * the seven scalar columns the strip paints, and adds the movers the ticker
 * scrolls — so the header still costs the same two requests it always did.
 */
export const GET = apiHandler(async () => {
  const movingCards = {
    latestPriceJpy: { gte: MIN_PRICE_JPY },
    priceChange24h: { not: null },
  };

  const [totalCards, valueAgg, latestPrice, gainers, losers] = await Promise.all([
    prisma.card.count(),
    prisma.card.aggregate({
      _sum: { latestPriceJpy: true },
      where: { latestPriceJpy: { gt: 0 } },
    }),
    // Freshest scrape overall — the strip's "อัปเดตล่าสุด" figure.
    prisma.cardPrice.findFirst({
      orderBy: { scrapedAt: "desc" },
      select: { scrapedAt: true },
    }),
    // Both directions ride the `priceChange24h` index (declared desc, so the
    // ascending read walks the same B-tree backwards).
    prisma.card.findMany({
      where: movingCards,
      orderBy: { priceChange24h: "desc" },
      take: PER_DIRECTION,
      select: moverSelect,
    }),
    prisma.card.findMany({
      where: movingCards,
      orderBy: { priceChange24h: "asc" },
      take: PER_DIRECTION,
      select: moverSelect,
    }),
  ]);

  // Interleave gain/loss so the scrolling strip reads as a market, not as a
  // ranked leaderboard that happens to flip colour halfway through.
  const movers: typeof gainers = [];
  for (let index = 0; index < PER_DIRECTION; index += 1) {
    const gainer = gainers[index];
    const loser = losers[index];
    if (gainer) movers.push(gainer);
    // A thin catalog can surface the same card at both ends of the sort.
    if (loser && !movers.some((card) => card.cardCode === loser.cardCode)) {
      movers.push(loser);
    }
  }

  return NextResponse.json({
    totalCards,
    totalValue: valueAgg._sum.latestPriceJpy ?? 0,
    lastPriceAt: latestPrice?.scrapedAt ?? null,
    movers,
  });
});
