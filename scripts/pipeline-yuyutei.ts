/**
 * Pipeline: Scrape Yuyutei → Match prices to existing cards in DB.
 *
 * Cards MUST already exist in the DB (from Punk Records via seed-cards.ts).
 * This script only matches Yuyutei listings to those cards and updates prices.
 *
 * 3-Step Matching:
 *   1. Non-parallel: exact cardCode match
 *   2. Parallel: baseCode + rarity + isParallel match
 *   3. YuyuteiMapping table fallback (manual matches)
 *   4. Unmatched → YuyuteiMapping with status "pending"
 *
 * Usage:
 *   npx tsx scripts/pipeline-yuyutei.ts                  # all sets
 *   npx tsx scripts/pipeline-yuyutei.ts --sets=op09      # specific sets
 *   npx tsx scripts/pipeline-yuyutei.ts --verbose        # per-card logging
 */
import { prisma } from "./_db";
import { SETS } from "./sets";
import {
  fetchWithRetry,
  getSetListingUrl,
  parseSetListingPage,
  sleep,
  type ScrapedCardListing,
} from "../src/lib/scraper/yuyu-tei";

const DELAY_MS = 1500;

function isDonCard(listing: ScrapedCardListing): boolean {
  const code = listing.cardCode?.toUpperCase() ?? "";
  return (
    !code ||
    code.includes("\uFF0A") ||
    listing.name.includes("ドン!!") ||
    listing.rarity === "DON"
  );
}

function isParallelListing(listing: ScrapedCardListing): boolean {
  return (
    listing.name.includes("パラレル") ||
    (listing.rarity?.startsWith("P-") ?? false) ||
    listing.rarity === "SP"
  );
}

/**
 * Normalize Yuyutei rarity to match our DB format (from Punk Records mapRarity).
 * Yuyutei parser already outputs P-SEC, P-SR, SP, etc. but we ensure consistency.
 */
function normalizeRarity(listing: ScrapedCardListing): string | null {
  return listing.rarity || null;
}

