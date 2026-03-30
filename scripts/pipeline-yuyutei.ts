/**
 * Scrape Yuyutei → save ALL listings to YuyuteiMapping table.
 *
 * Auto-suggests a match for each listing but does NOT write prices to cards.
 * Admin reviews and approves matches in the admin UI, which then writes prices.
 *
 * For already-approved mappings (status="matched"), updates priceJpy only.
 *
 * Usage:
 *   npx tsx scripts/pipeline-yuyutei.ts                  # all sets
 *   npx tsx scripts/pipeline-yuyutei.ts --sets=op09      # specific sets
 *   npx tsx scripts/pipeline-yuyutei.ts --verbose        # per-card logging
 */
import { prisma } from "./_db";
import { MappingStatus, MatchMethod } from "../src/generated/prisma/client";
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
 * Suggest a card match for a listing. Returns cardId + method if found.
 * Does NOT write anything to Card table — only used as a suggestion.
 */
async function suggestMatch(
  listing: ScrapedCardListing,
  setCode: string
): Promise<{ cardId: number; method: MatchMethod } | null> {
  const code = listing.cardCode!.toUpperCase();
  const parallel = isParallelListing(listing);
  const rarity = listing.rarity || null;
  const setFilter = { set: { code: setCode } };

  // Non-parallel: exact cardCode
  if (!parallel) {
    const exact = await prisma.card.findFirst({
      where: { cardCode: code, ...setFilter },
      select: { id: true },
    });
    if (exact) return { cardId: exact.id, method: MatchMethod.EXACT };
  }

  // Parallel: baseCode + isParallel + rarity
  if (parallel && rarity) {
    const match = await prisma.card.findFirst({
      where: { baseCode: code, isParallel: true, rarity, ...setFilter },
      select: { id: true },
      orderBy: { parallelIndex: "asc" },
    });
    if (match) return { cardId: match.id, method: MatchMethod.AUTO_PARALLEL };

    const anyPar = await prisma.card.findFirst({
      where: { baseCode: code, isParallel: true, ...setFilter },
      select: { id: true },
      orderBy: { parallelIndex: "asc" },
    });
    if (anyPar) return { cardId: anyPar.id, method: MatchMethod.AUTO_PARALLEL_ANY };
  }

  // Non-parallel baseCode fallback (PRB/ST reprints)
  if (!parallel) {
    const byBase = await prisma.card.findFirst({
      where: {
        baseCode: code,
        isParallel: false,
        ...(rarity ? { rarity } : {}),
        ...setFilter,
      },
      select: { id: true },
    });
    if (byBase) return { cardId: byBase.id, method: MatchMethod.AUTO_BASECODE };
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

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   Yuyutei Scraper → YuyuteiMapping (admin approves)  ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`  verbose: ${verbose}, sets: ${setsFilter ? [...setsFilter].join(",") : "all"}\n`);

  const setsToProcess = SETS.filter((s) => {
    if (s.code === "don") return false;
    if (setsFilter && !setsFilter.has(s.code)) return false;
    return true;
  });

  let totalNew = 0;
  let totalUpdated = 0;
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
    let newCount = 0;
    let updatedCount = 0;

    for (const listing of nonDon) {
      if (!listing.cardCode || !listing.yuyuteiId) continue;

      const existing = await prisma.yuyuteiMapping.findUnique({
        where: {
          setCode_yuyuteiId: { setCode: setDef.code, yuyuteiId: listing.yuyuteiId },
        },
      });

      if (existing) {
        // Already exists — just update price (keep admin's match decision)
        await prisma.yuyuteiMapping.update({
          where: { id: existing.id },
          data: {
            scrapedName: listing.name,
            scrapedImage: listing.imageUrl || null,
            priceJpy: listing.priceJpy,
          },
        });
        updatedCount++;

        if (verbose) {
          const p = isParallelListing(listing) ? " [P]" : "";
          console.log(`    UPD ${listing.cardCode}${p} ¥${listing.priceJpy} (${existing.status})`);
        }
      } else {
        // New listing — auto-suggest a match
        const suggestion = await suggestMatch(listing, setDef.code);

        await prisma.yuyuteiMapping.create({
          data: {
            setCode: setDef.code,
            yuyuteiId: listing.yuyuteiId,
            scrapedCode: listing.cardCode,
            scrapedRarity: listing.rarity || null,
            scrapedName: listing.name,
            scrapedImage: listing.imageUrl || null,
            priceJpy: listing.priceJpy,
            matchedCardId: suggestion?.cardId ?? null,
            matchMethod: suggestion?.method ?? null,
            status: suggestion ? MappingStatus.SUGGESTED : MappingStatus.PENDING,
          },
        });
        newCount++;

        if (verbose) {
          const p = isParallelListing(listing) ? " [P]" : "";
          const s = suggestion ? `→ card#${suggestion.cardId} (${suggestion.method})` : "NO MATCH";
          console.log(`    NEW ${listing.cardCode}${p} ¥${listing.priceJpy} ${s}`);
        }
      }
    }

    console.log(
      `  New: ${newCount}, Updated: ${updatedCount}, DON skipped: ${donCount}`
    );
    totalNew += newCount;
    totalUpdated += updatedCount;
    totalDonSkipped += donCount;

    await sleep(DELAY_MS);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Done!`);
  console.log(`  New mappings:     ${totalNew}`);
  console.log(`  Updated prices:   ${totalUpdated}`);
  console.log(`  DON skipped:      ${totalDonSkipped}`);
  console.log("=".repeat(60));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Pipeline failed:", e);
  process.exit(1);
});
