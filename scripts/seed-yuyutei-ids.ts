import { prisma } from "./_db";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";
import { SET_CODES } from "./sets";

const BASE_URL = "https://yuyu-tei.jp";
const YUYU_IMG_BASE = "https://card.yuyu-tei.jp/opc/front";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string): Promise<cheerio.CheerioAPI> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return cheerio.load(await res.text());
}

async function toBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.toString("base64");
  } catch {
    return null;
  }
}

// ============================================================
// Parsing
// ============================================================

interface YuyuteiListing {
  cardCode: string;
  name: string;
  rarity: string;
  isParallel: boolean;
  priceJpy: number;
  yuyuteiId: string;
  imageUrl?: string;
  cardUrl?: string;
  inStock: boolean;
}

function parseListings($: cheerio.CheerioAPI): YuyuteiListing[] {
  const results: YuyuteiListing[] = [];

  $(".card-product").each((_, el) => {
    const $el = $(el);

    const cardCode = $el.find("span.border-dark").first().text().trim();
    if (!cardCode) return;

    const priceText = $el.find("strong.text-end").first().text().trim();
    const priceJpy = parseInt(priceText.replace(/[^0-9]/g, ""), 10);
    if (isNaN(priceJpy) || priceJpy === 0) return;

    const imgEl = $el.find(".product-img img.card").first();
    const altText = imgEl.attr("alt") || "";
    const imageUrl = imgEl.attr("src") || undefined;

    const altMatch = altText.match(
      /^[\w-]+\s+(P-SEC|P-SR|P-R|P-UC|P-C|P-L|P-P|SEC|SR|SP|R|UC|C|L|P)?\s*(.*)/
    );
    let rarity = altMatch?.[1] || "";
    const name =
      altMatch?.[2]?.trim() ||
      $el.find("h4.text-primary").first().text().trim();

    if (!rarity && name.includes("ドン!!")) rarity = "DON";

    const isParallel =
      name.includes("パラレル") ||
      rarity.startsWith("P-") ||
      rarity === "SP";
    if (
      isParallel &&
      rarity &&
      !rarity.startsWith("P-") &&
      rarity !== "SP" &&
      rarity !== "DON"
    ) {
      rarity = `P-${rarity}`;
    }

    const href = $el.find("a[href*='/sell/opc/card/']").first().attr("href");
    const yuyuteiId =
      $el.find("input.cart_cid").val()?.toString() ||
      href?.split("/").pop();

    if (!yuyuteiId) return;

    results.push({
      cardCode: cardCode.toUpperCase(),
      name,
      rarity,
      isParallel,
      priceJpy,
      yuyuteiId,
      imageUrl,
      cardUrl: href || undefined,
      inStock: !$el.hasClass("sold-out"),
    });
  });

  return results;
}

// ============================================================
// Gemini Vision matching
// ============================================================

async function geminiMatchParallels(
  ai: GoogleGenAI,
  yuyuListings: { yuyuteiId: string; imageUrl: string; label: string }[],
  dbCards: { id: number; imageUrl: string; label: string }[]
): Promise<Map<string, number> | null> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // Yuyu-tei thumbnails
  for (const y of yuyuListings) {
    parts.push({ text: `Yuyu-tei thumbnail ${y.label}:` });
    const b64 = await toBase64(y.imageUrl);
    if (!b64) return null;
    parts.push({ inlineData: { mimeType: "image/jpeg", data: b64 } });
  }

  // Bandai images
  for (const b of dbCards) {
    parts.push({ text: `Bandai image ${b.label}:` });
    const b64 = await toBase64(b.imageUrl);
    if (!b64) return null;
    parts.push({ inlineData: { mimeType: "image/png", data: b64 } });
  }

  const yLabels = yuyuListings.map((y) => y.label).join(", ");
  const bLabels = dbCards.map((b) => b.label).join(", ");

  parts.push({
    text: [
      `Above are ${yuyuListings.length} Yuyu-tei store thumbnails (${yLabels}) and ${dbCards.length} official Bandai card images (${bLabels}).`,
      `Each Yuyu-tei thumbnail shows the same card art as exactly one Bandai image, just from different sources/quality.`,
      `Match each Yuyu-tei label to its corresponding Bandai label.`,
      `Reply ONLY in this exact format with no extra text: ${yuyuListings.map((y) => `${y.label}=?`).join(",")}`,
      `Replace each ? with the matching B label.`,
    ].join(" "),
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts }],
    });

    const text = response.text?.trim() || "";
    const result = new Map<string, number>();

    // Parse "Y1=B2,Y2=B1,Y3=B3" format
    const pairs = text.split(",").map((s) => s.trim());
    for (const pair of pairs) {
      const m = pair.match(/Y(\d+)\s*=\s*B(\d+)/i);
      if (!m) continue;
      const yIdx = parseInt(m[1]);
      const bIdx = parseInt(m[2]);
      const yListing = yuyuListings.find((y) => y.label === `Y${yIdx}`);
      const bCard = dbCards.find((b) => b.label === `B${bIdx}`);
      if (yListing && bCard) {
        result.set(yListing.yuyuteiId, bCard.id);
      }
    }

    return result.size > 0 ? result : null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`    Gemini error: ${msg}`);
    return null;
  }
}

