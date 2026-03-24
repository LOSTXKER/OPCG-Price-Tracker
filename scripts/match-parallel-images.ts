import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import sharp from "sharp";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL is not set");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BANDAI_BASE = "https://www.onepiece-cardgame.com/images/cardlist/card";
const THUMB_SIZE = 64;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function toNormalizedPixels(buf: Buffer): Promise<Float64Array | null> {
  try {
    const { data } = await sharp(buf)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixels = new Float64Array(data.length);
    for (let i = 0; i < data.length; i++) pixels[i] = data[i] / 255;
    return pixels;
  } catch {
    return null;
  }
}

function mse(a: Float64Array, b: Float64Array): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return sum / a.length;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function probeBandaiParallels(
  baseCode: string,
  maxProbe = 8
): Promise<{ pIndex: number; pixels: Float64Array }[]> {
  const results: { pIndex: number; pixels: Float64Array }[] = [];
  for (let p = 1; p <= maxProbe; p++) {
    const url = `${BANDAI_BASE}/${baseCode}_p${p}.png`;
    const buf = await fetchImageBuffer(url);
    if (!buf) break;
    const px = await toNormalizedPixels(buf);
    if (px) results.push({ pIndex: p, pixels: px });
  }
  return results;
}

interface CardRow {
  id: number;
  cardCode: string;
  baseCode: string | null;
  parallelIndex: number | null;
  isParallel: boolean;
  yuyuteiId: string | null;
  imageUrl: string | null;
  nameJp: string;
  latestPriceJpy: number | null;
  set: { code: string };
}

