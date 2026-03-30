/**
 * Daily price update module.
 *
 * Uses approved YuyuteiMapping entries to update card prices.
 * Scrapes Yuyutei → finds matching mapping by yuyuteiId → updates card price.
 * New/unknown listings are saved to YuyuteiMapping as "pending" for admin review.
 */
import { MappingStatus, type PrismaClient } from "@/generated/prisma/client";
import { PRICE_SOURCE } from "@/lib/constants/prices";
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

    if (mapping && mapping.status === MappingStatus.MATCHED && mapping.matchedCardId) {
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
          source: PRICE_SOURCE.YUYUTEI,
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
          status: MappingStatus.PENDING,
        },
      });
      unmatched++;
    }
  }

  return { setCode, matched, unmatched, listings: listings.length };
}

/**
 * Compute 24h, 7d, and 30d price change percentages for all cards with prices.
 * Uses a single SQL statement with LATERAL joins to batch-compute reference
 * prices for all cards, then updates them in one pass (replaces the old N+1 loop).
 */
export async function computePriceChanges(db: DB): Promise<void> {
  await db.$executeRaw`
    UPDATE "Card" AS c
    SET
      "priceChange24h" = CASE
        WHEN p24."priceJpy" IS NOT NULL AND p24."priceJpy" > 0
        THEN ROUND(((c."latestPriceJpy" - p24."priceJpy")::numeric / p24."priceJpy") * 10000) / 100.0
        ELSE NULL
      END,
      "priceChange7d" = CASE
        WHEN p7."priceJpy" IS NOT NULL AND p7."priceJpy" > 0
        THEN ROUND(((c."latestPriceJpy" - p7."priceJpy")::numeric / p7."priceJpy") * 10000) / 100.0
        ELSE NULL
      END,
      "priceChange30d" = CASE
        WHEN p30."priceJpy" IS NOT NULL AND p30."priceJpy" > 0
        THEN ROUND(((c."latestPriceJpy" - p30."priceJpy")::numeric / p30."priceJpy") * 10000) / 100.0
        ELSE NULL
      END
    FROM "Card" AS c2
    LEFT JOIN LATERAL (
      SELECT cp."priceJpy"
      FROM "CardPrice" cp
      WHERE cp."cardId" = c2.id AND cp."source" = 'YUYUTEI'
        AND cp."scrapedAt" <= NOW() - INTERVAL '1 day'
      ORDER BY cp."scrapedAt" DESC
      LIMIT 1
    ) p24 ON true
    LEFT JOIN LATERAL (
      SELECT cp."priceJpy"
      FROM "CardPrice" cp
      WHERE cp."cardId" = c2.id AND cp."source" = 'YUYUTEI'
        AND cp."scrapedAt" <= NOW() - INTERVAL '7 days'
      ORDER BY cp."scrapedAt" DESC
      LIMIT 1
    ) p7 ON true
    LEFT JOIN LATERAL (
      SELECT cp."priceJpy"
      FROM "CardPrice" cp
      WHERE cp."cardId" = c2.id AND cp."source" = 'YUYUTEI'
        AND cp."scrapedAt" <= NOW() - INTERVAL '30 days'
      ORDER BY cp."scrapedAt" DESC
      LIMIT 1
    ) p30 ON true
    WHERE c.id = c2.id AND c."latestPriceJpy" IS NOT NULL
  `;
}
