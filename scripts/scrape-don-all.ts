import "dotenv/config";
import * as cheerio from "cheerio";
import pg from "pg";

const cs = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!cs) throw new Error("DATABASE_URL is not set");
const pool = new pg.Pool({
  connectionString: cs + (cs.includes("?") ? "&" : "?") + "pgbouncer=true",
  max: 2,
});

const BASE_URL = "https://yuyu-tei.jp";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string): Promise<cheerio.CheerioAPI> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
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
  isParallel: boolean;
}

function parseCardsFromPage($: cheerio.CheerioAPI, allowZeroPrice = false): ScrapedCard[] {
  const cards: ScrapedCard[] = [];
  $(".card-product").each((_, el) => {
    const $el = $(el);
    let cardCode = $el.find("span.border-dark").first().text().trim();

    const imgEl = $el.find(".product-img img.card").first();
    const altText = imgEl.attr("alt") || "";
    const yuyuteiImgUrl = imgEl.attr("src") || undefined;

    const priceText = $el.find("strong.text-end").first().text().trim();
    const priceJpy = parseInt(priceText.replace(/[^0-9]/g, ""), 10) || 0;
    if (!allowZeroPrice && priceJpy === 0) return;

    // For DON cards on the /don page, cardCode might be "- -" or empty
    if (!cardCode) cardCode = "- -";

    const altMatch = altText.match(
      /^([\w-]+)\s+(P-SEC|P-SR|P-R|P-UC|P-C|P-L|P-P|SEC|SR|SP|R|UC|C|L|P)?\s*(.*)/
    );
    let rarity = altMatch?.[2] || "Unknown";
    const name = altMatch?.[3]?.trim() || $el.find("h4.text-primary").first().text().trim() || altText.replace(/^- - /, "").trim();

    if ((rarity === "Unknown" || !rarity) && name.includes("ドン!!")) {
      rarity = "DON";
    }

    const isParallel = name.includes("パラレル") || rarity.startsWith("P-") || rarity === "SP";
    if (isParallel && !rarity.startsWith("P-") && rarity !== "SP" && rarity !== "Unknown" && rarity !== "DON") {
      rarity = `P-${rarity}`;
    }

    const href = $el.find("a[href*='/sell/opc/card/']").first().attr("href");
    const yuyuteiId =
      $el.find("input.cart_cid").val()?.toString() || href?.split("/").pop() ||
      yuyuteiImgUrl?.match(/\/(\d+)\.(jpg|png)/)?.[1];

    const inStock = !$el.hasClass("sold-out");

    cards.push({
      cardCode, name, rarity, priceJpy, inStock, yuyuteiImgUrl, yuyuteiId, isParallel,
    });
  });
  return cards;
}

function donImageUrl(setCode: string, yuyuteiId: string): string {
  return `https://card.yuyu-tei.jp/opc/front/${setCode}/${yuyuteiId}.jpg`;
}

