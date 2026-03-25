import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as cheerio from "cheerio";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL is not set");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BASE_URL = "https://yuyu-tei.jp";
const BANDAI_EN_IMG =
  "https://asia-en.onepiece-cardgame.com/images/cardlist/card";
const OPTCG_API = "https://optcgapi.com/api/sets/card";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const DELAY_MS = 1500;
const OPTCG_DELAY = 150;

// ============================================================
// Sets — JP name from Yuyu-tei, EN name hardcoded
// ============================================================

const SETS: {
  code: string;
  nameJp: string;
  nameEn: string;
  type: "BOOSTER" | "EXTRA_BOOSTER" | "STARTER" | "PROMO";
}[] = [
  { code: "op01", nameJp: "ROMANCE DAWN", nameEn: "Romance Dawn", type: "BOOSTER" },
  { code: "op02", nameJp: "頂上決戦", nameEn: "Paramount War", type: "BOOSTER" },
  { code: "op03", nameJp: "強大な敵", nameEn: "Pillars of Strength", type: "BOOSTER" },
  { code: "op04", nameJp: "謀略の王国", nameEn: "Kingdoms of Intrigue", type: "BOOSTER" },
  { code: "op05", nameJp: "新時代の主役", nameEn: "Awakening of the New Era", type: "BOOSTER" },
  { code: "op06", nameJp: "双璧の覇者", nameEn: "Wings of the Captain", type: "BOOSTER" },
  { code: "op07", nameJp: "500年後の未来", nameEn: "500 Years in the Future", type: "BOOSTER" },
  { code: "op08", nameJp: "二つの伝説", nameEn: "Two Legends", type: "BOOSTER" },
  { code: "op09", nameJp: "四皇の覇気", nameEn: "The Four Emperors", type: "BOOSTER" },
  { code: "op10", nameJp: "ロイヤルブラッドライン", nameEn: "Royal Bloodlines", type: "BOOSTER" },
  { code: "op11", nameJp: "激闘の支配者", nameEn: "Rulers of the Fierce Battle", type: "BOOSTER" },
  { code: "op12", nameJp: "烈風の支配者", nameEn: "Rulers of the Gale", type: "BOOSTER" },
  { code: "op13", nameJp: "紡がれし絆", nameEn: "The Bonds Woven Together", type: "BOOSTER" },
  { code: "op14", nameJp: "蒼海の七星", nameEn: "Seven Stars of the Blue Sea", type: "BOOSTER" },
  { code: "op15", nameJp: "誓いの絆", nameEn: "Bonds of the Oath", type: "BOOSTER" },
  { code: "eb01", nameJp: "Memorial Collection", nameEn: "Memorial Collection", type: "EXTRA_BOOSTER" },
  { code: "eb02", nameJp: "Extra Booster 02", nameEn: "Extra Booster: Anime 25th Collection Vol.1", type: "EXTRA_BOOSTER" },
  { code: "eb03", nameJp: "ONE PIECE HEROINES Edition", nameEn: "Extra Booster: Premium Card Collection -ONE PIECE FILM edition-", type: "EXTRA_BOOSTER" },
  { code: "eb04", nameJp: "Extra Booster 04", nameEn: "Extra Booster 04", type: "EXTRA_BOOSTER" },
  { code: "st01", nameJp: "麦わらの一味", nameEn: "Straw Hat Crew", type: "STARTER" },
  { code: "st02", nameJp: "最悪の世代", nameEn: "Worst Generation", type: "STARTER" },
  { code: "st03", nameJp: "王下七武海", nameEn: "The Seven Warlords of the Sea", type: "STARTER" },
  { code: "st04", nameJp: "百獣海賊団", nameEn: "Animal Kingdom Pirates", type: "STARTER" },
  { code: "st05", nameJp: "ONE PIECE FILM edition", nameEn: "ONE PIECE FILM edition", type: "STARTER" },
  { code: "st06", nameJp: "海軍絶対正義", nameEn: "Navy", type: "STARTER" },
  { code: "st07", nameJp: "BIG MOMの海賊団", nameEn: "Big Mom Pirates", type: "STARTER" },
  { code: "st08", nameJp: "Side-モンキー・D・ルフィ", nameEn: "Side Monkey.D.Luffy", type: "STARTER" },
  { code: "st09", nameJp: "Side-ヤマト", nameEn: "Side Yamato", type: "STARTER" },
  { code: "st10", nameJp: "ウルトラデッキ 三兄弟の絆", nameEn: "Ultra Deck: The Three Brothers' Bond", type: "STARTER" },
  { code: "st11", nameJp: "ウタ", nameEn: "Uta", type: "STARTER" },
  { code: "st12", nameJp: "ゾロ&サンジ", nameEn: "Zoro and Sanji", type: "STARTER" },
  { code: "st13", nameJp: "ウルトラデッキ 三船長集結", nameEn: "Ultra Deck: The Three Captains", type: "STARTER" },
  { code: "st14", nameJp: "3D2Y", nameEn: "3D2Y", type: "STARTER" },
  { code: "st15", nameJp: "RED Edward.Newgate", nameEn: "RED Edward.Newgate", type: "STARTER" },
  { code: "st16", nameJp: "GREEN Uta", nameEn: "GREEN Uta", type: "STARTER" },
  { code: "st17", nameJp: "BLUE Donquixote Doflamingo", nameEn: "BLUE Donquixote Doflamingo", type: "STARTER" },
  { code: "st18", nameJp: "PURPLE Monkey.D.Luffy", nameEn: "PURPLE Monkey.D.Luffy", type: "STARTER" },
  { code: "st19", nameJp: "BLACK Smoker", nameEn: "BLACK Smoker", type: "STARTER" },
  { code: "st20", nameJp: "YELLOW Charlotte Katakuri", nameEn: "YELLOW Charlotte Katakuri", type: "STARTER" },
  { code: "st21", nameJp: "Starter Deck 21", nameEn: "Starter Deck 21", type: "STARTER" },
  { code: "prb01", nameJp: "Premium Booster 01", nameEn: "Premium Booster 01", type: "PROMO" },
];