// ============================================================
// Price-only update by rarity matching (for cross-set reprints)
// ============================================================

async function updatePriceByRarity(
  dbCards: { id: number; yuyuteiId: string | null; rarity?: string }[],
  listings: YuyuteiListing[],
  dryRun: boolean
): Promise<number> {
  let updated = 0;
  const usedDbIds = new Set<number>();

  for (const listing of listings) {
    // Try to find a DB card with matching rarity that hasn't been used yet
    const match = dbCards.find(
      (c) => c.rarity === listing.rarity && !usedDbIds.has(c.id)
    );
    if (match) {
      usedDbIds.add(match.id);
      if (!dryRun) {
        await prisma.card.update({
          where: { id: match.id },
          data: { latestPriceJpy: listing.priceJpy },
        });
      }
      updated++;
      continue;
    }
    // Fallback: any DB parallel not yet used
    const fallback = dbCards.find((c) => !usedDbIds.has(c.id));
    if (fallback) {
      usedDbIds.add(fallback.id);
      if (!dryRun) {
        await prisma.card.update({
          where: { id: fallback.id },
          data: { latestPriceJpy: listing.priceJpy },
        });
      }
      updated++;
    }
  }
  return updated;
}

// ============================================================
// Group-based matching for one set
// ============================================================

interface MatchStats {
  directMatched: number;
  geminiMatched: number;
  priceOnly: number;
  unmatched: number;
  alreadyDone: number;
  geminiFailed: number;
}

