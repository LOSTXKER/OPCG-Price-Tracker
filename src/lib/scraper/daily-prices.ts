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
} from "./yuyu-tei";
import { sleep, SCRAPE_DELAY_MS } from "./http-utils";
import { matchAndUpdatePrices, computePriceChanges } from "./price-matcher";
import { fetchExchangeRate, saveExchangeRate } from "./exchange-rate";
import { serverEnv } from "@/lib/env";
import { createLog } from "@/lib/logger";

const log = createLog("scraper:daily-prices");
const VERBOSE = serverEnv().SCRAPE_VERBOSE;

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
  if (VERBOSE) log.debug(`Exchange rate: 1 JPY = ${rate} THB`);

  for (const setCode of SET_CODES) {
    try {
      const url = getSetListingUrl(setCode);
      if (VERBOSE) log.debug(`Scraping ${setCode}: ${url}`);

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
      if (VERBOSE) log.debug(`  ${setCode}: ${result.matched}/${result.listings} matched`);

      await sleep(SCRAPE_DELAY_MS);
    } catch (setError) {
      const msg =
        setError instanceof Error ? setError.message : String(setError);
      errors.push(`${setCode}: ${msg}`);
      log.error(`${setCode}: ERROR`, msg);
    }
  }

  await computePriceChanges(prisma);

  const finishedAt = new Date();
  log.info(
    `Scrape complete: ${totalCards} cards across ${totalSets} sets in ${
      (finishedAt.getTime() - startedAt.getTime()) / 1000
    }s`
  );
  if (errors.length > 0) {
    log.warn(`Errors (${errors.length})`, errors.slice(0, 10));
  }

  return { totalCards, totalSets, errors, startedAt, finishedAt };
}