// ============================================================
// Helpers
// ============================================================

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

async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchPage(url);
    } catch (e) {
      if (i === retries - 1) throw e;
      console.warn(`  Retry ${i + 1}/${retries}...`);
      await sleep(2000 * (i + 1));
    }
  }
  throw new Error("unreachable");
}

// ============================================================
// Yuyu-tei Parser
// ============================================================

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

    // DON!! cards have no rarity in alt text
    if (rarity === "Unknown" && name.includes("ドン!!")) {
      rarity = "DON";
    }

    // Parallel cards must have P- prefix on rarity
    const isParallel = name.includes("パラレル") || rarity.startsWith("P-") || rarity === "SP";
    if (isParallel && !rarity.startsWith("P-") && rarity !== "SP" && rarity !== "Unknown" && rarity !== "DON") {
      rarity = `P-${rarity}`;
    }

    const href = $el.find("a[href*='/sell/opc/card/']").first().attr("href");
    const yuyuteiId =
      $el.find("input.cart_cid").val()?.toString() || href?.split("/").pop();
    const inStock = !$el.hasClass("sold-out");

    cards.push({
      cardCode,
      name,
      rarity,
      priceJpy,
      inStock,
      yuyuteiImgUrl,
      yuyuteiId,
      cardUrl: href || undefined,
    });
  });
  return cards;
}

// ============================================================
// Bandai Image Mapping (_pN suffix)
// ============================================================

type ParallelType = "REGULAR" | "SUPER" | "RED_SUPER" | "SP";

