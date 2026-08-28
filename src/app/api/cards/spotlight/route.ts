import { NextResponse } from "next/server";

import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";

/** Rows per section in the search palette's empty state. */
const PER_SECTION = 6;

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
      take: PER_SECTION,
      select: spotlightSelect,
    }),
    prisma.card.findMany({
      where: { latestPriceJpy: { gte: MIN_PRICE_JPY }, priceChange24h: { not: null } },
      orderBy: { priceChange24h: "desc" },
      take: PER_SECTION,
      select: spotlightSelect,
    }),
  ]);

  return NextResponse.json({ popular, movers });
});
