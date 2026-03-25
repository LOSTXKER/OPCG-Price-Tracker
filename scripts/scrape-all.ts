import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as cheerio from "cheerio";
import { SETS } from "./sets";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL is not set");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BASE_URL = "https://yuyu-tei.jp";
const BANDAI_EN_IMG = "https://asia-en.onepiece-cardgame.com/images/cardlist/card";
const PUNK_GH = "https://raw.githubusercontent.com/buhbbl/punk-records/main/english-asia";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const DELAY_MS = 1500;

// ============================================================
// Helpers
// ============================================================

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
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

async function headCheck(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": USER_AGENT } });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json() as Promise<T>;
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

function parseCards($: cheerio.CheerioAPI, allowZeroPrice = false): ScrapedCard[] {
  const cards: ScrapedCard[] = [];
  $(".card-product").each((_, el) => {
    const $el = $(el);
    const cardCode = $el.find("span.border-dark").first().text().trim();
    if (!cardCode) return;

    const priceText = $el.find("strong.text-end").first().text().trim();
    const priceJpy = parseInt(priceText.replace(/[^0-9]/g, ""), 10);
    if (isNaN(priceJpy)) return;
    if (!allowZeroPrice && priceJpy === 0) return;

    const imgEl = $el.find(".product-img img.card").first();
    const altText = imgEl.attr("alt") || "";
    const yuyuteiImgUrl = imgEl.attr("src") || undefined;

    const altMatch = altText.match(
      /^[\w-]+\s+(P-SEC|P-SR|P-R|P-UC|P-C|P-L|P-P|SEC|SR|SP|R|UC|C|L|P)?\s*(.*)/
    );
    let rarity = altMatch?.[1] || "Unknown";
    const name = altMatch?.[2]?.trim() || $el.find("h4.text-primary").first().text().trim();

    if (rarity === "Unknown" && name.includes("ドン!!")) {
      rarity = "DON";
    }

    const isParallel = name.includes("パラレル") || rarity.startsWith("P-") || rarity === "SP";
    if (isParallel && !rarity.startsWith("P-") && rarity !== "SP" && rarity !== "Unknown" && rarity !== "DON") {
      rarity = `P-${rarity}`;
    }

    const href = $el.find("a[href*='/sell/opc/card/']").first().attr("href");
    const yuyuteiId = $el.find("input.cart_cid").val()?.toString() || href?.split("/").pop();
    const inStock = !$el.hasClass("sold-out");

    cards.push({ cardCode, name, rarity, priceJpy, inStock, yuyuteiImgUrl, yuyuteiId, cardUrl: href || undefined });
  });
  return cards;
}

function isParallelCard(card: ScrapedCard): boolean {
  return card.name.includes("パラレル") || card.rarity.startsWith("P-") || card.rarity === "SP";
}

function isDonCard(card: ScrapedCard): boolean {
  return card.rarity === "DON" || card.name.includes("ドン!!");
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
// STEP 2: Scrape all sets from Yuyu-tei (Yuyu-tei images only)
// ============================================================

async function scrapeAllSets() {
  console.log(`=== Step 2: Scraping ${SETS.length} sets from Yuyu-tei ===\n`);
  let totalCards = 0;
  const errors: string[] = [];

  for (const setInfo of SETS) {
    const url = `${BASE_URL}/sell/opc/s/${setInfo.code}`;
    process.stdout.write(`[${setInfo.code}] ${setInfo.nameEn}...`);

    try {
      const isDonSet = setInfo.code === "don";
      const $ = await fetchWithRetry(url);
      const listings = parseCards($, isDonSet);

      if (listings.length === 0) {
        console.log(` 0 cards (skipped)`);
        errors.push(`${setInfo.code}: 0 cards`);
        await sleep(DELAY_MS);
        continue;
      }

      const cardSet = await prisma.cardSet.upsert({
        where: { code: setInfo.code },
        update: { name: setInfo.nameJp, nameEn: setInfo.nameEn, type: setInfo.type },
        create: { code: setInfo.code, name: setInfo.nameJp, nameEn: setInfo.nameEn, type: setInfo.type },
      });

      let upserted = 0;
      for (const card of listings) {
        const isDon = isDonCard(card);
        const baseCode = card.cardCode.toUpperCase();
        const isParallel = isParallelCard(card);

        const compositeCode = isDon && card.yuyuteiId
          ? `${setInfo.code}-DON-${card.yuyuteiId}`
          : `${baseCode}${card.yuyuteiId ? `-${card.yuyuteiId}` : ""}`;

        // Temporary: use Yuyu-tei image; Step 3 will try to upgrade to Bandai
        const imageUrl = card.yuyuteiImgUrl
          || (card.yuyuteiId ? `https://card.yuyu-tei.jp/opc/front/${setInfo.code}/${card.yuyuteiId}.jpg` : "");

        const cardRecord = await prisma.card.upsert({
          where: { cardCode: compositeCode },
          update: {
            yuyuteiId: card.yuyuteiId, yuyuteiUrl: card.cardUrl,
            nameJp: card.name, rarity: card.rarity, imageUrl,
            isParallel, baseCode: isDon ? null : baseCode,
            latestPriceJpy: card.priceJpy,
          },
          create: {
            cardCode: compositeCode, yuyuteiId: card.yuyuteiId,
            yuyuteiUrl: card.cardUrl, setId: cardSet.id,
            nameJp: card.name, rarity: card.rarity,
            cardType: isDon ? "DON" : "CHARACTER",
            color: "Unknown", imageUrl, isParallel,
            baseCode: isDon ? null : baseCode,
            latestPriceJpy: card.priceJpy,
          },
        });

        await prisma.cardPrice.create({
          data: {
            cardId: cardRecord.id,
            source: "YUYUTEI", type: "SELL",
            priceJpy: card.priceJpy, inStock: card.inStock,
          },
        });
        upserted++;
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
  if (errors.length) console.log(`  Errors: ${errors.join(", ")}`);
  return totalCards;
}

// ============================================================
// STEP 3: Assign images (Bandai-first, Yuyu-tei fallback)
// ============================================================

type ParallelType = "REGULAR" | "SUPER" | "RED_SUPER" | "SP";

function classifyParallel(nameJp: string, rarity: string): ParallelType {
  if (rarity === "SP") return "SP";
  if (nameJp.includes("レッドスーパーパラレル")) return "RED_SUPER";
  if (nameJp.includes("スーパーパラレル") || nameJp.includes("特別パラレル")) return "SUPER";
  return "REGULAR";
}

const PARALLEL_TYPE_PRIORITY: ParallelType[] = ["REGULAR", "SUPER", "RED_SUPER", "SP"];

async function assignImages() {
  console.log("\n=== Step 3: Assigning images (Bandai-first) ===\n");

  const allCards = await prisma.card.findMany({
    select: {
      id: true, cardCode: true, baseCode: true, nameJp: true,
      rarity: true, isParallel: true, imageUrl: true,
      yuyuteiId: true, set: { select: { code: true } },
    },
  });

  // Group by baseCode (skip DON — no baseCode)
  const groups = new Map<string, typeof allCards>();
  const donCards: typeof allCards = [];

  for (const card of allCards) {
    if (!card.baseCode) {
      donCards.push(card);
      continue;
    }
    if (!groups.has(card.baseCode)) groups.set(card.baseCode, []);
    groups.get(card.baseCode)!.push(card);
  }

  console.log(`  ${groups.size} base codes to check, ${donCards.length} DON cards (keep Yuyu-tei)`);

  let bandaiBase = 0, bandaiParallel = 0, yuyuteiFallback = 0;
  let processed = 0;

  for (const [baseCode, group] of groups) {
    processed++;
    if (processed % 100 === 0) {
      process.stdout.write(`\r  Progress: ${processed}/${groups.size} (Bandai: ${bandaiBase + bandaiParallel}, Yuyu-tei: ${yuyuteiFallback})`);
    }

    const baseCards = group.filter((c) => !c.isParallel);
    const parallelCards = group.filter((c) => c.isParallel);

    // Check base Bandai image
    const baseBandaiUrl = `${BANDAI_EN_IMG}/${baseCode}.png`;
    const baseExists = await headCheck(baseBandaiUrl);

    for (const card of baseCards) {
      if (baseExists) {
        await prisma.card.update({ where: { id: card.id }, data: { imageUrl: baseBandaiUrl } });
        bandaiBase++;
      } else {
        yuyuteiFallback++;
      }
    }

    // For parallels: probe available Bandai _pN images
    if (parallelCards.length > 0) {
      const availablePIndexes: number[] = [];
      for (let p = 1; p <= 8; p++) {
        const url = `${BANDAI_EN_IMG}/${baseCode}_p${p}.png`;
        if (await headCheck(url)) {
          availablePIndexes.push(p);
        } else {
          break; // Bandai uses consecutive numbering
        }
      }

      if (availablePIndexes.length > 0) {
        // Classify and sort by type priority
        const classified = parallelCards.map((card) => ({
          card,
          type: classifyParallel(card.nameJp, card.rarity),
        }));

        // Sort: within same type, sort by rarity importance
        classified.sort((a, b) => {
          const aPri = PARALLEL_TYPE_PRIORITY.indexOf(a.type);
          const bPri = PARALLEL_TYPE_PRIORITY.indexOf(b.type);
          return aPri - bPri;
        });

        // Assign Bandai images to as many parallels as possible
        for (let i = 0; i < classified.length; i++) {
          const { card } = classified[i];
          if (i < availablePIndexes.length) {
            const pIndex = availablePIndexes[i];
            const bandaiUrl = `${BANDAI_EN_IMG}/${baseCode}_p${pIndex}.png`;
            await prisma.card.update({
              where: { id: card.id },
              data: { imageUrl: bandaiUrl, parallelIndex: pIndex },
            });
            bandaiParallel++;
          } else {
            yuyuteiFallback++;
          }
        }
      } else {
        yuyuteiFallback += parallelCards.length;
      }
    }
  }

  console.log(`\r  Done! Bandai base: ${bandaiBase}, Bandai parallel: ${bandaiParallel}, Yuyu-tei fallback: ${yuyuteiFallback}   `);
}

// ============================================================
// STEP 4: Enrich English from punk-records + DON name map
// ============================================================

interface PunkCard {
  id: string;
  name: string;
  category: string;
  colors: string[];
  cost: number | null;
  power: number | null;
  counter: number | null;
  effect: string | null;
  trigger: string | null;
  attributes: string[];
  types: string[];
}

const CATEGORY_MAP: Record<string, string> = {
  Character: "CHARACTER",
  Leader: "LEADER",
  Event: "EVENT",
  Stage: "STAGE",
};

const DON_EN_MAP: Record<string, string> = {
  "ドン!!カード(この戦争を終わらせに来た!!!)": "DON!! Card (I've Come to End This War!!!)",
  "ドン!!カード(海賊王におれはなる!!!!)": "DON!! Card (I'm Gonna Be King of the Pirates!!!!)",
  "ドン!!カード(……長い間!!!くそお世話になりました!!!)": "DON!! Card (...For So Long!!! Thank You So Much!!!)",
  "ドン!!カード(ドンッ)(ドンキホーテ・ドフラミンゴ)": "DON!! Card (DON!!) (Donquixote Doflamingo)",
  "ドン!!カード(だからおれは!!!黄金の鐘を鳴らすんだ!!!)": "DON!! Card (That's Why I!!! Will Ring the Golden Bell!!!)",
  "ドン!!カード(世界最強の剣士\"鷹の目のミホーク\")": 'DON!! Card (World\'s Strongest Swordsman "Hawk Eyes Mihawk")',
  "ドン!!カード(会ってみてェもんだ!!!)": "DON!! Card (I Wanna Meet Him!!!)",
  "ドン!!カード(ゾロ十郎と!!!サン五郎だァ～～)": "DON!! Card (Zorojuro and!!! Sangoro~~)",
  "ドン!!カード(海賊\"王下七武海\")": 'DON!! Card (Pirates "Royal Shichibukai")',
  "ドン!!カード(おれの愛する息子は無事なんだろうな……!!!!)": "DON!! Card (My Beloved Son Is Safe, Right...!!!!)",
  "ドン!!カード(そんなに怖いか？「新時代」が!!!)": 'DON!! Card (Are You That Scared? Of the "New Era"!!!)',
  "ドン!!カード(おれは信じられてる!!!)": "DON!! Card (I Am Believed In!!!)",
  "ドン!!カード(弟子の船出だよしなに頼むよ…)": "DON!! Card (My Pupil Sets Sail, Please Take Care of Him...)",
  "ドン!!カード(EGG HEAD)": "DON!! Card (EGG HEAD)",
  "ドン!!カード(黒文字白背景/ホロあり)": "DON!! Card (Black Text White BG / Holo)",
  "ドン!!カード(黒文字白背景/ONE PIECE FILM RED裏面)": "DON!! Card (Black Text / ONE PIECE FILM RED Back)",
  "ドン!!カード(ルフィVSカイドウ)": "DON!! Card (Luffy VS Kaido)",
  "ドン!!カード(ポートガス・D・エース)": "DON!! Card (Portgas D. Ace)",
  "ドン!!カード(ネフェルタリ・ビビ)": "DON!! Card (Nefeltari Vivi)",
  "ドン!!カード(クロコダイル)": "DON!! Card (Crocodile)",
  "ドン!!カード(ドンキホーテ・ドフラミンゴ)": "DON!! Card (Donquixote Doflamingo)",
  "ドン!!カード(エネル)": "DON!! Card (Enel)",
  "ドン!!カード(ホーディ・ジョーンズ)": "DON!! Card (Hody Jones)",
  "ドン!!カード(アイスバーグ)": "DON!! Card (Iceburg)",
  "ドン!!カード(エンポリオ・イワンコフ)": "DON!! Card (Emporio Ivankov)",
  "ドン!!カード(カイドウ)": "DON!! Card (Kaido)",
  "ドン!!カード(シャーロット・カタクリ)": "DON!! Card (Charlotte Katakuri)",
  "ドン!!カード(ユースタス・キッド)": "DON!! Card (Eustass Kid)",
  "ドン!!カード(キング)": "DON!! Card (King)",
  "ドン!!カード(トラファルガー・ロー)": "DON!! Card (Trafalgar Law)",
  "ドン!!カード(シャーロット・リンリン)": "DON!! Card (Charlotte Linlin)",
  "ドン!!カード(ロブ・ルッチ)": "DON!! Card (Rob Lucci)",
  "ドン!!カード(モンキー・D・ルフィ)": "DON!! Card (Monkey D. Luffy)",
  "ドン!!カード(マゼラン)": "DON!! Card (Magellan)",
  "ドン!!カード(ゲッコー・モリア)": "DON!! Card (Gecko Moria)",
  "ドン!!カード(光月おでん)": "DON!! Card (Kozuki Oden)",
  "ドン!!カード(ペローナ)": "DON!! Card (Perona)",
  "ドン!!カード(クイーン)": "DON!! Card (Queen)",
  "ドン!!カード(レベッカ)": "DON!! Card (Rebecca)",
  "ドン!!カード(ヴィンスモーク・レイジュ)": "DON!! Card (Vinsmoke Reiju)",
  "ドン!!カード(ドンキホーテ・ロシナンテ)": "DON!! Card (Donquixote Rosinante)",
  "ドン!!カード(サボ)": "DON!! Card (Sabo)",
  "ドン!!カード(サカズキ)": "DON!! Card (Sakazuki)",
  "ドン!!カード(エドワード・ニューゲート)": "DON!! Card (Edward Newgate)",
  "ドン!!カード(ウタ)": "DON!! Card (Uta)",
  "ドン!!カード(ヤマト)": "DON!! Card (Yamato)",
  "ドン!!カード(ロロノア・ゾロ)": "DON!! Card (Roronoa Zoro)",
  "ドン!!カード(ナミ)": "DON!! Card (Nami)",
  "ドン!!カード(ニコ・ロビン)": "DON!! Card (Nico Robin)",
  "ドン!!カード(ボア・ハンコック)": "DON!! Card (Boa Hancock)",
  "ドン!!カード(サンジ)": "DON!! Card (Sanji)",
  "ドン!!カード(シルバーズ・レイリー)": "DON!! Card (Silvers Rayleigh)",
  "ドン!!カード(S-スネーク)": "DON!! Card (S-Snake)",
  "ドン!!カード(ジュエリー・ボニー)": "DON!! Card (Jewelry Bonney)",
  "ドン!!カード(コビー)": "DON!! Card (Coby)",
  "ドン!!カード(しらほし)": "DON!! Card (Shirahoshi)",
  "ドン!!カード(ベポ)": "DON!! Card (Bepo)",
};

function getDonEnglishName(nameJp: string): string | null {
  const baseName = nameJp
    .replace(/^-\s*/, "")
    .replace(/\(パラレル\)/g, "")
    .replace(/\(スーパーパラレル\)/g, "")
    .trim();
  let en = DON_EN_MAP[baseName];
  if (!en) {
    // Generic fallback: "DON!! Card" for unmatched
    if (baseName.startsWith("ドン!!カード")) {
      en = "DON!! Card";
    } else {
      return null;
    }
  }
  if (nameJp.includes("スーパーパラレル")) return en + " (Parallel)(Super Parallel)";
  if (nameJp.includes("パラレル")) return en + " (Parallel)";
  return en;
}

const OPCG_CODE_RE = /^((?:OP|ST|EB|PRB|P)\d+-\d+)/i;

function extractOpcgCode(cardCode: string, yuyuteiId: string | null): string | null {
  let base = cardCode;
  if (yuyuteiId && base.endsWith(`-${yuyuteiId}`)) {
    base = base.slice(0, -(yuyuteiId.length + 1));
  }
  const m = base.match(OPCG_CODE_RE);
  return m ? m[1].toUpperCase() : null;
}

async function enrichEnglish() {
  console.log("\n=== Step 4: Enriching English from punk-records ===\n");

  // 4a. Fetch punk-records
  console.log("  Fetching packs index...");
  const packs = await fetchJson<Record<string, { id: string }>>(
    `${PUNK_GH}/packs.json`
  );
  const packIds = Object.keys(packs);
  console.log(`  Found ${packIds.length} packs.`);

  console.log("  Downloading card data...");
  const punkMap = new Map<string, PunkCard>();

  for (const packId of packIds) {
    try {
      const cards = await fetchJson<PunkCard[]>(`${PUNK_GH}/data/${packId}.json`);
      for (const card of cards) {
        const baseCode = card.id.replace(/_p\d+$/, "").toUpperCase();
        if (!punkMap.has(baseCode)) punkMap.set(baseCode, card);
      }
    } catch {
      // skip unavailable packs
    }
  }
  console.log(`  Loaded ${punkMap.size} unique cards from punk-records.\n`);

  // 4b. Update all DB cards
  const dbCards = await prisma.card.findMany({
    select: { id: true, cardCode: true, yuyuteiId: true, nameJp: true, cardType: true, color: true, rarity: true },
    orderBy: { cardCode: "asc" },
  });

  let updated = 0, donUpdated = 0, noMatch = 0;

  for (let i = 0; i < dbCards.length; i++) {
    const card = dbCards[i];

    // DON cards: use hardcoded map
    if (card.rarity === "DON") {
      const donEn = getDonEnglishName(card.nameJp);
      if (donEn) {
        await prisma.card.update({ where: { id: card.id }, data: { nameEn: donEn } });
        donUpdated++;
      }
      continue;
    }

    const opcgCode = extractOpcgCode(card.cardCode, card.yuyuteiId);
    if (!opcgCode) { noMatch++; continue; }

    const punk = punkMap.get(opcgCode);
    if (!punk) { noMatch++; continue; }

    const isLeader = punk.category === "Leader";
    const cardType = CATEGORY_MAP[punk.category] ?? card.cardType;
    const colorStr = punk.colors.join("/") || undefined;

    const data: Record<string, unknown> = {
      nameEn: punk.name,
      effectEn: punk.effect || null,
      triggerJp: punk.trigger || null,
      attribute: punk.attributes.length > 0 ? punk.attributes.join(" / ") : null,
      trait: punk.types.length > 0 ? punk.types.join(" / ") : null,
      colorEn: colorStr,
    };

    if (cardType && cardType !== card.cardType) data.cardType = cardType;
    if (colorStr && card.color === "Unknown") data.color = colorStr;

    if (isLeader) {
      if (punk.cost != null) data.life = punk.cost;
      if (punk.power != null) data.power = punk.power;
    } else {
      if (punk.cost != null) data.cost = punk.cost;
      if (punk.power != null) data.power = punk.power;
      if (punk.counter != null) data.counter = punk.counter;
    }

    await prisma.card.update({ where: { id: card.id }, data });
    updated++;

    if ((i + 1) % 200 === 0) {
      process.stdout.write(`\r  Progress: ${i + 1}/${dbCards.length} | Updated: ${updated} | DON: ${donUpdated} | No match: ${noMatch}`);
    }
  }

  console.log(`\r  Done! Updated: ${updated} | DON names: ${donUpdated} | No match: ${noMatch}                `);
}

// ============================================================
// STEP 5: Verify
// ============================================================

async function verify() {
  console.log("\n=== Step 5: Verification ===\n");

  const totalCards = await prisma.card.count();
  const totalSets = await prisma.cardSet.count();
  const withNameEn = await prisma.card.count({ where: { nameEn: { not: null } } });
  const withBandaiImg = await prisma.card.count({ where: { imageUrl: { contains: "onepiece-cardgame.com" } } });
  const withYuyuImg = await prisma.card.count({ where: { imageUrl: { contains: "yuyu-tei" } } });
  const donCards = await prisma.card.count({ where: { rarity: "DON" } });

  const sets = await prisma.cardSet.findMany({
    select: { code: true, nameEn: true, cardCount: true },
    orderBy: { code: "asc" },
  });

  console.log(`  Total cards: ${totalCards}`);
  console.log(`  Total sets: ${totalSets}`);
  console.log(`  With English name: ${withNameEn} (${((withNameEn / totalCards) * 100).toFixed(1)}%)`);
  console.log(`  Bandai images: ${withBandaiImg}`);
  console.log(`  Yuyu-tei images: ${withYuyuImg}`);
  console.log(`  DON cards: ${donCards}`);
  console.log(`\n  Per-set breakdown:`);
  for (const s of sets) {
    console.log(`    ${s.code.padEnd(8)} ${(s.nameEn || "").padEnd(40)} ${s.cardCount} cards`);
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  const startTime = Date.now();
  console.log("========================================");
  console.log("  OPCG Price Tracker - Full Rebuild");
  console.log("========================================\n");

  await clearDatabase();
  await scrapeAllSets();
  await assignImages();
  await enrichEnglish();
  await verify();

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n========================================`);
  console.log(`  All done in ${elapsed} minutes!`);
  console.log(`========================================`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