async function getOrCreateSet(code: string, name: string, type: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT id FROM "CardSet" WHERE code = $1`, [code]
  );
  if (rows.length > 0) return rows[0].id;

  const { rows: ins } = await pool.query(
    `INSERT INTO "CardSet" (code, name, type, "createdAt", "updatedAt")
     VALUES ($1, $2, $3::"SetType", NOW(), NOW())
     RETURNING id`,
    [code, name, type]
  );
  return ins[0].id;
}

async function upsertCard(card: {
  cardCode: string;
  setCode: string;
  yuyuteiId?: string;
  yuyuteiUrl?: string;
  setId: number;
  nameJp: string;
  nameEn?: string;
  rarity: string;
  imageUrl?: string;
  isParallel: boolean;
  baseCode?: string;
  parallelIndex?: number;
  latestPriceJpy?: number;
}): Promise<void> {
  // DON cards use set-specific codes to avoid cross-set collisions
  const isDon = card.rarity === "DON" || card.nameJp.includes("ドン!!");
  const compositeCode = isDon && card.yuyuteiId
    ? `${card.setCode}-DON-${card.yuyuteiId}`
    : `${card.cardCode}${card.yuyuteiId ? `-${card.yuyuteiId}` : ""}`;

  const { rows: existing } = await pool.query(
    `SELECT id FROM "Card" WHERE "cardCode" = $1`, [compositeCode]
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE "Card" SET
        "yuyuteiId" = COALESCE($1, "yuyuteiId"),
        "nameJp" = $2,
        "nameEn" = COALESCE($3, "nameEn"),
        rarity = $4,
        "imageUrl" = COALESCE($5, "imageUrl"),
        "isParallel" = $6,
        "baseCode" = COALESCE($7, "baseCode"),
        "latestPriceJpy" = CASE WHEN $8::int > 0 THEN $8::int ELSE "latestPriceJpy" END,
        "updatedAt" = NOW()
       WHERE id = $9`,
      [
        card.yuyuteiId || null, card.nameJp, card.nameEn || null, card.rarity,
        card.imageUrl || null, card.isParallel, card.baseCode || null,
        card.latestPriceJpy || 0, existing[0].id,
      ]
    );
  } else {
    await pool.query(
      `INSERT INTO "Card" (
        "cardCode", "yuyuteiId", "setId", "nameJp", "nameEn", rarity, "cardType",
        color, "imageUrl", "isParallel", "baseCode", "parallelIndex",
        "latestPriceJpy", "createdAt", "updatedAt"
       ) VALUES ($1,$2::text,$3::int,$4::text,$5::text,$6::text,'DON'::"CardType",'Unknown'::text,$7::text,$8::bool,$9::text,$10::int,$11::int,NOW(),NOW())`,
      [
        compositeCode, card.yuyuteiId || null, card.setId, card.nameJp, card.nameEn || null,
        card.rarity, card.imageUrl || null, card.isParallel, card.baseCode || "-",
        card.parallelIndex || null, card.latestPriceJpy || null,
      ]
    );
  }
}

// EN name map for DON promo cards
const DON_PROMO_EN: Record<string, string> = {
  "ドン!!カード(黒文字白背景/白背景裏面)": "DON!! Card (Standard)",
  "ドン!!カード(箔押し)(金文字白背景/白背景裏面)": "DON!! Card (Gold Embossed)",
  "ドン!!カード(赤文字黒背景/白背景裏面)": "DON!! Card (Red/Black)",
  "ドン!!カード(ルフィモチーフ)": "DON!! Card (Luffy Motif)",
  "ドン!!カード(ゾロモチーフ)": "DON!! Card (Zoro Motif)",
  "ドン!!カード(ウソップモチーフ)": "DON!! Card (Usopp Motif)",
  "ドン!!カード(ナミモチーフ)": "DON!! Card (Nami Motif)",
  "ドン!!カード(サンジモチーフ)": "DON!! Card (Sanji Motif)",
  "ドン!!カード(チョッパーモチーフ)": "DON!! Card (Chopper Motif)",
  "ドン!!カード(ロビンモチーフ)": "DON!! Card (Robin Motif)",
  "ドン!!カード(フランキーモチーフ)": "DON!! Card (Franky Motif)",
  "ドン!!カード(ブルックモチーフ)": "DON!! Card (Brook Motif)",
  "ドン!!カード(ジンベエモチーフ)": "DON!! Card (Jinbe Motif)",
  'ドン!!カード("海賊王"になる男だ!!!)': 'DON!! Card ("The Man Who Will Become Pirate King"!!!)',
  "ドン!!カード(ドンドットットドンドットット)": "DON!! Card (DonDotttoDonDottto)",
  "ドン!!カード(ヤマト!!!キミの為に死ねる!!!)": "DON!! Card (Yamato!!! I Can Die For You!!!)",
  "ドン!!カード(モンキー・Dガープ＆モンキー・D・ルフィ(10年前))": "DON!! Card (Monkey D. Garp & Monkey D. Luffy (10 Years Ago))",
  "ドン!!カード(ONE PIECE DAY'24)": "DON!! Card (ONE PIECE DAY '24)",
  'ドン!!カード(……"黄金郷"は…そこにあったのか……？ありがとうよ……!!!)': 'DON!! Card (...The "City of Gold"... was right there...? Thank you...!!!)',
  "ドン!!カード(そうよわらわが美しいから!!!)": "DON!! Card (Because I Am Beautiful!!!)",
  "ドン!!カード(その勝負!!!受けて立つ!!!)": "DON!! Card (That Challenge!!! I Accept!!!)",
  "ドン!!カード(お前を越える為…!!!)": "DON!! Card (To Surpass You...!!!)",
  "ドン!!カード(愛してるぜ!!)": "DON!! Card (I Love You!!)",
  "ドン!!カード(お前が……!!!どれ程のモンだってんだよ……!!!)": 'DON!! Card (Just What Kind Of Man... Are You...!!!)',
  "ドン!!カード(3rd ANNIVERSARY SET)": "DON!! Card (3rd Anniversary Set)",
};