async function matchSetGroup(
  setCode: string,
  setId: number,
  baseCode: string,
  listings: YuyuteiListing[],
  ai: GoogleGenAI | null,
  dryRun: boolean
): Promise<MatchStats> {
  const stats: MatchStats = {
    directMatched: 0,
    geminiMatched: 0,
    priceOnly: 0,
    unmatched: 0,
    alreadyDone: 0,
    geminiFailed: 0,
  };

  const nonParallels = listings.filter((l) => !l.isParallel);
  const parallels = listings.filter((l) => l.isParallel);

  // --- Non-parallel: direct match ---
  for (const listing of nonParallels) {
    const dbCard = await prisma.card.findFirst({
      where: { baseCode, isParallel: false, setId },
      select: { id: true, yuyuteiId: true },
    });

    if (!dbCard) {
      // Try cross-set fallback
      const crossSet = await prisma.card.findFirst({
        where: { baseCode, isParallel: false },
        select: { id: true, yuyuteiId: true },
      });
      if (!crossSet) {
        stats.unmatched++;
        continue;
      }
      if (crossSet.yuyuteiId === listing.yuyuteiId) {
        stats.alreadyDone++;
        continue;
      }
      if (crossSet.yuyuteiId && crossSet.yuyuteiId !== listing.yuyuteiId) {
        // Card already has yuyuteiId from its original set -- just update price
        if (!dryRun) {
          await prisma.card.update({
            where: { id: crossSet.id },
            data: { latestPriceJpy: listing.priceJpy },
          });
        }
        stats.priceOnly++;
        continue;
      }
      if (!dryRun) {
        await prisma.card.update({
          where: { id: crossSet.id },
          data: { yuyuteiId: listing.yuyuteiId, yuyuteiUrl: listing.cardUrl, latestPriceJpy: listing.priceJpy },
        });
      }
      stats.directMatched++;
      continue;
    }

    if (dbCard.yuyuteiId === listing.yuyuteiId) {
      stats.alreadyDone++;
      continue;
    }
    if (dbCard.yuyuteiId && dbCard.yuyuteiId !== listing.yuyuteiId) {
      // Same-set conflict -- just update price
      if (!dryRun) {
        await prisma.card.update({
          where: { id: dbCard.id },
          data: { latestPriceJpy: listing.priceJpy },
        });
      }
      stats.priceOnly++;
      continue;
    }
    if (!dryRun) {
      await prisma.card.update({
        where: { id: dbCard.id },
        data: { yuyuteiId: listing.yuyuteiId, yuyuteiUrl: listing.cardUrl, latestPriceJpy: listing.priceJpy },
      });
    }
    stats.directMatched++;
  }

  // --- Parallels ---
  if (parallels.length === 0) return stats;

  // Get all DB parallel cards for this baseCode+set
  const dbParallels = await prisma.card.findMany({
    where: { baseCode, isParallel: true, setId },
    select: { id: true, yuyuteiId: true, imageUrl: true, parallelIndex: true, rarity: true },
    orderBy: { parallelIndex: "asc" },
  });

  if (dbParallels.length === 0) {
    // Fallback: try cross-set
    const crossParallels = await prisma.card.findMany({
      where: { baseCode, isParallel: true },
      select: { id: true, yuyuteiId: true, imageUrl: true, parallelIndex: true, rarity: true },
      orderBy: { parallelIndex: "asc" },
    });
    if (crossParallels.length === 0) {
      stats.unmatched += parallels.length;
      return stats;
    }
    const unassignedDb = crossParallels.filter((c) => !c.yuyuteiId);
    const assignedYuyuIds = new Set(crossParallels.map((c) => c.yuyuteiId).filter(Boolean));
    const unassignedListings = parallels.filter((l) => !assignedYuyuIds.has(l.yuyuteiId));
    const alreadyAssigned = parallels.length - unassignedListings.length;
    stats.alreadyDone += alreadyAssigned;

    // Assign yuyuteiId to unassigned DB cards
    for (let i = 0; i < Math.min(unassignedDb.length, unassignedListings.length); i++) {
      if (!dryRun) {
        await prisma.card.update({
          where: { id: unassignedDb[i].id },
          data: {
            yuyuteiId: unassignedListings[i].yuyuteiId,
            yuyuteiUrl: unassignedListings[i].cardUrl,
            latestPriceJpy: unassignedListings[i].priceJpy,
          },
        });
      }
      stats.directMatched++;
    }

    // Remaining listings: all DB cards have yuyuteiIds already -- update price by rarity match
    const remainingListings = unassignedListings.slice(unassignedDb.length);
    stats.priceOnly += await updatePriceByRarity(crossParallels, remainingListings, dryRun);
    stats.unmatched += remainingListings.length - Math.min(remainingListings.length, crossParallels.length);
    return stats;
  }

  // Check which are already assigned
  const assignedYuyuIds = new Set(dbParallels.map((c) => c.yuyuteiId).filter(Boolean));
  const unassignedDb = dbParallels.filter((c) => !c.yuyuteiId);
  const unassignedListings = parallels.filter((l) => !assignedYuyuIds.has(l.yuyuteiId));
  stats.alreadyDone += parallels.length - unassignedListings.length;

  if (unassignedListings.length === 0) {
    return stats;
  }
  if (unassignedDb.length === 0) {
    // All DB cards have yuyuteiIds -- update prices by rarity
    stats.priceOnly += await updatePriceByRarity(dbParallels, unassignedListings, dryRun);
    return stats;
  }

  // Single unassigned on each side: direct match
  if (unassignedListings.length === 1 && unassignedDb.length === 1) {
    if (!dryRun) {
      await prisma.card.update({
        where: { id: unassignedDb[0].id },
        data: {
          yuyuteiId: unassignedListings[0].yuyuteiId,
          yuyuteiUrl: unassignedListings[0].cardUrl,
          latestPriceJpy: unassignedListings[0].priceJpy,
        },
      });
    }
    stats.directMatched++;
    return stats;
  }

  // Multiple unassigned: use Gemini Vision
  if (!ai) {
    stats.unmatched += unassignedListings.length;
    return stats;
  }

  // Build image lists
  const yuyuImages = unassignedListings.map((l, i) => ({
    yuyuteiId: l.yuyuteiId,
    imageUrl: `${YUYU_IMG_BASE}/${setCode}/${l.yuyuteiId}.jpg`,
    label: `Y${i + 1}`,
  }));

  const dbImages = unassignedDb
    .filter((c) => c.imageUrl && !c.imageUrl.includes("yuyu-tei"))
    .map((c, i) => ({
      id: c.id,
      imageUrl: c.imageUrl!,
      label: `B${i + 1}`,
    }));

  if (dbImages.length === 0) {
    stats.unmatched += unassignedListings.length;
    return stats;
  }

  const matchMap = await geminiMatchParallels(ai, yuyuImages, dbImages);

  if (!matchMap) {
    stats.geminiFailed += unassignedListings.length;
    return stats;
  }

  for (const listing of unassignedListings) {
    const dbCardId = matchMap.get(listing.yuyuteiId);
    if (!dbCardId) {
      stats.geminiFailed++;
      continue;
    }
    if (!dryRun) {
      await prisma.card.update({
        where: { id: dbCardId },
        data: {
          yuyuteiId: listing.yuyuteiId,
          yuyuteiUrl: listing.cardUrl,
          latestPriceJpy: listing.priceJpy,
        },
      });
    }
    stats.geminiMatched++;
  }

  return stats;
}

