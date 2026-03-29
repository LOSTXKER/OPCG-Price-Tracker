/**
 * Daily price update module.
 *
 * Uses approved YuyuteiMapping entries to update card prices.
 * Scrapes Yuyutei → finds matching mapping by yuyuteiId → updates card price.
 * New/unknown listings are saved to YuyuteiMapping as "pending" for admin review.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import type { ScrapedCardListing } from "./yuyu-tei";

type DB = PrismaClient;

export interface MatchResult {
  setCode: string;
  matched: number;
  unmatched: number;
  listings: number;
}

/**
 * Update prices for a set using approved YuyuteiMapping entries.
 */
export async function matchAndUpdatePrices(
  db: DB,
  setCode: string,
  listings: ScrapedCardListing[],
  options?: { thbRate?: number }
): Promise<MatchResult> {
  let matched = 0;
  let unmatched = 0;

  for (const listing of listings) {
    if (!listing.cardCode || !listing.yuyuteiId) {
      unmatched++;
      continue;
    }

    // Find approved mapping for this yuyuteiId in this set
    const mapping = await db.yuyuteiMapping.findUnique({
      where: {
        setCode_yuyuteiId: { setCode, yuyuteiId: listing.yuyuteiId },
      },
      select: { id: true, matchedCardId: true, status: true },
    });

    if (mapping && mapping.status === "matched" && mapping.matchedCardId) {
      const priceThb =
        options?.thbRate != null
          ? Math.round(listing.priceJpy * options.thbRate * 100) / 100
          : undefined;

      // Update card price
      await db.card.update({
        where: { id: mapping.matchedCardId },
        data: {
          latestPriceJpy: listing.priceJpy,
          ...(priceThb != null && { latestPriceThb: priceThb }),
        },
      });

      // Create price history
      await db.cardPrice.create({
        data: {
          cardId: mapping.matchedCardId,
          source: "YUYUTEI",
          type: "SELL",
          priceJpy: listing.priceJpy,
          ...(priceThb != null && { priceThb }),
          inStock: listing.inStock,
        },
      });

      // Update mapping price
      await db.yuyuteiMapping.update({
        where: { id: mapping.id },
        data: { priceJpy: listing.priceJpy },
      });

      matched++;
    } else if (mapping) {
      // Mapping exists but not approved — just update price in mapping
      await db.yuyuteiMapping.update({
        where: { id: mapping.id },
        data: {
          priceJpy: listing.priceJpy,
          scrapedName: listing.name,
          scrapedImage: listing.imageUrl || null,
        },
      });
      unmatched++;
    } else {
      // New listing — save for admin review
      await db.yuyuteiMapping.create({
        data: {
          setCode,
          yuyuteiId: listing.yuyuteiId,
          scrapedCode: listing.cardCode,
          scrapedRarity: listing.rarity || null,
          scrapedName: listing.name,
          scrapedImage: listing.imageUrl || null,
          priceJpy: listing.priceJpy,
          status: "pending",
        },
      });
      unmatched++;
    }
  }

  return { setCode, matched, unmatched, listings: listings.length };
}

/**
 * Compute 24h, 7d, and 30d price change percentages for all cards with prices.
 */
export async function computePriceChanges(db: DB): Promise<void> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const cards = await db.card.findMany({
    where: { latestPriceJpy: { not: null } },
    select: { id: true, latestPriceJpy: true },
  });

  for (const card of cards) {
    const currentPrice = card.latestPriceJpy;
    if (!currentPrice) continue;

    const [price24h, price7d, price30d] = await Promise.all([
      db.cardPrice.findFirst({
        where: { cardId: card.id, source: "YUYUTEI", scrapedAt: { lte: oneDayAgo } },
        orderBy: { scrapedAt: "desc" },
        select: { priceJpy: true },
      }),
      db.cardPrice.findFirst({
        where: { cardId: card.id, source: "YUYUTEI", scrapedAt: { lte: sevenDaysAgo } },
        orderBy: { scrapedAt: "desc" },
        select: { priceJpy: true },
      }),
      db.cardPrice.findFirst({
        where: { cardId: card.id, source: "YUYUTEI", scrapedAt: { lte: thirtyDaysAgo } },
        orderBy: { scrapedAt: "desc" },
        select: { priceJpy: true },
      }),
    ]);

    const pctChange = (current: number, old: number | null | undefined) =>
      old ? Math.round(((current - old) / old) * 100 * 100) / 100 : null;

    await db.card.update({
      where: { id: card.id },
      data: {
        priceChange24h: pctChange(currentPrice, price24h?.priceJpy),
        priceChange7d: pctChange(currentPrice, price7d?.priceJpy),
        priceChange30d: pctChange(currentPrice, price30d?.priceJpy),
      },
    });
  }
}