function classifyParallel(name: string, rarity: string): ParallelType {
  if (rarity === "SP") return "SP";
  if (name.includes("レッドスーパーパラレル")) return "RED_SUPER";
  if (name.includes("スーパーパラレル") || name.includes("特別パラレル"))
    return "SUPER";
  return "REGULAR";
}

const PARALLEL_TYPE_ORDER: Record<ParallelType, number> = {
  REGULAR: 1,
  SUPER: 2,
  RED_SUPER: 3,
  SP: 4,
};

function assignBandaiIndex(
  parallels: { card: ScrapedCard; type: ParallelType }[]
): { card: ScrapedCard; bandaiIndex: number }[] {
  const allRegular = parallels.every((p) => p.type === "REGULAR");

  if (allRegular && parallels.length > 1) {
    const sorted = [...parallels].sort(
      (a, b) => a.card.priceJpy - b.card.priceJpy
    );
    return sorted.map((p, i) => ({ card: p.card, bandaiIndex: i + 1 }));
  }

  return parallels.map((p) => ({
    card: p.card,
    bandaiIndex: PARALLEL_TYPE_ORDER[p.type],
  }));
}

function getBandaiImageUrl(
  baseCode: string,
  bandaiIndex: number | null
): string {
  if (bandaiIndex === null) return `${BANDAI_EN_IMG}/${baseCode}.png`;
  return `${BANDAI_EN_IMG}/${baseCode}_p${bandaiIndex}.png`;
}

function isParallelCard(card: ScrapedCard): boolean {
  return (
    card.name.includes("パラレル") ||
    card.rarity.startsWith("P-") ||
    card.rarity === "SP"
  );
}

// ============================================================
// OPTCG API types
// ============================================================

function mapCardType(
  type: string | undefined
): "CHARACTER" | "EVENT" | "STAGE" | "LEADER" | "DON" {
  switch (type?.toUpperCase()) {
    case "CHARACTER":
      return "CHARACTER";
    case "EVENT":
      return "EVENT";
    case "STAGE":
      return "STAGE";
    case "LEADER":
      return "LEADER";
    case "DON!!":
      return "DON";
    default:
      return "CHARACTER";
  }
}

// ============================================================
// STEP 1: Clear DB
// ============================================================

async function clearDatabase() {
  console.log("=== Step 1: Clearing database ===");

  await prisma.communityPriceVote.deleteMany();
  await prisma.communityPrice.deleteMany();
  await prisma.deckCard.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.priceAlert.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.portfolioSnapshot.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.cardPrice.deleteMany();
  await prisma.sourceMapping.deleteMany();
  await prisma.setDropRate.deleteMany();
  await prisma.card.deleteMany();
  await prisma.cardSet.deleteMany();

  console.log("  DB cleared.\n");
}

// ============================================================
// STEP 2: Scrape all sets from Yuyu-tei + Bandai images
// ============================================================