// ============================================================
// Post-processing: propagate prices from matched siblings
// ============================================================

async function propagateSiblingPrices(): Promise<number> {
  // Find all parallel cards without prices that have a sibling with a price
  const unpricedParallels = await prisma.card.findMany({
    where: {
      latestPriceJpy: null,
      isParallel: true,
      baseCode: { not: null },
    },
    select: { id: true, baseCode: true, setId: true },
  });

  let propagated = 0;
  const checked = new Set<string>();

  for (const card of unpricedParallels) {
    if (!card.baseCode) continue;
    const key = `${card.baseCode}-${card.setId}`;
    if (checked.has(key)) {
      // Already looked up a sibling for this group -- find cached price
      const sibling = await prisma.card.findFirst({
        where: {
          baseCode: card.baseCode,
          latestPriceJpy: { not: null },
        },
        select: { latestPriceJpy: true },
        orderBy: { isParallel: "asc" },
      });
      if (sibling?.latestPriceJpy != null) {
        await prisma.card.update({
          where: { id: card.id },
          data: { latestPriceJpy: sibling.latestPriceJpy },
        });
        propagated++;
      }
      continue;
    }
    checked.add(key);

    // Find any sibling with a price (prefer non-parallel base card price)
    const sibling = await prisma.card.findFirst({
      where: {
        baseCode: card.baseCode,
        latestPriceJpy: { not: null },
      },
      select: { latestPriceJpy: true },
      orderBy: { isParallel: "asc" },
    });

    if (sibling?.latestPriceJpy != null) {
      // Update ALL unpriced parallels with this baseCode at once
      const result = await prisma.card.updateMany({
        where: {
          baseCode: card.baseCode,
          latestPriceJpy: null,
          isParallel: true,
        },
        data: { latestPriceJpy: sibling.latestPriceJpy },
      });
      propagated += result.count;
    }
  }

  // Also propagate for non-parallel cards without prices (rare edge case)
  const unpricedBase = await prisma.card.findMany({
    where: {
      latestPriceJpy: null,
      isParallel: false,
      baseCode: { not: null },
    },
    select: { id: true, baseCode: true },
  });

  for (const card of unpricedBase) {
    if (!card.baseCode) continue;
    const sibling = await prisma.card.findFirst({
      where: {
        baseCode: card.baseCode,
        latestPriceJpy: { not: null },
      },
      select: { latestPriceJpy: true },
    });
    if (sibling?.latestPriceJpy != null) {
      await prisma.card.update({
        where: { id: card.id },
        data: { latestPriceJpy: sibling.latestPriceJpy },
      });
      propagated++;
    }
  }

  return propagated;
}

// ============================================================
// Main
// ============================================================