async function matchCard(
  listing: ScrapedCardListing,
  setCode: string
): Promise<{ cardId: number; method: string } | null> {
  const code = listing.cardCode!.toUpperCase();
  const parallel = isParallelListing(listing);
  const rarity = normalizeRarity(listing);

  // Step 1: Non-parallel exact cardCode match
  if (!parallel) {
    const card = await prisma.card.findUnique({
      where: { cardCode: code },
      select: { id: true },
    });
    if (card) return { cardId: card.id, method: "exact" };
  }

  // Step 2a: Re-run fast path — card already linked to this yuyuteiId
  if (parallel && listing.yuyuteiId) {
    const already = await prisma.card.findFirst({
      where: { yuyuteiId: listing.yuyuteiId },
      select: { id: true },
    });
    if (already) return { cardId: already.id, method: "yuyutei-id" };
  }

  // Step 2b: Parallel match by baseCode + rarity + isParallel
  //   Prefer cards not yet linked (yuyuteiId is null) so that when
  //   multiple listings share the same base+rarity (e.g. two P-SEC),
  //   each listing maps to a different DB card.
  if (parallel && rarity) {
    const unlinked = await prisma.card.findFirst({
      where: {
        baseCode: code,
        isParallel: true,
        rarity,
        yuyuteiId: null,
      },
      select: { id: true },
      orderBy: { parallelIndex: "asc" },
    });
    if (unlinked) return { cardId: unlinked.id, method: "rarity" };

    // Try any unlinked parallel regardless of rarity
    const anyUnlinked = await prisma.card.findFirst({
      where: { baseCode: code, isParallel: true, yuyuteiId: null },
      select: { id: true },
      orderBy: { parallelIndex: "asc" },
    });
    if (anyUnlinked) return { cardId: anyUnlinked.id, method: "parallel-unlinked" };
  }

  // Step 3: YuyuteiMapping table fallback (previously saved manual match)
  if (listing.yuyuteiId) {
    const mapping = await prisma.yuyuteiMapping.findFirst({
      where: {
        setCode,
        yuyuteiId: listing.yuyuteiId,
        status: "matched",
        matchedCardId: { not: null },
      },
      select: { matchedCardId: true },
    });
    if (mapping?.matchedCardId) return { cardId: mapping.matchedCardId, method: "mapping" };
  }

  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const setsArg = args.find((a) => a.startsWith("--sets="));
  const setsFilter = setsArg
    ? new Set(setsArg.replace("--sets=", "").split(",").map((s) => s.trim().toLowerCase()))
    : null;

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║   Yuyutei Price Matcher (cards must exist in DB)  ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`  verbose: ${verbose}, sets: ${setsFilter ? [...setsFilter].join(",") : "all"}\n`);

  const setsToProcess = SETS.filter((s) => {
    if (s.code === "don") return false;
    if (setsFilter && !setsFilter.has(s.code)) return false;
    return true;
  });

  let totalMatched = 0;
  let totalUnmatched = 0;
  let totalPriceRows = 0;
  let totalDonSkipped = 0;

  for (const setDef of setsToProcess) {
    const url = getSetListingUrl(setDef.code);
    console.log(`[${setDef.code}] Scraping ${url}...`);

    let listings: ScrapedCardListing[];
    try {
      const $ = await fetchWithRetry(url);
      listings = parseSetListingPage($);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR fetching: ${msg}`);
      continue;
    }

    if (listings.length === 0) {
      console.log(`  No listings found, skipping.`);
      continue;
    }

    const donCount = listings.filter(isDonCard).length;
    const nonDon = listings.filter((l) => !isDonCard(l));

    if (verbose) {
      console.log(`  Raw listings: ${listings.length} (DON: ${donCount}, non-DON: ${nonDon.length})`);
    }

    let matched = 0;
    let unmatched = 0;
    let priceRows = 0;

    for (const listing of nonDon) {
      if (!listing.cardCode) {
        unmatched++;
        continue;
      }

      const result = await matchCard(listing, setDef.code);

      if (result) {
        // Update card with Yuyutei data
        await prisma.card.update({
          where: { id: result.cardId },
          data: {
            yuyuteiId: listing.yuyuteiId || undefined,
            yuyuteiUrl: listing.cardUrl || undefined,
            latestPriceJpy: listing.priceJpy,
          },
        });

        // Create price history row
        await prisma.cardPrice.create({
          data: {
            cardId: result.cardId,
            source: "YUYUTEI",
            type: "SELL",
            priceJpy: listing.priceJpy,
            inStock: listing.inStock,
          },
        });

        matched++;
        priceRows++;

        if (verbose) {
          const parallel = isParallelListing(listing) ? " [P]" : "";
          console.log(`    OK  ${listing.cardCode}${parallel} ${listing.rarity || "-"} ¥${listing.priceJpy} (${result.method})`);
        }
      } else {
        // Step 4: Save unmatched to YuyuteiMapping for admin review
        if (listing.yuyuteiId) {
          await prisma.yuyuteiMapping.upsert({
            where: {
              setCode_yuyuteiId: {
                setCode: setDef.code,
                yuyuteiId: listing.yuyuteiId,
              },
            },
            update: {
              scrapedCode: listing.cardCode,
              scrapedRarity: listing.rarity || null,
              scrapedName: listing.name,
              scrapedImage: listing.imageUrl || null,
              priceJpy: listing.priceJpy,
            },
            create: {
              setCode: setDef.code,
              yuyuteiId: listing.yuyuteiId,
              scrapedCode: listing.cardCode,
              scrapedRarity: listing.rarity || null,
              scrapedName: listing.name,
              scrapedImage: listing.imageUrl || null,
              priceJpy: listing.priceJpy,
              status: "pending",
            },
          });
        }

        unmatched++;
        if (verbose) {
          const parallel = isParallelListing(listing) ? " [P]" : "";
          console.log(`    MISS ${listing.cardCode}${parallel} ${listing.rarity || "-"} ¥${listing.priceJpy} "${listing.name}"`);
        }
      }
    }

    console.log(
      `  Matched: ${matched}, Unmatched: ${unmatched}, Prices: ${priceRows}, DON skipped: ${donCount}`
    );
    totalMatched += matched;
    totalUnmatched += unmatched;
    totalPriceRows += priceRows;
    totalDonSkipped += donCount;

    await sleep(DELAY_MS);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Done!`);
  console.log(`  Matched:   ${totalMatched}`);
  console.log(`  Unmatched: ${totalUnmatched}`);
  console.log(`  Prices:    ${totalPriceRows}`);
  console.log(`  DON skip:  ${totalDonSkipped}`);
  console.log("=".repeat(60));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Pipeline failed:", e);
  process.exit(1);
});
