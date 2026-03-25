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

const SETS = [
  { code: "op01", name: "ROMANCE DAWN", type: "BOOSTER" as const },
  { code: "op02", name: "頂上決戦", type: "BOOSTER" as const },
  { code: "op03", name: "強大な敵", type: "BOOSTER" as const },
  { code: "op04", name: "謀略の王国", type: "BOOSTER" as const },
  { code: "op05", name: "新時代の主役", type: "BOOSTER" as const },
  { code: "op06", name: "双璧の覇者", type: "BOOSTER" as const },
  { code: "op07", name: "500年後の未来", type: "BOOSTER" as const },
  { code: "op08", name: "二つの伝説", type: "BOOSTER" as const },
  { code: "op09", name: "四皇の覇気", type: "BOOSTER" as const },
  { code: "op10", name: "ロイヤルブラッドライン", type: "BOOSTER" as const },
  { code: "op11", name: "激闘の支配者", type: "BOOSTER" as const },
  { code: "op12", name: "烈風の支配者", type: "BOOSTER" as const },
  { code: "op13", name: "紡がれし絆", type: "BOOSTER" as const },
  { code: "op14", name: "蒼海の七星", type: "BOOSTER" as const },
  { code: "op15", name: "誓いの絆", type: "BOOSTER" as const },
  { code: "eb01", name: "Memorial Collection", type: "EXTRA_BOOSTER" as const },
  { code: "eb02", name: "Extra Booster 02", type: "EXTRA_BOOSTER" as const },
  { code: "eb03", name: "ONE PIECE HEROINES Edition", type: "EXTRA_BOOSTER" as const },
  { code: "eb04", name: "Extra Booster 04", type: "EXTRA_BOOSTER" as const },
  { code: "st01", name: "麦わらの一味", type: "STARTER" as const },
  { code: "st02", name: "最悪の世代", type: "STARTER" as const },
  { code: "st03", name: "王下七武海", type: "STARTER" as const },
  { code: "st04", name: "百獣海賊団", type: "STARTER" as const },
  { code: "st05", name: "ONE PIECE FILM edition", type: "STARTER" as const },
  { code: "st06", name: "海軍絶対正義", type: "STARTER" as const },
  { code: "st07", name: "BIG MOMの海賊団", type: "STARTER" as const },
  { code: "st08", name: "Side-モンキー・D・ルフィ", type: "STARTER" as const },
  { code: "st09", name: "Side-ヤマト", type: "STARTER" as const },
  { code: "st10", name: "ウルトラデッキ 三兄弟の絆", type: "STARTER" as const },
  { code: "st11", name: "ウタ", type: "STARTER" as const },
  { code: "st12", name: "ゾロ&サンジ", type: "STARTER" as const },
  { code: "st13", name: "ウルトラデッキ 三船長集結", type: "STARTER" as const },
  { code: "st14", name: "3D2Y", type: "STARTER" as const },
  { code: "st15", name: "RED Edward.Newgate", type: "STARTER" as const },
  { code: "st16", name: "GREEN Uta", type: "STARTER" as const },
  { code: "st17", name: "BLUE Donquixote Doflamingo", type: "STARTER" as const },
  { code: "st18", name: "PURPLE Monkey.D.Luffy", type: "STARTER" as const },
  { code: "st19", name: "BLACK Smoker", type: "STARTER" as const },
  { code: "st20", name: "YELLOW Charlotte Katakuri", type: "STARTER" as const },
  { code: "st21", name: "Starter Deck 21", type: "STARTER" as const },
  { code: "prb01", name: "Premium Booster 01", type: "PROMO" as const },
  { code: "prb02", name: "Premium Booster 02", type: "PROMO" as const },
  { code: "don", name: "DON!! Card Collection", type: "PROMO" as const },
];

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
  console.log(`Starting master data scrape for ${SETS.length} sets...`);
  let totalCards = 0;
  let totalSets = 0;
  const errors: string[] = [];
  const startTime = Date.now();

  for (const setInfo of SETS) {
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
          const imageUrl = isDon && card.yuyuteiImgUrl
            ? card.yuyuteiImgUrl
            : isDon && card.yuyuteiId
              ? `https://card.yuyu-tei.jp/opc/front/${setInfo.code}/${card.yuyuteiId}.jpg`
              : getBandaiImageUrl(baseCode, null);

          await prisma.card.upsert({
            where: { cardCode: compositeCode },
            update: {
              yuyuteiId: card.yuyuteiId, yuyuteiUrl: card.cardUrl,
              nameJp: card.name, rarity: card.rarity, imageUrl,
              isParallel: false, baseCode, parallelIndex: null,
              latestPriceJpy: card.priceJpy,
            },
            create: {
              cardCode: compositeCode, yuyuteiId: card.yuyuteiId,
              yuyuteiUrl: card.cardUrl, setId: cardSet.id,
              nameJp: card.name, rarity: card.rarity, cardType: "CHARACTER",
              color: "Unknown", imageUrl, isParallel: false,
              baseCode, parallelIndex: null, latestPriceJpy: card.priceJpy,
            },
          });
          upserted++;
        }

        // Upsert parallel cards with correct Bandai index
        for (const { card, bandaiIndex } of withIndex) {
          const isDon = card.rarity === "DON" || card.name.includes("ドン!!");
          const compositeCode = isDon && card.yuyuteiId
            ? `${setInfo.code}-DON-${card.yuyuteiId}`
            : `${card.cardCode}${card.yuyuteiId ? `-${card.yuyuteiId}` : ""}`;
          const imageUrl = isDon && card.yuyuteiImgUrl
            ? card.yuyuteiImgUrl
            : isDon && card.yuyuteiId
              ? `https://card.yuyu-tei.jp/opc/front/${setInfo.code}/${card.yuyuteiId}.jpg`
              : getBandaiImageUrl(baseCode, bandaiIndex);

          await prisma.card.upsert({
            where: { cardCode: compositeCode },
            update: {
              yuyuteiId: card.yuyuteiId, yuyuteiUrl: card.cardUrl,
              nameJp: card.name, rarity: card.rarity, imageUrl,
              isParallel: true, baseCode, parallelIndex: bandaiIndex,
              latestPriceJpy: card.priceJpy,
            },
            create: {
              cardCode: compositeCode, yuyuteiId: card.yuyuteiId,
              yuyuteiUrl: card.cardUrl, setId: cardSet.id,
              nameJp: card.name, rarity: card.rarity, cardType: "CHARACTER",
              color: "Unknown", imageUrl, isParallel: true,
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
