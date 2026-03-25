import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as cheerio from "cheerio";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BASE_URL = "https://yuyu-tei.jp";
const BANDAI_EN_IMG = "https://asia-en.onepiece-cardgame.com/images/cardlist/card";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const DELAY_MS = 1500;

import { SETS as SHARED_SETS } from "./sets";

const SETS = SHARED_SETS.map((s) => ({ code: s.code, name: s.nameJp, type: s.type }));

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return cheerio.load(await res.text());
}

interface ScrapedCard {
  cardCode: string;
  name: string;
  rarity: string;
  priceJpy: number;
  inStock: boolean;
  yuyuteiImgUrl?: string;
  yuyuteiId?: string;
  cardUrl?: string;
}

function parseCards($: cheerio.CheerioAPI): ScrapedCard[] {
  const cards: ScrapedCard[] = [];
  $(".card-product").each((_, el) => {
    const $el = $(el);
    const cardCode = $el.find("span.border-dark").first().text().trim();
    if (!cardCode) return;

    const priceText = $el.find("strong.text-end").first().text().trim();
    const priceJpy = parseInt(priceText.replace(/[^0-9]/g, ""), 10);
    if (isNaN(priceJpy) || priceJpy === 0) return;

    const imgEl = $el.find(".product-img img.card").first();
    const altText = imgEl.attr("alt") || "";
    const yuyuteiImgUrl = imgEl.attr("src") || undefined;

    const altMatch = altText.match(
      /^[\w-]+\s+(P-SEC|P-SR|P-R|P-UC|P-C|P-L|P-P|SEC|SR|SP|R|UC|C|L|P)?\s*(.*)/
    );
    let rarity = altMatch?.[1] || "Unknown";
    const name =
      altMatch?.[2]?.trim() ||
      $el.find("h4.text-primary").first().text().trim();

    if (rarity === "Unknown" && name.includes("ドン!!")) {
      rarity = "DON";
    }

    const isParallel = name.includes("パラレル") || rarity.startsWith("P-") || rarity === "SP";
    if (isParallel && !rarity.startsWith("P-") && rarity !== "SP" && rarity !== "Unknown" && rarity !== "DON") {
      rarity = `P-${rarity}`;
    }

    const href = $el.find("a[href*='/sell/opc/card/']").first().attr("href");
    const yuyuteiId =
      $el.find("input.cart_cid").val()?.toString() || href?.split("/").pop();
    const inStock = !$el.hasClass("sold-out");

    cards.push({
      cardCode, name, rarity, priceJpy, inStock, yuyuteiImgUrl,
      yuyuteiId, cardUrl: href || undefined,
    });
  });
  return cards;
}

// ============================================================
// Bandai Image Mapping
// Determines the correct _pN suffix from Yuyu-tei card name/rarity
// ============================================================

type ParallelType = "REGULAR" | "SUPER" | "RED_SUPER" | "SP";

function classifyParallel(name: string, rarity: string): ParallelType {
  if (rarity === "SP") return "SP";
  if (name.includes("レッドスーパーパラレル")) return "RED_SUPER";
  if (name.includes("スーパーパラレル")) return "SUPER";
  if (name.includes("特別パラレル")) return "SUPER";
  return "REGULAR";
}

const PARALLEL_TYPE_ORDER: Record<ParallelType, number> = {
  REGULAR: 1,    // _p1
  SUPER: 2,      // _p2
  RED_SUPER: 3,  // _p3
  SP: 4,         // _p4
};

function assignBandaiIndex(
  parallels: { card: ScrapedCard; type: ParallelType }[]
): { card: ScrapedCard; bandaiIndex: number }[] {
  // Group by type
  const byType = new Map<ParallelType, ScrapedCard[]>();
  for (const p of parallels) {
    if (!byType.has(p.type)) byType.set(p.type, []);
    byType.get(p.type)!.push(p.card);
  }

  const result: { card: ScrapedCard; bandaiIndex: number }[] = [];

  // Check if ALL parallels are REGULAR (e.g., R cards with 2 parallels both called パラレル)
  const allRegular = parallels.every((p) => p.type === "REGULAR");

  if (allRegular && parallels.length > 1) {
    // Multiple REGULAR parallels: sort by price, assign _p1, _p2, etc.
    const sorted = [...parallels].sort((a, b) => a.card.priceJpy - b.card.priceJpy);
    sorted.forEach((p, i) => result.push({ card: p.card, bandaiIndex: i + 1 }));
  } else {
    // Mixed types: use type-based ordering
    for (const p of parallels) {
      result.push({ card: p.card, bandaiIndex: PARALLEL_TYPE_ORDER[p.type] });
    }
  }

  return result;
}

function getBandaiImageUrl(baseCode: string, bandaiIndex: number | null): string {
  if (bandaiIndex === null) {
    return `${BANDAI_EN_IMG}/${baseCode}.png`;
  }
  return `${BANDAI_EN_IMG}/${baseCode}_p${bandaiIndex}.png`;
}

function isParallelCard(card: ScrapedCard): boolean {
  return card.name.includes("パラレル") || card.rarity.startsWith("P-") || card.rarity === "SP";
}

// ============================================================
// Main
// ============================================================

