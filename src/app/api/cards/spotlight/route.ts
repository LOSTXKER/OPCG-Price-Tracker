import { NextResponse } from "next/server";

import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";

/** The popular rail is a horizontal chip strip — six fills the swipe. */
const POPULAR_COUNT = 6;

/** Movers is a vertical list, and the palette is full-screen on phones since
 *  2026-08-29: six rows left half the screen empty. Twelve fills it and gives
 *  the scroll somewhere to go (owner call: "มาแรงเอายาวเต็มจอไปเลย"). */
const MOVERS_COUNT = 12;

/**
 * Same junk floor as the ticker (see ../ticker/route.ts): ranking by
 * percentage alone surfaces ¥120 commons whose quantised moves tie at
 * "-20.0%" and read as broken data.
 */
const MIN_PRICE_JPY = 500;

const spotlightSelect = {
  cardCode: true,
  nameJp: true,
  nameEn: true,
  nameTh: true,
  rarity: true,
  imageUrl: true,
  latestPriceJpy: true,
  latestPriceThb: true,
  priceChange24h: true,
  set: { select: { code: true } },
} as const;

/**
 * What the search palette shows BEFORE the visitor types (CoinMarketCap-style
 * empty state): the most-viewed cards as a chip rail, plus the strongest 24h
 * movers as a priced list. Fetched once per page lifetime when the palette
 * first opens — never on page load — so it stays a small, index-riding payload.
 */
export const GET = apiHandler(async () => {
  const [popular, movers] = await Promise.all([
    prisma.card.findMany({
      where: { viewCount: { gt: 0 }, latestPriceJpy: { gt: 0 } },
      orderBy: { viewCount: "desc" },
      take: POPULAR_COUNT,
      select: spotlightSelect,
    }),
    prisma.card.findMany({
      where: { latestPriceJpy: { gte: MIN_PRICE_JPY }, priceChange24h: { not: null } },
      orderBy: { priceChange24h: "desc" },
      take: MOVERS_COUNT,
      select: spotlightSelect,
    }),
  ]);

  return NextResponse.json({ popular, movers });
});
