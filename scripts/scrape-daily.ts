/**
 * CLI: Daily price scrape with exchange rate conversion and price change computation.
 *
 * This is meant to be run by cron or Vercel scheduler. It:
 *   1. Fetches the JPY→THB exchange rate
 *   2. Scrapes all sets from Yuyu-tei (using shared parser)
 *   3. Updates card prices (using shared matcher)
 *   4. Computes 24h / 7d price change percentages
 *
 * Usage:
 *   npx tsx scripts/scrape-daily.ts
 */
import { prisma } from "./_db";
import { SET_CODES } from "./sets";
import {
  fetchWithRetry,
  getSetListingUrl,
  parseSetListingPage,
  sleep,
} from "../src/lib/scraper/yuyu-tei";
import {
  matchAndUpdatePrices,
  computePriceChanges,
} from "../src/lib/scraper/price-matcher";

const DELAY_MS = 1500;
const DEFAULT_RATE = 0.21;
const EXCHANGE_API_URL = "https://v6.exchangerate-api.com/v6";

async function fetchExchangeRate(): Promise<number> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (apiKey && apiKey !== "your-exchange-rate-api-key") {
    try {
      const res = await fetch(`${EXCHANGE_API_URL}/${apiKey}/pair/JPY/THB`);
      const data = await res.json();
      if (data.result === "success") {
        console.log(`Exchange rate from API: 1 JPY = ${data.conversion_rate} THB`);
        return data.conversion_rate;
      }
    } catch (error) {
      console.warn("Exchange rate API failed, checking DB fallback:", error);
    }
  }

  const latest = await prisma.exchangeRate.findFirst({
    orderBy: { fetchedAt: "desc" },
  });
  const rate = latest?.rate ?? DEFAULT_RATE;
  console.log(`Exchange rate (fallback): 1 JPY = ${rate} THB`);
  return rate;
}

async function main() {
  console.log(`Starting daily price scrape for ${SET_CODES.length} sets...`);
  const startTime = Date.now();
  let totalMatched = 0;
  let totalUnmatched = 0;
  const errors: string[] = [];

  const rate = await fetchExchangeRate();

  try {
    await prisma.exchangeRate.create({
      data: { fromCur: "JPY", toCur: "THB", rate },
    });
  } catch {
    console.warn("Could not save exchange rate to DB");
  }

  for (const setCode of SET_CODES) {
    const url = getSetListingUrl(setCode);
    console.log(`\n[${setCode}] ${url}`);

    try {
      const $ = await fetchWithRetry(url);
      const listings = parseSetListingPage($);

      if (listings.length === 0) {
        errors.push(`${setCode}: 0 cards`);
        continue;
      }

      const result = await matchAndUpdatePrices(prisma, setCode, listings, {
        thbRate: rate,
      });

      console.log(
        `  ${result.matched}/${result.listings} matched (${result.unmatched} unmatched)`
      );
      totalMatched += result.matched;
      totalUnmatched += result.unmatched;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: ${msg}`);
      errors.push(`${setCode}: ${msg}`);
    }

    await sleep(DELAY_MS);
  }

  console.log("\nComputing price changes...");
  await computePriceChanges(prisma);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========================================`);
  console.log(`Done! ${totalMatched} matched, ${totalUnmatched} unmatched in ${elapsed}s`);
  if (errors.length) {
    console.log(`Errors (${errors.length}):`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
