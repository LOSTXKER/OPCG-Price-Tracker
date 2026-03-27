/**
 * Daily price scrape — used by the Vercel cron route /api/cron/scrape-prices.
 *
 * Delegates parsing to yuyu-tei.ts and matching to price-matcher.ts.
 */
import { prisma } from "@/lib/db";
import { SET_CODES } from "@/lib/constants/sets";
import {
  fetchWithRetry,
  getSetListingUrl,
  parseSetListingPage,
  sleep,
} from "./yuyu-tei";
import { matchAndUpdatePrices, computePriceChanges } from "./price-matcher";
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

  const rate = await fetchExchangeRate();
  await saveExchangeRate(rate);
  console.log(`Exchange rate: 1 JPY = ${rate} THB`);

  for (const setCode of SET_CODES) {
    try {
      const url = getSetListingUrl(setCode);
      console.log(`Scraping ${setCode}: ${url}`);

      const $ = await fetchWithRetry(url);
      const listings = parseSetListingPage($);

      if (listings.length === 0) {
        errors.push(`${setCode}: No cards found`);
        continue;
      }

      const result = await matchAndUpdatePrices(prisma, setCode, listings, {
        thbRate: rate,
      });

      totalCards += result.matched;
      totalSets++;
      console.log(
        `  ${setCode}: ${result.matched}/${result.listings} matched`
      );

      await sleep(DELAY_BETWEEN_SETS_MS);
    } catch (setError) {
      const msg =
        setError instanceof Error ? setError.message : String(setError);
      errors.push(`${setCode}: ${msg}`);
      console.error(`  ${setCode}: ERROR - ${msg}`);
    }
  }

  await computePriceChanges(prisma);

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