async function main() {
  const setFilter = process.argv.find((_, i, a) => a[i - 1] === "--set") ?? null;
  const setsToScrape = setFilter
    ? SETS.filter((s) => s.code === setFilter)
    : SETS;

  if (setFilter && setsToScrape.length === 0) {
    console.error(`Set "${setFilter}" not found`);
    process.exit(1);
  }

  console.log(`Starting master data scrape for ${setsToScrape.length} sets...`);
  let totalCards = 0;
  let totalSets = 0;
  const errors: string[] = [];
  const startTime = Date.now();

  for (const setInfo of setsToScrape) {
    const url = `${BASE_URL}/sell/opc/s/${setInfo.code}`;
    console.log(`\n[${setInfo.code}] ${setInfo.name} — ${url}`);

    try {
      const $ = await fetchPage(url);
      const listings = parseCards($);

      if (listings.length === 0) {
        console.log(`  ⚠ No cards found (may not exist on Yuyu-tei)`);
        errors.push(`${setInfo.code}: 0 cards`);
        await sleep(DELAY_MS);
        continue;
      }

      const cardSet = await prisma.cardSet.upsert({
        where: { code: setInfo.code },
        update: { name: setInfo.name, type: setInfo.type },
        create: { code: setInfo.code, name: setInfo.name, type: setInfo.type },
      });

      // Group listings by base OPCG code
      const baseGroups = new Map<string, ScrapedCard[]>();
      for (const card of listings) {
        const baseCode = card.cardCode.toUpperCase();
        if (!baseGroups.has(baseCode)) baseGroups.set(baseCode, []);
        baseGroups.get(baseCode)!.push(card);
      }

      let upserted = 0;
      for (const [baseCode, group] of baseGroups) {
        const baseCards = group.filter((c) => !isParallelCard(c));
        const parallelCards = group.filter((c) => isParallelCard(c));

        // Classify each parallel and assign Bandai _pN index
        const classified = parallelCards.map((card) => ({
          card,
          type: classifyParallel(card.name, card.rarity),
        }));
        const withIndex = assignBandaiIndex(classified);

        // Upsert base cards
        for (const card of baseCards) {
          const isDon = card.rarity === "DON" || card.name.includes("ドン!!");
          const compositeCode = isDon && card.yuyuteiId
            ? `${setInfo.code}-DON-${card.yuyuteiId}`
            : `${card.cardCode}${card.yuyuteiId ? `-${card.yuyuteiId}` : ""}`;
          const fallbackImage = isDon && card.yuyuteiImgUrl
            ? card.yuyuteiImgUrl
            : isDon && card.yuyuteiId
              ? `https://card.yuyu-tei.jp/opc/front/${setInfo.code}/${card.yuyuteiId}.jpg`
              : getBandaiImageUrl(baseCode, null);

          await prisma.card.upsert({
            where: { cardCode: compositeCode },
            update: {
              yuyuteiId: card.yuyuteiId, yuyuteiUrl: card.cardUrl,
              nameJp: card.name, rarity: card.rarity,
              isParallel: false, baseCode,
              latestPriceJpy: card.priceJpy,
            },
            create: {
              cardCode: compositeCode, yuyuteiId: card.yuyuteiId,
              yuyuteiUrl: card.cardUrl, setId: cardSet.id,
              nameJp: card.name, rarity: card.rarity, cardType: "CHARACTER",
              color: "Unknown", imageUrl: fallbackImage, isParallel: false,
              baseCode, parallelIndex: null, latestPriceJpy: card.priceJpy,
            },
          });
          upserted++;
        }

        // Upsert parallel cards — don't overwrite imageUrl/parallelIndex on update (Gemini-matched)
        for (const { card, bandaiIndex } of withIndex) {
          const isDon = card.rarity === "DON" || card.name.includes("ドン!!");
          const compositeCode = isDon && card.yuyuteiId
            ? `${setInfo.code}-DON-${card.yuyuteiId}`
            : `${card.cardCode}${card.yuyuteiId ? `-${card.yuyuteiId}` : ""}`;
          const fallbackImage = card.yuyuteiImgUrl
            ? card.yuyuteiImgUrl
            : card.yuyuteiId
              ? `https://card.yuyu-tei.jp/opc/front/${setInfo.code}/${card.yuyuteiId}.jpg`
              : getBandaiImageUrl(baseCode, bandaiIndex);

          await prisma.card.upsert({
            where: { cardCode: compositeCode },
            update: {
              yuyuteiId: card.yuyuteiId, yuyuteiUrl: card.cardUrl,
              nameJp: card.name, rarity: card.rarity,
              isParallel: true, baseCode,
              latestPriceJpy: card.priceJpy,
            },
            create: {
              cardCode: compositeCode, yuyuteiId: card.yuyuteiId,
              yuyuteiUrl: card.cardUrl, setId: cardSet.id,
              nameJp: card.name, rarity: card.rarity, cardType: "CHARACTER",
              color: "Unknown", imageUrl: fallbackImage, isParallel: true,
              baseCode, parallelIndex: bandaiIndex, latestPriceJpy: card.priceJpy,
            },
          });
          upserted++;
        }
      }

      await prisma.cardSet.update({
        where: { id: cardSet.id },
        data: { cardCount: upserted },
      });

      console.log(`  ✓ ${upserted} cards upserted`);
      totalCards += upserted;
      totalSets++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ERROR: ${msg}`);
      errors.push(`${setInfo.code}: ${msg}`);
    }

    await sleep(DELAY_MS);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========================================`);
  console.log(`Done! ${totalCards} cards across ${totalSets} sets in ${elapsed}s`);
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