async function main() {
  const setFilter = process.argv.find((_, i, a) => a[i - 1] === "--set") ?? null;
  const dryRun = process.argv.includes("--dry-run");

  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
    console.log("Gemini Vision enabled for multi-parallel matching\n");
  } else {
    console.log("GEMINI_API_KEY not set -- falling back to text-only matching\n");
  }

  if (dryRun) console.log("=== DRY RUN (no DB writes) ===\n");

  const codes = setFilter ? SET_CODES.filter((c) => c === setFilter) : SET_CODES;

  if (setFilter && codes.length === 0) {
    console.error(`Set "${setFilter}" not found`);
    process.exit(1);
  }

  console.log(`Seeding yuyuteiId for ${codes.length} sets...\n`);

  let totalDirect = 0;
  let totalGemini = 0;
  let totalPriceOnly = 0;
  let totalUnmatched = 0;
  let totalAlready = 0;
  let totalGeminiFailed = 0;
  let geminiCalls = 0;
  const unmatchedSamples: string[] = [];

  for (const setCode of codes) {
    const url = `${BASE_URL}/sell/opc/s/${setCode}`;
    console.log(`[${setCode}] ${url}`);

    try {
      const $ = await fetchPage(url);
      const listings = parseListings($);

      if (listings.length === 0) {
        console.log(`  (no listings found)`);
        await sleep(DELAY_MS);
        continue;
      }

      const dbSet = await prisma.cardSet.findFirst({
        where: { code: { equals: setCode, mode: "insensitive" } },
      });
      if (!dbSet) {
        console.log(`  (set not in DB)`);
        await sleep(DELAY_MS);
        continue;
      }

      // Group by baseCode
      const groups = new Map<string, YuyuteiListing[]>();
      for (const listing of listings) {
        const key = listing.cardCode;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(listing);
      }

      let setDirect = 0;
      let setGemini = 0;
      let setPriceOnly = 0;
      let setUnmatched = 0;
      let setAlready = 0;
      let setGeminiFailed = 0;

      for (const [baseCode, groupListings] of groups) {
        const hasMultiParallel =
          groupListings.filter((l) => l.isParallel).length >= 2;

        const stats = await matchSetGroup(
          setCode,
          dbSet.id,
          baseCode,
          groupListings,
          hasMultiParallel ? ai : null,
          dryRun
        );

        if (hasMultiParallel && ai && stats.geminiMatched > 0) {
          geminiCalls++;
        }

        setDirect += stats.directMatched;
        setGemini += stats.geminiMatched;
        setPriceOnly += stats.priceOnly;
        setUnmatched += stats.unmatched;
        setAlready += stats.alreadyDone;
        setGeminiFailed += stats.geminiFailed;

        if (stats.unmatched > 0 && unmatchedSamples.length < 30) {
          const unmatched = groupListings.filter(
            (l) =>
              !l.isParallel
                ? stats.unmatched > 0
                : stats.unmatched > 0
          );
          for (const l of unmatched) {
            if (unmatchedSamples.length >= 30) break;
            unmatchedSamples.push(
              `${setCode} | ${l.cardCode} ${l.rarity} ${l.isParallel ? "(P)" : ""} | ${l.name}`
            );
          }
        }
      }

      totalDirect += setDirect;
      totalGemini += setGemini;
      totalPriceOnly += setPriceOnly;
      totalUnmatched += setUnmatched;
      totalAlready += setAlready;
      totalGeminiFailed += setGeminiFailed;

      const geminiStr = setGemini > 0 ? `, ${setGemini} gemini` : "";
      const priceStr = setPriceOnly > 0 ? `, ${setPriceOnly} price-only` : "";
      const failStr = setGeminiFailed > 0 ? `, ${setGeminiFailed} gemini-fail` : "";
      console.log(
        `  ${listings.length} listings -> ${setDirect} direct${geminiStr}${priceStr}, ${setAlready} already, ${setUnmatched} unmatched${failStr}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: ${msg}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n========================================`);
  console.log(`Done!`);
  console.log(`  Direct matched: ${totalDirect}`);
  console.log(`  Gemini matched: ${totalGemini}`);
  console.log(`  Price-only:     ${totalPriceOnly}`);
  console.log(`  Already done:   ${totalAlready}`);
  console.log(`  Unmatched:      ${totalUnmatched}`);
  console.log(`  Gemini failed:  ${totalGeminiFailed}`);
  console.log(`  Gemini calls:   ${geminiCalls}`);

  if (unmatchedSamples.length > 0) {
    console.log(`\nUnmatched samples:`);
    unmatchedSamples.forEach((s) => console.log(`  - ${s}`));
  }

  // Post-processing: propagate prices from matched siblings to unpriced parallels
  if (!dryRun) {
    console.log(`\nPropagating prices to unpriced parallels...`);
    const propagated = await propagateSiblingPrices();
    console.log(`  ${propagated} parallel cards received sibling prices`);
  }

  const [totalWithId, totalWithPrice, totalCards] = await Promise.all([
    prisma.card.count({ where: { yuyuteiId: { not: null } } }),
    prisma.card.count({ where: { latestPriceJpy: { not: null } } }),
    prisma.card.count(),
  ]);
  console.log(`\nDB coverage:`);
  console.log(`  yuyuteiId: ${totalWithId}/${totalCards} (${((totalWithId / totalCards) * 100).toFixed(1)}%)`);
  console.log(`  has price: ${totalWithPrice}/${totalCards} (${((totalWithPrice / totalCards) * 100).toFixed(1)}%)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