// Character EN name map for PRB02 DON cards
const PRB_CHAR_EN: Record<string, string> = {
  "ウソップ": "Usopp", "カルガラ": "Calgara", "キャロット": "Carrot",
  "キュロス": "Kyros", "コビー": "Coby", "サンジ": "Sanji",
  "シーザー": "Caesar", "シャーロット・プリン": "Charlotte Pudding",
  "シャンクス": "Shanks", "ジュエリー・ボニー": "Jewelry Bonney",
  "シュガー": "Sugar", "しらほし": "Shirahoshi", "ジンベエ": "Jinbe",
  "スモーカー": "Smoker", "トニートニー・チョッパー": "Tony Tony Chopper",
  "ナミ": "Nami", "ニコ・ロビン": "Nico Robin", "バギー": "Buggy",
  "ハンニャバル": "Hannyabal", "フォクシー": "Foxy",
  "ベガパンク": "Vegapunk", "ボア・ハンコック": "Boa Hancock",
  "マーシャル・D・ティーチ": "Marshall D. Teach", "マルコ": "Marco",
  "モンキー・D・ドラゴン": "Monkey D. Dragon",
  "モンキー・D・ルフィ ギア4": "Monkey D. Luffy Gear 4",
  "モンキー・D・ルフィ ギア5": "Monkey D. Luffy Gear 5",
  "ヤマト": "Yamato", "リム": "Lim", "ロブ・ルッチ": "Rob Lucci",
};

function cleanDonName(raw: string): string {
  return raw.replace(/^-\s*/, "").trim();
}

function donEnName(jpName: string): string | undefined {
  const cleaned = cleanDonName(jpName);

  // Check promo map first
  if (DON_PROMO_EN[cleaned]) return DON_PROMO_EN[cleaned];

  // For PRB character DON cards: extract character name from base (no parallel suffix)
  const baseName = cleaned
    .replace(/\(パラレル\)/g, "")
    .replace(/\(スーパーパラレル\)/g, "")
    .trim();

  const charMatch = baseName.match(/ドン!!カード\(([^)]+)\)/);
  if (!charMatch) return undefined;

  const charJp = charMatch[1];
  const charEn = PRB_CHAR_EN[charJp];
  if (!charEn) return undefined;

  if (cleaned.includes("スーパーパラレル")) {
    return `DON!! Card (${charEn}) (Parallel)(Super Parallel)`;
  }
  if (cleaned.includes("パラレル")) {
    return `DON!! Card (${charEn}) (Parallel)`;
  }
  return `DON!! Card (${charEn})`;
}

