/**
 * Fetch card data directly from the Official Bandai One Piece Card Game sites.
 *
 * Scrapes 3 regional sites and merges:
 *   - asia-en.onepiece-cardgame.com (English + Asia)
 *   - onepiece-cardgame.com          (Japanese)
 *   - asia-th.onepiece-cardgame.com  (Thai)
 *
 * Includes SP reprint cards that belong to the set (e.g. OP05-067 SP in OP09).
 *
 * Outputs data/cards/{setCode}.json in the OfficialCard format
 * that seed-cards.ts expects.
 *
 * Usage:
 *   npx tsx scripts/scrape-official.ts              # all sets
 *   npx tsx scripts/scrape-official.ts op09 op13     # specific sets
 */
import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";
import { SETS } from "./sets";

const DATA_DIR = path.resolve(__dirname, "..", "data", "cards");

// ── Regional site config ──

interface SiteConfig {
  base: string;
  prefix: string;
}

const SITES = {
  en: { base: "https://asia-en.onepiece-cardgame.com", prefix: "556" } as SiteConfig,
  jp: { base: "https://onepiece-cardgame.com", prefix: "550" } as SiteConfig,
  th: { base: "https://asia-th.onepiece-cardgame.com", prefix: "563" } as SiteConfig,
};

// Official site series IDs: {3-digit regional prefix}{type digit}{2-digit number}
// e.g. EN OP09 = 556 + 1 + 09 = 556109
function seriesId(site: SiteConfig, setCode: string): string {
  const m = setCode.match(/^(op|eb|st|prb)(\d+)$/i);
  if (!m) return "";
  const prefix = m[1].toLowerCase();
  const num = m[2].padStart(2, "0");
  const typeDigit =
    prefix === "op" ? "1" :
    prefix === "eb" ? "2" :
    prefix === "st" ? "0" :
    prefix === "prb" ? "3" : "1";
  return `${site.prefix}${typeDigit}${num}`;
}

// ── OfficialCard: same interface seed-cards.ts expects ──

export interface OfficialCard {
  code: string;
  cardCode: string;
  rarity: string;
  cardType: string;
  nameEn: string;
  nameJp: string;
  nameTh?: string;
  color: string;
  cost?: number;
  power?: number;
  counter?: number;
  life?: number;
  attribute?: string;
  trait: string;
  effectEn?: string;
  effectJp?: string;
  effectTh?: string;
  triggerEn?: string;
  triggerJp?: string;
  imageUrl: string;
  isParallel: boolean;
  parallelIndex?: number;
  sets: string[];
}

// ── Rarity normalization ──

const RARITY_MAP: Record<string, string> = {
  "L": "L",
  "C": "C",
  "UC": "UC",
  "R": "R",
  "SR": "SR",
  "SEC": "SEC",
  "SP CARD": "SP",
  "SPカード": "SP",
  "SP": "SP",
  "TR": "TR",
  "P": "P",
  "PROMO": "P",
};

function mapRarity(raw: string, isParallel: boolean): string {
  const upper = raw.toUpperCase().trim();
  const base = RARITY_MAP[upper] ?? upper;
  if (!isParallel) return base;
  if (["SP", "TR"].includes(base)) return base;
  return `P-${base}`;
}

// ── Card type normalization ──

const CARD_TYPE_MAP: Record<string, string> = {
  LEADER: "LEADER",
  CHARACTER: "CHARACTER",
  EVENT: "EVENT",
  STAGE: "STAGE",
  リーダー: "LEADER",
  キャラ: "CHARACTER",
  キャラクター: "CHARACTER",
  イベント: "EVENT",
  ステージ: "STAGE",
};

// ── HTML parsing ──

interface RawCard {
  id: string;
  code: string;
  rarity: string;
  cardType: string;
  name: string;
  color: string;
  cost?: number;
  power?: number;
  counter?: number;
  life?: number;
  attribute?: string;
  trait: string;
  effect?: string;
  trigger?: string;
  imageUrl: string;
  sets: string[];
}

