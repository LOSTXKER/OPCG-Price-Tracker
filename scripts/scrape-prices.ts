/**
 * CLI: Scrape prices from Yuyu-tei and update existing DB cards.
 *
 * Usage:
 *   npx tsx scripts/scrape-prices.ts              # all sets
 *   npx tsx scripts/scrape-prices.ts op13 op14     # specific sets
 */
import { prisma } from "./_db";
import { SET_CODES } from "./sets";
import {
  fetchWithRetry,
  getSetListingUrl,
  parseSetListingPage,
  sleep,
} from "../src/lib/scraper/yuyu-tei";
import { matchAndUpdatePrices } from "../src/lib/scraper/price-matcher";

const DELAY_MS = 1500;

async function main() {
  const args = process.argv.slice(2);
  const codes = args.length > 0 ? args : SET_CODES;

  console.log(`\n=== Yuyu-tei Price Scrape ===`);
  console.log(`Processing ${codes.length} sets...\n`);

  let totalMatched = 0;
  let totalUnmatched = 0;

  for (const setCode of codes) {
    const url = getSetListingUrl(setCode);
    console.log(`[${setCode}] ${url}`);

    try {
      const $ = await fetchWithRetry(url);
      const listings = parseSetListingPage($);

      const result = await matchAndUpdatePrices(prisma, setCode, listings);

      console.log(
        `  ${result.matched}/${result.listings} matched (${result.unmatched} unmatched)`
      );
      totalMatched += result.matched;
      totalUnmatched += result.unmatched;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: ${msg}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n========================================`);
  console.log(`Done! ${totalMatched} prices updated, ${totalUnmatched} unmatched`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