// ==============================================
// PART 1: Scrape /don promo page
// ==============================================
async function scrapeDonPromoPage(): Promise<number> {
  console.log("\n=== PART 1: Scraping /don promo page ===\n");

  const setId = await getOrCreateSet("don", "DON!! Card Collection", "PROMO");
  console.log(`  Set "don" id=${setId}`);

  const url = `${BASE_URL}/sell/opc/s/don`;
  const $ = await fetchPage(url);
  const cards = parseCardsFromPage($, true);

  console.log(`  Found ${cards.length} DON promo cards on page`);
  let upserted = 0;

  for (const card of cards) {
    if (!card.yuyuteiId) continue;

    const imgUrl = donImageUrl("don", card.yuyuteiId);
    const en = donEnName(card.name);

    await upsertCard({
      cardCode: card.cardCode,
      setCode: "don",
      yuyuteiId: card.yuyuteiId,
      setId,
      nameJp: card.name,
      nameEn: en,
      rarity: "DON",
      imageUrl: imgUrl,
      isParallel: card.isParallel,
      baseCode: "-",
      latestPriceJpy: card.priceJpy,
    });

    console.log(`  ✓ ${card.name} | ${en || "no EN"} | ¥${card.priceJpy}`);
    upserted++;
  }

  // Update set card count
  await pool.query(
    `UPDATE "CardSet" SET "cardCount" = $1, "updatedAt" = NOW() WHERE id = $2`,
    [upserted, setId]
  );

  // Also set English name for the set
  await pool.query(
    `UPDATE "CardSet" SET "nameEn" = 'DON!! Card Collection' WHERE id = $1`,
    [setId]
  );

  console.log(`\n  Total: ${upserted} DON promo cards upserted`);
  return upserted;
}

// ==============================================
// PART 2: Scrape PRB02
// ==============================================
async function scrapePrb02(): Promise<number> {
  console.log("\n=== PART 2: Scraping PRB02 ===\n");

  const setId = await getOrCreateSet("prb02", "プレミアムブースター THE BEST VOL.2", "PROMO");
  await pool.query(
    `UPDATE "CardSet" SET "nameEn" = 'Premium Booster 02' WHERE id = $1`,
    [setId]
  );
  console.log(`  Set "prb02" id=${setId}`);

  const url = `${BASE_URL}/sell/opc/s/prb02`;
  const $ = await fetchPage(url);
  const cards = parseCardsFromPage($, true);

  console.log(`  Found ${cards.length} cards on PRB02 page`);
  let upserted = 0;

  for (const card of cards) {
    if (!card.yuyuteiId) continue;

    const imgUrl = donImageUrl("prb02", card.yuyuteiId);
    const en = donEnName(card.name);

    await upsertCard({
      cardCode: card.cardCode,
      setCode: "prb02",
      yuyuteiId: card.yuyuteiId,
      setId,
      nameJp: card.name,
      nameEn: en,
      rarity: card.rarity,
      imageUrl: imgUrl,
      isParallel: card.isParallel,
      baseCode: "-",
      latestPriceJpy: card.priceJpy,
    });

    console.log(`  ✓ ${card.name.substring(0, 50)} | ¥${card.priceJpy}`);
    upserted++;
  }

  await pool.query(
    `UPDATE "CardSet" SET "cardCount" = $1, "updatedAt" = NOW() WHERE id = $2`,
    [upserted, setId]
  );

  console.log(`\n  Total: ${upserted} PRB02 cards upserted`);
  return upserted;
}