async function scrapeAllSets() {
  console.log(`=== Step 2: Scraping ${SETS.length} sets from Yuyu-tei ===\n`);
  let totalCards = 0;
  const errors: string[] = [];

  for (const setInfo of SETS) {
    const url = `${BASE_URL}/sell/opc/s/${setInfo.code}`;
    process.stdout.write(`[${setInfo.code}] ${setInfo.nameEn}...`);

    try {
      const $ = await fetchWithRetry(url);
      const listings = parseCards($);

      if (listings.length === 0) {
        console.log(` 0 cards (skipped)`);
        errors.push(`${setInfo.code}: 0 cards`);
        await sleep(DELAY_MS);
        continue;
      }

      const cardSet = await prisma.cardSet.upsert({
        where: { code: setInfo.code },
        update: {
          name: setInfo.nameJp,
          nameEn: setInfo.nameEn,
          type: setInfo.type,
        },
        create: {
          code: setInfo.code,
          name: setInfo.nameJp,
          nameEn: setInfo.nameEn,
          type: setInfo.type,
        },
      });

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

        const classified = parallelCards.map((card) => ({
          card,
          type: classifyParallel(card.name, card.rarity),
        }));
        const withIndex = assignBandaiIndex(classified);

        for (const card of baseCards) {
          const compositeCode = `${card.cardCode}${card.yuyuteiId ? `-${card.yuyuteiId}` : ""}`;
          const isDon = baseCode === "-" || card.rarity === "DON";
          const imageUrl = isDon && card.yuyuteiImgUrl
            ? card.yuyuteiImgUrl
            : isDon && card.yuyuteiId
              ? `https://card.yuyu-tei.jp/opc/front/${setInfo.code}/${card.yuyuteiId}.jpg`
              : getBandaiImageUrl(baseCode, null);

          await prisma.card.upsert({
            where: { cardCode: compositeCode },
            update: {
              yuyuteiId: card.yuyuteiId,
              yuyuteiUrl: card.cardUrl,
              nameJp: card.name,
              rarity: card.rarity,
              imageUrl,
              isParallel: false,
              baseCode,
              parallelIndex: null,
              latestPriceJpy: card.priceJpy,
            },
            create: {
              cardCode: compositeCode,
              yuyuteiId: card.yuyuteiId,
              yuyuteiUrl: card.cardUrl,
              setId: cardSet.id,
              nameJp: card.name,
              rarity: card.rarity,
              cardType: "CHARACTER",
              color: "Unknown",
              imageUrl,
              isParallel: false,
              baseCode,
              parallelIndex: null,
              latestPriceJpy: card.priceJpy,
            },
          });

          await prisma.cardPrice.create({
            data: {
              cardId: (
                await prisma.card.findUnique({
                  where: { cardCode: compositeCode },
                })
              )!.id,
              source: "YUYUTEI",
              type: "SELL",
              priceJpy: card.priceJpy,
              inStock: card.inStock,
            },
          });
          upserted++;
        }

        for (const { card, bandaiIndex } of withIndex) {
          const compositeCode = `${card.cardCode}${card.yuyuteiId ? `-${card.yuyuteiId}` : ""}`;
          const isDon = baseCode === "-" || card.rarity === "DON";
          const imageUrl = isDon && card.yuyuteiImgUrl
            ? card.yuyuteiImgUrl
            : isDon && card.yuyuteiId
              ? `https://card.yuyu-tei.jp/opc/front/${setInfo.code}/${card.yuyuteiId}.jpg`
              : getBandaiImageUrl(baseCode, bandaiIndex);

          await prisma.card.upsert({
            where: { cardCode: compositeCode },
            update: {
              yuyuteiId: card.yuyuteiId,
              yuyuteiUrl: card.cardUrl,
              nameJp: card.name,
              rarity: card.rarity,
              imageUrl,
              isParallel: true,
              baseCode,
              parallelIndex: bandaiIndex,
              latestPriceJpy: card.priceJpy,
            },
            create: {
              cardCode: compositeCode,
              yuyuteiId: card.yuyuteiId,
              yuyuteiUrl: card.cardUrl,
              setId: cardSet.id,
              nameJp: card.name,
              rarity: card.rarity,
              cardType: "CHARACTER",
              color: "Unknown",
              imageUrl,
              isParallel: true,
              baseCode,
              parallelIndex: bandaiIndex,
              latestPriceJpy: card.priceJpy,
            },
          });

          await prisma.cardPrice.create({
            data: {
              cardId: (
                await prisma.card.findUnique({
                  where: { cardCode: compositeCode },
                })
              )!.id,
              source: "YUYUTEI",
              type: "SELL",
              priceJpy: card.priceJpy,
              inStock: card.inStock,
            },
          });
          upserted++;
        }
      }

      await prisma.cardSet.update({
        where: { id: cardSet.id },
        data: { cardCount: upserted },
      });

      console.log(` ${upserted} cards`);
      totalCards += upserted;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(` ERROR: ${msg}`);
      errors.push(`${setInfo.code}: ${msg}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n  Total: ${totalCards} cards scraped`);
  if (errors.length) {
    console.log(`  Errors: ${errors.join(", ")}`);
  }
  return totalCards;
}

// ============================================================
// STEP 3: Enrich with OPTCG API (EN names, effects, colors, etc.)
// ============================================================

async function enrichFromOptcg() {
  console.log("\n=== Step 3: Enriching from OPTCG API ===\n");

  const allCards = await prisma.card.findMany({
    select: {
      id: true,
      cardCode: true,
      baseCode: true,
      isParallel: true,
      parallelIndex: true,
    },
    orderBy: { cardCode: "asc" },
  });

  const baseCodes = new Set<string>();
  for (const card of allCards) {
    if (card.baseCode) baseCodes.add(card.baseCode);
  }

  console.log(`  ${baseCodes.size} unique base codes to look up`);

  let enriched = 0;
  let skipped = 0;
  let apiErrors = 0;
  let processed = 0;

  for (const baseCode of baseCodes) {
    processed++;
    if (processed % 50 === 0) {
      process.stdout.write(
        `  Progress: ${processed}/${baseCodes.size} (enriched: ${enriched})\n`
      );
    }

    try {
      const res = await fetch(`${OPTCG_API}/${baseCode}/?format=json`, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (!res.ok) {
        skipped++;
        continue;
      }

      const variants: Array<{
        card_name: string;
        card_image_id: string;
        card_color: string;
        card_type: string;
        card_cost: string | null;
        card_power: string | null;
        counter_amount: number | null;
        attribute: string | null;
        sub_types: string | null;
        card_text: string | null;
        life: string | null;
        rarity: string;
      }> = await res.json();

      if (!Array.isArray(variants) || variants.length === 0) {
        skipped++;
        continue;
      }

      const baseMeta = variants[0];
      const dbCards = allCards.filter((c) => c.baseCode === baseCode);

      for (const dbCard of dbCards) {
        let optcgMatch = null;
        if (!dbCard.isParallel) {
          optcgMatch = variants.find((v) => v.card_image_id === baseCode);
        } else if (dbCard.parallelIndex) {
          optcgMatch = variants.find(
            (v) =>
              v.card_image_id === `${baseCode}_p${dbCard.parallelIndex}`
          );
        }

        const nameEn = optcgMatch?.card_name || baseMeta.card_name;

        await prisma.card.update({
          where: { id: dbCard.id },
          data: {
            nameEn,
            color: baseMeta.card_color || "Unknown",
            colorEn: baseMeta.card_color || null,
            cardType: mapCardType(baseMeta.card_type),
            cost: baseMeta.card_cost ? parseInt(baseMeta.card_cost) : null,
            power: baseMeta.card_power ? parseInt(baseMeta.card_power) : null,
            counter: baseMeta.counter_amount || null,
            life: baseMeta.life ? parseInt(baseMeta.life) : null,
            attribute: baseMeta.attribute || null,
            trait: baseMeta.sub_types || null,
            effectEn: baseMeta.card_text || null,
          },
        });
        enriched++;
      }
    } catch {
      apiErrors++;
    }

    await sleep(OPTCG_DELAY);
  }

  console.log(`\n  Enriched: ${enriched} cards`);
  console.log(`  Skipped (not in OPTCG): ${skipped} base codes`);
  console.log(`  API errors: ${apiErrors}`);
}

// ============================================================
// Main
// ============================================================

async function main() {
  const startTime = Date.now();
  console.log("========================================");
  console.log("  OPCG Price Tracker - Full Scrape");
  console.log("========================================\n");

  await clearDatabase();
  const totalCards = await scrapeAllSets();
  await enrichFromOptcg();

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n========================================`);
  console.log(`  All done! ${totalCards} cards in ${elapsed} minutes`);
  console.log(`========================================`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