function escapeSelector(id: string): string {
  return id.replace(/([.[\]])/g, "\\$1");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanText($el: cheerio.Cheerio<any>): string {
  const clone = $el.clone();
  clone.find("h3").remove();
  return clone.text().trim();
}

function parseCardsFromHtml(
  $: cheerio.CheerioAPI,
  siteBase: string
): RawCard[] {
  const cards: RawCard[] = [];

  $(".modalCol").each((_, el) => {
    const id = $(el).attr("id");
    if (!id) return;

    const modal = $(`#${escapeSelector(id)}`);
    const infoSpans = modal.find(".infoCol span");
    const code = infoSpans.eq(0).text().trim();
    const rawRarity = infoSpans.eq(1).text().trim();
    const rawCardType = infoSpans.eq(2).text().trim();
    const name = modal.find(".cardName").text().trim();

    const imgSrc = modal.find(".frontCol img").attr("data-src") || "";
    const imageUrl = imgSrc.startsWith("..")
      ? `${siteBase}${imgSrc.slice(2).split("?")[0]}`
      : imgSrc.startsWith("/")
        ? `${siteBase}${imgSrc.split("?")[0]}`
        : imgSrc.split("?")[0];

    const backCol = modal.find(".backCol");
    const color = cleanText(backCol.find(".color"));
    const attribute = backCol.find(".attribute i").text().trim() || undefined;
    const trait = cleanText(backCol.find(".feature"));

    const cardType = CARD_TYPE_MAP[rawCardType.toUpperCase()] ?? CARD_TYPE_MAP[rawCardType] ?? "CHARACTER";
    const isLeader = cardType === "LEADER";

    const costOrLifeText = cleanText(backCol.find(".cost"));
    const costOrLife = parseInt(costOrLifeText, 10);
    const life = isLeader && !isNaN(costOrLife) ? costOrLife : undefined;
    const cost = !isLeader && !isNaN(costOrLife) ? costOrLife : undefined;

    const powerText = cleanText(backCol.find(".power"));
    const power = parseInt(powerText, 10) || undefined;

    const counterText = cleanText(backCol.find(".counter"));
    const counter = parseInt(counterText, 10) || undefined;

    const textDivs = backCol.find(".text");
    let effect: string | undefined;
    let trigger: string | undefined;

    textDivs.each((_, textEl) => {
      const heading = $(textEl).find("h3").text().trim().toLowerCase();
      const content = cleanText($(textEl));
      if (heading.includes("trigger") || heading.includes("トリガー")) {
        trigger = content;
      } else if (content) {
        effect = content;
      }
    });

    const sets: string[] = [];
    backCol.find(".getInfo a").each((_, a) => { sets.push($(a).text().trim()); });
    if (sets.length === 0) {
      const raw = cleanText(backCol.find(".getInfo"));
      if (raw) sets.push(raw);
    }

    cards.push({
      id,
      code,
      rarity: rawRarity,
      cardType,
      name,
      color,
      cost,
      power,
      counter,
      life,
      attribute,
      trait,
      effect,
      trigger,
      imageUrl,
      sets,
    });
  });

  return cards;
}

async function fetchPage(siteBase: string, sid: string): Promise<string | null> {
  const url = `${siteBase}/cardlist/?series=${sid}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MeeCard/1.0)" },
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ──

async function main() {
  const targetSets = process.argv.slice(2).map((s) => s.toLowerCase());
  const setsToProcess =
    targetSets.length > 0
      ? SETS.filter((s) => targetSets.includes(s.code))
      : SETS.filter((s) => s.code !== "don");

  console.log("\n=== Official Bandai Card Fetcher ===");
  console.log(`Processing ${setsToProcess.length} sets...\n`);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  for (const setDef of setsToProcess) {
    const { code } = setDef;
    const enSid = seriesId(SITES.en, code);
    const jpSid = seriesId(SITES.jp, code);
    const thSid = seriesId(SITES.th, code);

    if (!enSid) {
      console.log(`  [${code}] Cannot derive series ID, skipping`);
      continue;
    }

    console.log(`  [${code}] Fetching EN(${enSid}) + JP(${jpSid}) + TH(${thSid})...`);

    const [enHtml, jpHtml, thHtml] = await Promise.all([
      fetchPage(SITES.en.base, enSid),
      fetchPage(SITES.jp.base, jpSid),
      fetchPage(SITES.th.base, thSid),
    ]);

    const enCards = enHtml ? parseCardsFromHtml(cheerio.load(enHtml), SITES.en.base) : [];
    const jpCards = jpHtml ? parseCardsFromHtml(cheerio.load(jpHtml), SITES.jp.base) : [];
    const thCards = thHtml ? parseCardsFromHtml(cheerio.load(thHtml), SITES.th.base) : [];

    if (enCards.length === 0 && jpCards.length === 0) {
      console.log(`    No cards found`);
      continue;
    }

    const jpMap = new Map<string, RawCard>();
    for (const c of jpCards) jpMap.set(c.id, c);

    const thMap = new Map<string, RawCard>();
    for (const c of thCards) thMap.set(c.id, c);

    const primaryCards = enCards.length > 0 ? enCards : jpCards;

    const merged: OfficialCard[] = [];

    for (const card of primaryCards) {
      const isParallel = /_p\d+$/.test(card.id);
      const parallelMatch = card.id.match(/_p(\d+)$/);
      const parallelIndex = parallelMatch ? parseInt(parallelMatch[1], 10) : undefined;
      const baseCode = card.id.replace(/_p\d+$/, "").toUpperCase();

      const jp = jpMap.get(card.id);
      const th = thMap.get(card.id);

      const rarity = mapRarity(card.rarity, isParallel);
      const cardType = card.cardType;

      merged.push({
        code: baseCode,
        cardCode: card.id.replace(/^[A-Za-z]+\d+-\d+/, (m) => m.toUpperCase()),
        rarity,
        cardType,
        nameEn: enCards.length > 0 ? card.name : "",
        nameJp: jp?.name ?? (enCards.length > 0 ? "" : card.name),
        nameTh: th?.name,
        color: card.color || "Unknown",
        cost: card.cost,
        power: card.power,
        counter: card.counter,
        life: card.life,
        attribute: card.attribute,
        trait: card.trait,
        effectEn: enCards.length > 0 ? card.effect : undefined,
        effectJp: jp?.effect ?? undefined,
        effectTh: th?.effect ?? undefined,
        triggerEn: enCards.length > 0 ? card.trigger : undefined,
        triggerJp: jp?.trigger ?? undefined,
        imageUrl: card.imageUrl,
        isParallel,
        parallelIndex,
        sets: card.sets,
      });
    }

    // Also add JP-only cards not present in EN
    if (enCards.length > 0 && jpCards.length > 0) {
      const enIds = new Set(enCards.map((c) => c.id));
      for (const jpCard of jpCards) {
        if (enIds.has(jpCard.id)) continue;

        const isParallel = /_p\d+$/.test(jpCard.id);
        const parallelMatch = jpCard.id.match(/_p(\d+)$/);
        const parallelIndex = parallelMatch ? parseInt(parallelMatch[1], 10) : undefined;
        const baseCode = jpCard.id.replace(/_p\d+$/, "").toUpperCase();
        const th = thMap.get(jpCard.id);

        merged.push({
          code: baseCode,
          cardCode: jpCard.id.replace(/^[A-Za-z]+\d+-\d+/, (m) => m.toUpperCase()),
          rarity: mapRarity(jpCard.rarity, isParallel),
          cardType: jpCard.cardType,
          nameEn: "",
          nameJp: jpCard.name,
          nameTh: th?.name,
          color: jpCard.color || "Unknown",
          cost: jpCard.cost,
          power: jpCard.power,
          counter: jpCard.counter,
          life: jpCard.life,
          attribute: jpCard.attribute,
          trait: (jpCard.trait ?? ""),
          effectJp: jpCard.effect,
          effectTh: th?.effect,
          triggerJp: jpCard.trigger,
          imageUrl: jpCard.imageUrl,
          isParallel,
          parallelIndex,
          sets: jpCard.sets,
        });
      }
    }

    merged.sort((a, b) => a.cardCode.localeCompare(b.cardCode));

    const baseCount = merged.filter((c) => !c.isParallel).length;
    const paCount = merged.filter((c) => c.isParallel).length;
    const spCount = merged.filter((c) => c.rarity === "SP").length;
    const rarities = Array.from(new Set(merged.map((c) => c.rarity))).sort().join(", ");

    const outPath = path.join(DATA_DIR, `${code}.json`);
    fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), "utf-8");
    console.log(`    ${merged.length} cards (${baseCount} base + ${paCount} PA, ${spCount} SP reprints) [${rarities}]`);

    await sleep(500);
  }

  console.log("\n=== Done ===\n");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