// ==============================================
// PART 3: Fill missing DON from existing sets
// ==============================================
async function fillMissingDon(): Promise<number> {
  console.log("\n=== PART 3: Filling missing DON cards from existing OP/EB sets ===\n");

  const setsToCheck = [
    "op01", "op02", "op03", "op04", "op05", "op06", "op07", "op08",
    "op09", "op10", "op11", "op12", "op13", "op14", "op15",
    "eb01", "eb02", "eb03", "eb04",
  ];

  let totalAdded = 0;

  for (const setCode of setsToCheck) {
    const url = `${BASE_URL}/sell/opc/s/${setCode}`;

    let $: cheerio.CheerioAPI;
    try {
      $ = await fetchPage(url);
    } catch {
      console.log(`  [${setCode}] Failed to fetch, skipping`);
      await sleep(DELAY_MS);
      continue;
    }

    const allCards = parseCardsFromPage($, true);
    const donCards = allCards.filter((c) => c.name.includes("ドン!!"));

    if (donCards.length === 0) {
      await sleep(DELAY_MS);
      continue;
    }

    // Get set ID
    const { rows: setRows } = await pool.query(
      `SELECT id FROM "CardSet" WHERE code = $1`, [setCode]
    );
    if (setRows.length === 0) {
      await sleep(DELAY_MS);
      continue;
    }
    const setId = setRows[0].id;

    // Check which DON cards from this set we already have
    const { rows: existingDon } = await pool.query(
      `SELECT "yuyuteiId" FROM "Card" WHERE "setId" = $1 AND rarity = 'DON'`, [setId]
    );
    const existingIds = new Set(existingDon.map((r: { yuyuteiId: string }) => r.yuyuteiId));

    let added = 0;
    for (const card of donCards) {
      if (!card.yuyuteiId || existingIds.has(card.yuyuteiId)) continue;

      // Check if this yuyuteiId already exists in another set (to avoid cross-listing duplication)
      const { rows: crossCheck } = await pool.query(
        `SELECT id, "cardCode" FROM "Card" WHERE "yuyuteiId" = $1 AND rarity = 'DON'`, [card.yuyuteiId]
      );
      if (crossCheck.length > 0) {
        // Already exists in another set - skip to avoid duplication
        continue;
      }

      const imgUrl = donImageUrl(setCode, card.yuyuteiId);
      const en = donEnName(card.name);

      await upsertCard({
        cardCode: card.cardCode,
        setCode: setCode,
        yuyuteiId: card.yuyuteiId,
        setId,
        nameJp: card.name,
        nameEn: en,
        rarity: "DON",
        imageUrl: imgUrl,
        isParallel: card.isParallel,
        baseCode: "-",
        latestPriceJpy: card.priceJpy,
      });

      console.log(`  [${setCode}] ✓ Added: ${card.name} | ¥${card.priceJpy}`);
      added++;
    }

    if (added > 0) {
      totalAdded += added;
      // Update set card count
      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*)::int as cnt FROM "Card" WHERE "setId" = $1`, [setId]
      );
      await pool.query(
        `UPDATE "CardSet" SET "cardCount" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [countRows[0].cnt, setId]
      );
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n  Total: ${totalAdded} missing DON cards added`);
  return totalAdded;
}

// ==============================================
// PART 4: Also fix EN names for existing DON cards that still have JP-only names
// ==============================================
async function fixExistingDonNames(): Promise<number> {
  console.log("\n=== PART 4: Fixing EN names for existing DON cards ===\n");

  const EN_MAP: Record<string, string> = {
    // Common OP set DON cards
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
    // PRB01 characters
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
  };

  const { rows: donCards } = await pool.query(
    `SELECT id, "nameJp", "nameEn" FROM "Card" WHERE rarity = 'DON'`
  );

  let fixed = 0;
  for (const card of donCards) {
    // Only fix if nameEn is missing or still has JP characters
    if (card.nameEn && !card.nameEn.includes("ドン") && !card.nameEn.includes("おれ") && !card.nameEn.includes("戦争")) continue;

    // Base name (without parallel suffixes)
    const baseName = card.nameJp
      .replace(/\(パラレル\)/g, "")
      .replace(/\(スーパーパラレル\)/g, "")
      .trim();

    let en = EN_MAP[baseName];
    if (!en) continue;

    // Re-add parallel suffix if applicable
    if (card.nameJp.includes("スーパーパラレル")) {
      en += " (Parallel)(Super Parallel)";
    } else if (card.nameJp.includes("パラレル")) {
      en += " (Parallel)";
    }

    await pool.query(
      `UPDATE "Card" SET "nameEn" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [en, card.id]
    );
    fixed++;
  }

  console.log(`  Fixed ${fixed} DON card EN names`);
  return fixed;
}

// ==============================================
// Main
// ==============================================
async function main() {
  console.log("=== DON Card Comprehensive Scrape ===\n");
  const start = Date.now();

  const promoDon = await scrapeDonPromoPage();
  await sleep(DELAY_MS);

  const prb02Don = await scrapePrb02();
  await sleep(DELAY_MS);

  const missingDon = await fillMissingDon();

  const fixedNames = await fixExistingDonNames();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n========================================`);
  console.log(`Done in ${elapsed}s!`);
  console.log(`  Promo DON: ${promoDon}`);
  console.log(`  PRB02: ${prb02Don}`);
  console.log(`  Missing DON from sets: ${missingDon}`);
  console.log(`  Fixed EN names: ${fixedNames}`);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  pool.end();
  process.exit(1);
});
