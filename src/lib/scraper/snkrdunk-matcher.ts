/**
 * SNKRDUNK price matcher — updates CardPrice records from approved SnkrdunkMappings.
 *
 * Stores:
 *  - SELL + no gradeCondition   → current raw/new listing min price
 *  - SELL + gradeCondition=PSA 10  → lowest available PSA10 listing
 *  - SOLD + gradeCondition=PSA 10  → most recently sold PSA10 price
 *  - SOLD + no gradeCondition   → most recently sold price (any condition)
 */
import {
  MappingStatus,
  MatchMethod,
  type PrismaClient,
} from "@/generated/prisma/client";
import { PRICE_SOURCE } from "@/lib/constants/prices";
import { createLog } from "@/lib/logger";
import type { SnkrdunkPriceData } from "./snkrdunk";
import { fetchWithRetry } from "./snkrdunk";
import { sleep, SCRAPE_DELAY_MS } from "./http-utils";

const log = createLog("scraper:snkrdunk");

type DB = PrismaClient;

export interface SnkrdunkMatchResult {
  processed: number;
  errors: string[];
}

/**
 * Update prices for all approved SnkrdunkMapping entries.
 */
export async function updateSnkrdunkPrices(
  db: DB
): Promise<SnkrdunkMatchResult> {
  const mappings = await db.snkrdunkMapping.findMany({
    where: { status: MappingStatus.MATCHED, matchedCardId: { not: null } },
    select: { id: true, snkrdunkId: true, matchedCardId: true },
  });

  let processed = 0;
  const errors: string[] = [];

  for (const mapping of mappings) {
    if (!mapping.matchedCardId) continue;

    try {
      const data = await fetchWithRetry(mapping.snkrdunkId);
      await upsertSnkrdunkPrices(db, mapping.matchedCardId, mapping.id, data);
      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`snkrdunkId=${mapping.snkrdunkId}: ${msg}`);
      log.error(`SNKRDUNK error for ${mapping.snkrdunkId}`, msg);
    }

    await sleep(SCRAPE_DELAY_MS);
  }

  return { processed, errors };
}

/**
 * Write CardPrice rows for a single card from fetched SNKRDUNK data.
 */
export async function upsertSnkrdunkPrices(
  db: DB,
  cardId: number,
  mappingId: number,
  data: SnkrdunkPriceData
): Promise<void> {
  const { summary, psa10MinPriceUsd, psa10LastSoldUsd, lastSoldUsd } = data;

  // Current lowest listing (raw/new) — type SELL
  if (summary.minPriceUsd != null) {
    await db.cardPrice.create({
      data: {
        cardId,
        source: PRICE_SOURCE.SNKRDUNK,
        type: "SELL",
        priceUsd: summary.minPriceUsd,
        inStock: true,
      },
    });
  }

  // Lowest available PSA10 listing — type SELL + gradeCondition
  if (psa10MinPriceUsd != null) {
    await db.cardPrice.create({
      data: {
        cardId,
        source: PRICE_SOURCE.SNKRDUNK,
        type: "SELL",
        priceUsd: psa10MinPriceUsd,
        inStock: true,
        gradeCondition: PRICE_SOURCE.PSA_10,
      },
    });
  }

  // Last sold PSA10 — type SOLD + gradeCondition
  if (psa10LastSoldUsd != null) {
    await db.cardPrice.create({
      data: {
        cardId,
        source: PRICE_SOURCE.SNKRDUNK,
        type: "SOLD",
        priceUsd: psa10LastSoldUsd,
        inStock: false,
        gradeCondition: PRICE_SOURCE.PSA_10,
      },
    });
  }

  // Last sold any condition
  if (lastSoldUsd != null) {
    await db.cardPrice.create({
      data: {
        cardId,
        source: PRICE_SOURCE.SNKRDUNK,
        type: "SOLD",
        priceUsd: lastSoldUsd,
        inStock: false,
      },
    });
  }

  // Update the mapping with latest prices
  await db.snkrdunkMapping.update({
    where: { id: mappingId },
    data: {
      minPriceUsd: summary.minPriceUsd,
      usedMinPriceUsd: summary.usedMinPriceUsd,
      lastSoldPsa10Usd: psa10LastSoldUsd,
      updatedAt: new Date(),
    },
  });
}

/**
 * Auto-match SnkrdunkMapping entries where productNumber directly matches
 * a unique cardCode in the DB. This allows instant matching for standard cards.
 * Returns the number of cards auto-matched.
 */
export async function autoMatchByProductNumber(db: DB): Promise<number> {
  const pendingMappings = await db.snkrdunkMapping.findMany({
    where: { status: MappingStatus.PENDING, matchedCardId: null },
    select: { id: true, productNumber: true },
  });

  let autoMatched = 0;

  for (const mapping of pendingMappings) {
    // Normalize productNumber: uppercase, trim
    const code = mapping.productNumber.toUpperCase().trim();

    const cards = await db.card.findMany({
      where: { cardCode: { equals: code, mode: "insensitive" } },
      select: { id: true, cardCode: true },
    });

    if (cards.length === 1) {
      // Unique match — auto-approve
      await db.snkrdunkMapping.update({
        where: { id: mapping.id },
        data: {
          matchedCardId: cards[0]!.id,
          matchMethod: MatchMethod.AUTO_CODE,
          status: MappingStatus.MATCHED,
        },
      });
      autoMatched++;
    } else if (cards.length > 1) {
      // Multiple candidates — mark as suggested, leave for admin
      await db.snkrdunkMapping.update({
        where: { id: mapping.id },
        data: { matchMethod: MatchMethod.AUTO_CODE_MULTI },
      });
    }
  }

  return autoMatched;
}