async function scrapeYuyuteiImages(
  setCode: string
): Promise<Map<string, string>> {
  const cheerio = await import("cheerio");
  const url = `https://yuyu-tei.jp/sell/opc/s/${setCode}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return new Map();
  const $ = cheerio.load(await res.text());

  const map = new Map<string, string>();
  $(".card-product").each((_, el) => {
    const $el = $(el);
    const imgSrc = $el.find(".product-img img.card").first().attr("src");
    const href = $el.find("a[href*='/sell/opc/card/']").first().attr("href");
    const yuyuteiId =
      $el.find("input.cart_cid").val()?.toString() || href?.split("/").pop();
    if (yuyuteiId && imgSrc) {
      map.set(yuyuteiId, imgSrc);
    }
  });
  return map;
}

async function main() {
  console.log("=== Image Matching: Yuyu-tei vs Bandai CDN ===\n");

  const parallelCards = await prisma.card.findMany({
    where: { isParallel: true },
    include: { set: { select: { code: true } } },
    orderBy: [{ baseCode: "asc" }, { parallelIndex: "asc" }],
  });

  console.log(`Found ${parallelCards.length} parallel cards.\n`);

  const groups = new Map<string, CardRow[]>();
  for (const c of parallelCards) {
    if (!c.baseCode) continue;
    if (!groups.has(c.baseCode)) groups.set(c.baseCode, []);
    groups.get(c.baseCode)!.push(c);
  }

  console.log(`${groups.size} base codes with parallels.\n`);

  const setImageCache = new Map<string, Map<string, string>>();
  let matched = 0;
  let failed = 0;
  let skipped = 0;
  const lowConfidence: {
    baseCode: string;
    cardCode: string;
    bestMse: number;
  }[] = [];

  const entries = [...groups.entries()];
  for (let g = 0; g < entries.length; g++) {
    const [baseCode, cards] = entries[g];
    const setCode = cards[0].set.code;

    if (!setImageCache.has(setCode)) {
      console.log(`  Scraping Yuyu-tei images for set ${setCode}...`);
      setImageCache.set(setCode, await scrapeYuyuteiImages(setCode));
      await sleep(1000);
    }
    const yuyuteiImages = setImageCache.get(setCode)!;

    const yuyuteiPixels: {
      card: CardRow;
      pixels: Float64Array;
      yuyuUrl: string;
    }[] = [];
    for (const card of cards) {
      const yuyuUrl = card.yuyuteiId ? yuyuteiImages.get(card.yuyuteiId) : null;
      if (!yuyuUrl) {
        skipped++;
        continue;
      }
      const buf = await fetchImageBuffer(yuyuUrl);
      if (!buf) {
        skipped++;
        continue;
      }
      const px = await toNormalizedPixels(buf);
      if (!px) {
        skipped++;
        continue;
      }
      yuyuteiPixels.push({ card, pixels: px, yuyuUrl });
    }

    if (yuyuteiPixels.length === 0) {
      skipped += cards.length;
      continue;
    }

    const bandaiCandidates = await probeBandaiParallels(baseCode);
    if (bandaiCandidates.length === 0) {
      skipped += cards.length;
      continue;
    }

    // Build cost matrix: yuyuteiPixels x bandaiCandidates
    const costMatrix: number[][] = [];
    for (const yp of yuyuteiPixels) {
      const row: number[] = [];
      for (const bp of bandaiCandidates) {
        row.push(mse(yp.pixels, bp.pixels));
      }
      costMatrix.push(row);
    }

    // Greedy assignment (each yuyu card gets the closest unassigned bandai image)
    const usedBandai = new Set<number>();
    const assignments: { yIdx: number; bIdx: number; score: number }[] = [];

    const allPairs: { yIdx: number; bIdx: number; score: number }[] = [];
    for (let y = 0; y < costMatrix.length; y++) {
      for (let b = 0; b < costMatrix[y].length; b++) {
        allPairs.push({ yIdx: y, bIdx: b, score: costMatrix[y][b] });
      }
    }
    allPairs.sort((a, b) => a.score - b.score);

    const assignedY = new Set<number>();
    for (const pair of allPairs) {
      if (assignedY.has(pair.yIdx) || usedBandai.has(pair.bIdx)) continue;
      assignments.push(pair);
      assignedY.add(pair.yIdx);
      usedBandai.add(pair.bIdx);
    }

    for (const { yIdx, bIdx, score } of assignments) {
      const card = yuyuteiPixels[yIdx].card;
      const newPIndex = bandaiCandidates[bIdx].pIndex;
      const newImageUrl = `${BANDAI_BASE}/${baseCode}_p${newPIndex}.png`;

      const changed = card.parallelIndex !== newPIndex;
      if (changed) {
        await prisma.card.update({
          where: { id: card.id },
          data: { parallelIndex: newPIndex, imageUrl: newImageUrl },
        });
        matched++;
        console.log(
          `  [${baseCode}] ${card.cardCode}: p${card.parallelIndex ?? "?"} → p${newPIndex} (MSE=${score.toFixed(6)})${score > 0.05 ? " ⚠ LOW CONFIDENCE" : ""}`
        );
      } else {
        matched++;
      }

      if (score > 0.05) {
        lowConfidence.push({
          baseCode,
          cardCode: card.cardCode,
          bestMse: score,
        });
      }
    }

    // Cards not assigned (more yuyu variants than bandai images)
    for (let y = 0; y < yuyuteiPixels.length; y++) {
      if (!assignedY.has(y)) {
        failed++;
        console.log(
          `  [${baseCode}] ${yuyuteiPixels[y].card.cardCode}: NO MATCH (no Bandai image available)`
        );
      }
    }

    if ((g + 1) % 50 === 0) {
      console.log(
        `\nProgress: ${g + 1}/${entries.length} groups | Matched: ${matched} | Failed: ${failed} | Skipped: ${skipped}\n`
      );
    }
  }

  console.log("\n========================================");
  console.log(`Results:`);
  console.log(`  Matched: ${matched}`);
  console.log(`  Failed (no Bandai image): ${failed}`);
  console.log(`  Skipped (no Yuyu-tei image): ${skipped}`);
  console.log(`  Low confidence (MSE > 0.05): ${lowConfidence.length}`);

  if (lowConfidence.length > 0) {
    console.log("\nLow confidence matches (review in admin panel):");
    for (const lc of lowConfidence.slice(0, 20)) {
      console.log(
        `  ${lc.baseCode} / ${lc.cardCode} — MSE: ${lc.bestMse.toFixed(6)}`
      );
    }
    if (lowConfidence.length > 20) {
      console.log(`  ... and ${lowConfidence.length - 20} more`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
