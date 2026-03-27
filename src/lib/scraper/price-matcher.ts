/**
 * Price-matching module for the Punk Records + Yuyutei pipeline.
 *
 * Cards are created from Punk Records (master data). Yuyutei provides prices.
 * Matching: yuyuteiId (fast) -> exact cardCode -> parallel rarity match.
 *
 * All functions accept a `db` (PrismaClient) parameter so the same logic
 * works from both Next.js routes (src/lib/db) and CLI scripts (scripts/_db).
 */
import type { ScrapedCardListing } from "./yuyu-tei";

/* eslint-disable @typescript-eslint/no-explicit-any */
type DB = any;

export interface MatchResult {
  setCode: string;
  matched: number;
  unmatched: number;
  listings: number;
}

function isParallelListing(listing: ScrapedCardListing): boolean {
  return (
    listing.name.includes("パラレル") ||
    (listing.rarity?.startsWith("P-") ?? false) ||
    listing.rarity === "SP"
  );
}

/**
 * Match a batch of Yuyu-tei listings to DB cards and update prices.
 * Creates CardPrice history rows and updates Card.latestPriceJpy / latestPriceThb.
 */
export async function matchAndUpdatePrices(
  db: DB,
  setCode: string,
  listings: ScrapedCardListing[],
  options?: { thbRate?: number }
): Promise<MatchResult> {
  let matched = 0;
  let unmatched = 0;

  const setFilter = { set: { code: setCode } };

  for (const listing of listings) {
    if (!listing.cardCode) {
      unmatched++;
      continue;
    }

    const code = listing.cardCode.toUpperCase();

    // 1. Match by yuyuteiId (fast path, scoped to set)
    let card = listing.yuyuteiId
      ? await db.card.findFirst({
          where: { yuyuteiId: listing.yuyuteiId, ...setFilter },
          select: { id: true },
        })
      : null;

    // 2. Exact cardCode match (scoped to set)
    if (!card) {
      card = await db.card.findFirst({
        where: { cardCode: code, ...setFilter },
        select: { id: true },
      });
    }

    // 3. Parallel match: baseCode + rarity + isParallel (scoped to set, prefer unlinked)
    if (!card && isParallelListing(listing) && listing.rarity) {
      card = await db.card.findFirst({
        where: {
          baseCode: code,
          isParallel: true,
          rarity: listing.rarity,
          yuyuteiId: null,
          ...setFilter,
        },
        select: { id: true },
        orderBy: { parallelIndex: "asc" },
      });
      if (!card) {
        card = await db.card.findFirst({
          where: { baseCode: code, isParallel: true, rarity: listing.rarity, ...setFilter },
          select: { id: true },
          orderBy: { parallelIndex: "asc" },
        });
      }
    }

    if (!card) {
      unmatched++;
      continue;
    }

    const priceThb =
      options?.thbRate != null
        ? Math.round(listing.priceJpy * options.thbRate * 100) / 100
        : undefined;

    await db.card.update({
      where: { id: card.id },
      data: {
        latestPriceJpy: listing.priceJpy,
        ...(priceThb != null && { latestPriceThb: priceThb }),
      },
    });

    await db.cardPrice.create({
      data: {
        cardId: card.id,
        source: "YUYUTEI",
        type: "SELL",
        priceJpy: listing.priceJpy,
        ...(priceThb != null && { priceThb }),
        inStock: listing.inStock,
      },
    });

    matched++;
  }

  return { setCode, matched, unmatched, listings: listings.length };
}

/**
 * Compute 24h and 7d price change percentages for all cards with prices.
 */
export async function computePriceChanges(db: DB): Promise<void> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const cards = await db.card.findMany({
    where: { latestPriceJpy: { not: null } },
    select: { id: true, latestPriceJpy: true },
  });

  for (const card of cards) {
    const currentPrice = card.latestPriceJpy;
    if (!currentPrice) continue;

    const price24h = await db.cardPrice.findFirst({
      where: {
        cardId: card.id,
        source: "YUYUTEI",
        scrapedAt: { lte: oneDayAgo },
      },
      orderBy: { scrapedAt: "desc" },
      select: { priceJpy: true },
    });

    const price7d = await db.cardPrice.findFirst({
      where: {
        cardId: card.id,
        source: "YUYUTEI",
        scrapedAt: { lte: sevenDaysAgo },
      },
      orderBy: { scrapedAt: "desc" },
      select: { priceJpy: true },
    });

    const p24h = price24h?.priceJpy;
    const p7d = price7d?.priceJpy;
    const change24h = p24h ? ((currentPrice - p24h) / p24h) * 100 : null;
    const change7d = p7d ? ((currentPrice - p7d) / p7d) * 100 : null;

    await db.card.update({
      where: { id: card.id },
      data: {
        priceChange24h: change24h ? Math.round(change24h * 100) / 100 : null,
        priceChange7d: change7d ? Math.round(change7d * 100) / 100 : null,
      },
    });
  }
}
