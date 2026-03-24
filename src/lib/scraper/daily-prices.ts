import { prisma } from "@/lib/db";
import { SET_CODES } from "@/lib/constants/sets";
import { jpyToThb } from "@/lib/utils/currency";
import {
  fetchWithRetry,
  getSetListingUrl,
  parseSetListingPage,
  sleep,
} from "./yuyu-tei";
import { fetchExchangeRate, saveExchangeRate } from "./exchange-rate";

const DELAY_BETWEEN_SETS_MS = 1500;

export interface ScrapeResult {
  totalCards: number;
  totalSets: number;
  errors: string[];
  startedAt: Date;
  finishedAt: Date;
}

export async function scrapeDailyPrices(): Promise<ScrapeResult> {
  const startedAt = new Date();
  const errors: string[] = [];
  let totalCards = 0;
  let totalSets = 0;

  // 1. Fetch and save exchange rate
  const rate = await fetchExchangeRate();
  await saveExchangeRate(rate);
  console.log(`Exchange rate: 1 JPY = ${rate} THB`);

  // 2. Scrape each set
  for (const setCode of SET_CODES) {
    try {
      const url = getSetListingUrl(setCode);
      console.log(`Scraping ${setCode}: ${url}`);

      const $ = await fetchWithRetry(url);
      const listings = parseSetListingPage($);

      if (listings.length === 0) {
        errors.push(`${setCode}: No cards found (possible HTML structure change)`);
        continue;
      }

      const dbSet = await prisma.cardSet.findUnique({
        where: { code: setCode },
      });

      // 3. For each card, upsert price
      for (const listing of listings) {
        try {
          const compositeCode = `${listing.cardCode}${listing.yuyuteiId ? `-${listing.yuyuteiId}` : ""}`;

          let card = await prisma.card.findUnique({
            where: { cardCode: compositeCode },
          });

          if (!card && listing.yuyuteiId && dbSet) {
            card = await prisma.card.findFirst({
              where: {
                yuyuteiId: listing.yuyuteiId,
                setId: dbSet.id,
              },
            });
          }

          if (!card) continue;

          const priceThb = jpyToThb(listing.priceJpy, rate);

          await prisma.cardPrice.create({
            data: {
              cardId: card.id,
              source: "YUYUTEI",
              type: "SELL",
              priceJpy: listing.priceJpy,
              priceThb,
              inStock: listing.inStock,
            },
          });

          // Update latest price on card
          await prisma.card.update({
            where: { id: card.id },
            data: {
              latestPriceJpy: listing.priceJpy,
              latestPriceThb: priceThb,
            },
          });

          totalCards++;
        } catch (cardError) {
          const msg = cardError instanceof Error ? cardError.message : String(cardError);
          errors.push(`${setCode}/${listing.name}: ${msg}`);
        }
      }

      totalSets++;
      console.log(`  ${setCode}: ${listings.length} cards scraped`);

      await sleep(DELAY_BETWEEN_SETS_MS);
    } catch (setError) {
      const msg = setError instanceof Error ? setError.message : String(setError);
      errors.push(`${setCode}: ${msg}`);
      console.error(`  ${setCode}: ERROR - ${msg}`);
    }
  }

  // 4. Compute price changes (24h, 7d) for all cards
  await computePriceChanges();

  const finishedAt = new Date();
  console.log(
    `Scrape complete: ${totalCards} cards across ${totalSets} sets in ${
      (finishedAt.getTime() - startedAt.getTime()) / 1000
    }s`
  );
  if (errors.length > 0) {
    console.warn(`Errors (${errors.length}):`, errors.slice(0, 10));
  }

  return { totalCards, totalSets, errors, startedAt, finishedAt };
}

async function computePriceChanges() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get all cards that have prices
  const cards = await prisma.card.findMany({
    where: { latestPriceJpy: { not: null } },
    select: { id: true, latestPriceJpy: true },
  });

  for (const card of cards) {
    const currentPrice = card.latestPriceJpy;
    if (!currentPrice) continue;

    // Get price from ~24h ago
    const price24h = await prisma.cardPrice.findFirst({
      where: {
        cardId: card.id,
        source: "YUYUTEI",
        scrapedAt: { lte: oneDayAgo },
      },
      orderBy: { scrapedAt: "desc" },
      select: { priceJpy: true },
    });

    const price7d = await prisma.cardPrice.findFirst({
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

    const change24h = p24h
      ? ((currentPrice - p24h) / p24h) * 100
      : null;
    const change7d = p7d
      ? ((currentPrice - p7d) / p7d) * 100
      : null;

    await prisma.card.update({
      where: { id: card.id },
      data: {
        priceChange24h: change24h ? Math.round(change24h * 100) / 100 : null,
        priceChange7d: change7d ? Math.round(change7d * 100) / 100 : null,
      },
    });
  }
}
