/**
 * SEO copy for the set pages (`/opcg/sets` + `/opcg/sets/[code]`).
 *
 * Why a module instead of the flat `t()` dictionary: every string here
 * interpolates live data (card counts, prices, release dates, rarity
 * breakdowns) which a flat key/value dictionary cannot express.
 *
 * Thai is the page language that matters (the site is Thai-first, see
 * doc/seo-content-plan.md §3.8). EN is a reasonable translation; JP mirrors EN.
 *
 * Two spellings rule: Thai searchers type BOTH "วันพีซ" and "วันพีช" — every
 * page must carry both. Titles use "วันพีซ"; the description/body copy carries
 * "วันพีช" at least once.
 *
 * NOTE: CardSet.nameTh is NULL for every set in production, so no Thai set name
 * is ever promised here — the English set name is wrapped in Thai context words
 * instead ("ชุด OP01 Romance Dawn").
 */

import type { Language } from "@/lib/i18n";
import {
  formatCount,
  formatJpy,
  formatThb,
  jpyToThb,
} from "@/lib/utils/currency";
import { CARDS_PER_PACK_JP, PACKS_PER_BOX } from "@/lib/utils/pull-rate";

export type SeoFaqItem = { question: string; answer: string };

export type SetSeoRarity = {
  /** Rarity code, e.g. "SEC" / "P-SR". */
  rarity: string;
  /** English rarity name from the rarity registry, e.g. "Secret Rare". */
  name: string;
  count: number;
  /** Expected copies of this rarity per box (community drop-rate data). */
  avgPerBox?: number;
  /** Chance of pulling one SPECIFIC card of this rarity per box (0–1). */
  chancePerBoxPerCard?: number;
};

export type SetSeoTopCard = {
  name: string;
  cardCode: string;
  rarity: string;
  priceJpy: number;
};

export type SetSeoData = {
  code: string;
  /** English set name (nameEn ?? name) — never a Thai name, see file header. */
  name: string;
  /** Raw SetType enum value, e.g. "BOOSTER" / "STARTER". */
  type: string;
  releaseDate: Date | string | null;
  cardCount: number;
  packsPerBox: number | null;
  cardsPerPack: number | null;
  rarities: SetSeoRarity[];
  topCard: SetSeoTopCard | null;
};

/* ------------------------------------------------------------------ */
/*  Small formatting helpers (deterministic — safe for ISR / SSR)      */
/* ------------------------------------------------------------------ */

const TH_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "15 ม.ค. 2023" / "15 Jan 2023" — hand-rolled so SSR and ISR never drift. */
export function formatSetDate(
  lang: Language,
  value: Date | string | null | undefined,
): string | null {
  const date = toDate(value);
  if (!date) return null;
  const day = date.getUTCDate();
  const monthIndex = date.getUTCMonth();
  const year = date.getUTCFullYear();
  return lang === "TH"
    ? `${day} ${TH_MONTHS[monthIndex]} ${year}`
    : `${day} ${EN_MONTHS[monthIndex]} ${year}`;
}

/** "ม.ค. 2023" — the compact label used on the set-index tiles. */
export function formatSetMonth(
  lang: Language,
  value: Date | string | null | undefined,
): string | null {
  const date = toDate(value);
  if (!date) return null;
  const months = lang === "TH" ? TH_MONTHS : EN_MONTHS;
  return `${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function priceLabel(jpy: number): string {
  return `${formatThb(Math.round(jpyToThb(jpy)))} (${formatJpy(jpy)})`;
}

function pct(value: number, digits = 1): string {
  const percent = value * 100;
  if (percent >= 10) return `${percent.toFixed(0)}%`;
  if (percent >= 1) return `${percent.toFixed(1)}%`;
  return `${percent.toFixed(digits + 1)}%`;
}

function approx(value: number): string {
  if (value >= 10) return `~${value.toFixed(0)}`;
  if (value >= 1) return `~${value.toFixed(1)}`;
  return `~${value.toFixed(2)}`;
}

/* ------------------------------------------------------------------ */
/*  Rarity + set-type labels                                           */
/* ------------------------------------------------------------------ */

const RARITY_TH: Record<string, string> = {
  TR: "เทรเชอร์แรร์",
  SP: "สเปเชียล",
  SEC: "ซีเคร็ทแรร์",
  SR: "ซูเปอร์แรร์",
  R: "แรร์",
  UC: "อันคอมมอน",
  C: "คอมมอน",
  L: "ลีดเดอร์",
  DON: "ดอน",
  P: "โปรโม",
};

/** Thai transliteration of a rarity code ("SEC" → "ซีเคร็ทแรร์"). */
export function rarityThaiName(rarity: string): string | null {
  const isParallel = rarity.startsWith("P-");
  const base = isParallel ? rarity.slice(2) : rarity;
  const thai = RARITY_TH[base];
  if (!thai) return null;
  return isParallel ? `พาราเรล${thai}` : thai;
}

/**
 * Heading label for a rarity section: Thai readers search "SEC คือ" but also
 * "ซีเคร็ทแรร์", so the heading carries both.
 */
export function rarityHeadingLabel(
  lang: Language,
  rarity: string,
  englishName: string,
): string {
  if (lang !== "TH") return englishName;
  const thai = rarityThaiName(rarity);
  return thai ? `${englishName} (${thai})` : englishName;
}

const SET_TYPE_TH: Record<string, string> = {
  BOOSTER: "บูสเตอร์",
  EXTRA_BOOSTER: "เอ็กซ์ตร้าบูสเตอร์",
  STARTER: "สตาร์ทเตอร์เด็ค",
  PROMO: "โปรโม",
  OTHER: "อื่นๆ",
};

const SET_TYPE_EN: Record<string, string> = {
  BOOSTER: "Booster Pack",
  EXTRA_BOOSTER: "Extra Booster",
  STARTER: "Starter Deck",
  PROMO: "Promo",
  OTHER: "Other",
};

function normalizeType(type: string): string {
  return type.replaceAll(" ", "_").toUpperCase();
}

/** "บูสเตอร์ (Booster Pack)" on TH, plain English elsewhere. */
export function setTypeHeading(lang: Language, type: string): string {
  const key = normalizeType(type);
  const english = SET_TYPE_EN[key] ?? type;
  if (lang !== "TH") return english;
  const thai = SET_TYPE_TH[key];
  return thai ? `${thai} (${english})` : english;
}

function setTypeThai(type: string): string {
  return SET_TYPE_TH[normalizeType(type)] ?? "การ์ด";
}

/* ------------------------------------------------------------------ */
/*  Set detail — metadata                                              */
/* ------------------------------------------------------------------ */

const TITLE_BUDGET = 60;

function clampTitle(candidates: string[]): string {
  for (const candidate of candidates) {
    if (candidate.length <= TITLE_BUDGET) return candidate;
  }
  return candidates[candidates.length - 1]!;
}

export function buildSetDetailMeta(
  lang: Language,
  set: SetSeoData,
): { title: string; description: string } {
  const code = set.code.toUpperCase();
  const count = formatCount(set.cardCount);

  if (lang === "TH") {
    const title = clampTitle([
      `ราคาการ์ดวันพีซ ${code} ${set.name} ทุกใบ อัปเดตทุกวัน`,
      `ราคาการ์ดวันพีซ ${code} ${set.name} ทุกใบ`,
      `ราคาการ์ดวันพีซ ${code} ทุกใบ อัปเดตทุกวัน`,
    ]);
    const top = set.topCard
      ? ` ใบแพงสุดคือ ${set.topCard.name} (${set.topCard.cardCode}) ${priceLabel(set.topCard.priceJpy)}`
      : "";
    const description = `เช็คราคาการ์ดวันพีซชุด ${code} ${set.name} ครบทั้ง ${count} ใบ ราคากลางอัปเดตทุกวัน.${top} พร้อมอัตราออก (drop rate) ต่อกล่อง และราคาการ์ดวันพีชแยกตามความหายากในหน้าเดียว`;
    return { title, description };
  }

  const title = clampTitle([
    `${code} ${set.name} — Every Card Price, Updated Daily`,
    `${code} ${set.name} — Card Prices`,
  ]);
  const top = set.topCard
    ? ` Most valuable: ${set.topCard.name} (${set.topCard.cardCode}) ${priceLabel(set.topCard.priceJpy)}.`
    : "";
  return {
    title,
    description: `All ${count} cards in One Piece Card Game set ${code} ${set.name} with daily market prices.${top} Includes per-box drop rates and a rarity breakdown.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Set detail — intro prose                                           */
/* ------------------------------------------------------------------ */

function rarityBreakdown(lang: Language, set: SetSeoData, take = 6): string {
  const unit = lang === "TH" ? "ใบ" : "cards";
  return set.rarities
    .slice(0, take)
    .map((r) => `${r.rarity} ${formatCount(r.count)} ${unit}`)
    .join(" · ");
}

/** H2 above the intro — the money keyword for this page. */
export function buildSetIntroHeading(lang: Language, set: SetSeoData): string {
  const code = set.code.toUpperCase();
  return lang === "TH"
    ? `ราคาการ์ดวันพีซ ${code} ทุกใบ`
    : `Every card price in ${code}`;
}

/**
 * 3–4 server-rendered Thai sentences generated from data already on hand —
 * release date, box composition, card count, rarity split, top card + price.
 */
export function buildSetIntro(lang: Language, set: SetSeoData): string[] {
  const code = set.code.toUpperCase();
  const released = formatSetDate(lang, set.releaseDate);
  const packs = set.packsPerBox;
  const perPack = set.cardsPerPack;

  if (lang === "TH") {
    const first =
      `${code} ${set.name} เป็นชุด${setTypeThai(set.type)}ของการ์ดวันพีซ (One Piece Card Game) ` +
      (released ? `วางจำหน่ายเมื่อ ${released} ` : "") +
      `รวมการ์ดในชุดทั้งหมด ${formatCount(set.cardCount)} ใบ`;

    const second =
      set.rarities.length > 0
        ? `แบ่งตามความหายากได้เป็น ${rarityBreakdown(lang, set)} — ทุกใบมีราคากลางอัปเดตทุกวันจากตลาดญี่ปุ่น และกดเข้าไปดูกราฟราคาย้อนหลังรายใบได้`
        : `ทุกใบมีราคากลางอัปเดตทุกวันจากตลาดญี่ปุ่น และกดเข้าไปดูกราฟราคาย้อนหลังรายใบได้`;

    const boxPart =
      packs && perPack
        ? `กล่องของชุดนี้มี ${packs} ซอง ซองละ ${perPack} ใบ (รวม ${formatCount(packs * perPack)} ใบต่อกล่อง) `
        : "";
    const topPart = set.topCard
      ? `การ์ดที่แพงที่สุดในชุดตอนนี้คือ ${set.topCard.name} (${set.topCard.cardCode}) ความหายาก ${set.topCard.rarity} ราคา ${priceLabel(set.topCard.priceJpy)}`
      : `ชุดนี้ยังไม่มีข้อมูลราคาการ์ดที่แพงที่สุดในระบบ`;
    const third = `${boxPart}${topPart}`;

    const fourth = `ถ้ากำลังหาว่าการ์ดวันพีชใบไหนในชุด ${code} ราคาเท่าไหร่ เลื่อนดูราคาทุกใบแยกตามความหายากด้านล่าง หรือดูอัตราออกต่อกล่องได้ในตารางท้ายหน้า`;

    return [first, second, third, fourth];
  }

  const first =
    `${code} ${set.name} is a ${SET_TYPE_EN[normalizeType(set.type)] ?? "set"} for the One Piece Card Game` +
    (released ? `, released ${released}` : "") +
    `, with ${formatCount(set.cardCount)} cards in total.`;
  const second =
    set.rarities.length > 0
      ? `By rarity: ${rarityBreakdown(lang, set)}. Every card carries a daily market reference price with full price history.`
      : `Every card carries a daily market reference price with full price history.`;
  const third =
    (packs && perPack
      ? `A box contains ${packs} packs of ${perPack} cards (${formatCount(packs * perPack)} cards per box). `
      : "") +
    (set.topCard
      ? `The most valuable card right now is ${set.topCard.name} (${set.topCard.cardCode}, ${set.topCard.rarity}) at ${priceLabel(set.topCard.priceJpy)}.`
      : `No price data for the most valuable card yet.`);
  const fourth = `Browse every price by rarity below, or check the per-box drop rates at the end of the page.`;

  return [first, second, third, fourth];
}

/* ------------------------------------------------------------------ */
/*  Set detail — FAQ                                                   */
/* ------------------------------------------------------------------ */

export function buildSetFaqTitle(lang: Language, set: SetSeoData): string {
  const code = set.code.toUpperCase();
  return lang === "TH"
    ? `คำถามที่พบบ่อยเกี่ยวกับ ${code}`
    : `${code} — frequently asked questions`;
}

function findSecRarity(set: SetSeoData): SetSeoRarity | null {
  return (
    set.rarities.find((r) => r.rarity === "SEC" && r.avgPerBox != null) ??
    set.rarities.find((r) => r.rarity === "P-SEC" && r.avgPerBox != null) ??
    null
  );
}

export function buildSetFaq(lang: Language, set: SetSeoData): SeoFaqItem[] {
  const code = set.code.toUpperCase();
  const released = formatSetDate(lang, set.releaseDate);
  const packs = set.packsPerBox;
  const perPack = set.cardsPerPack;
  const sec = findSecRarity(set);
  const withDropRate = set.rarities.filter((r) => r.avgPerBox != null);

  if (lang === "TH") {
    const items: SeoFaqItem[] = [
      {
        question: `กล่อง ${code} มีกี่ซอง ซองละกี่ใบ`,
        answer:
          packs && perPack
            ? `กล่องของชุด ${code} มี ${packs} ซอง ซองละ ${perPack} ใบ รวม ${formatCount(packs * perPack)} ใบต่อกล่อง ส่วนการ์ดที่ต่างกันในชุดนี้มีทั้งหมด ${formatCount(set.cardCount)} ใบ`
            : `ระบบยังไม่มีข้อมูลจำนวนซองต่อกล่องของชุด ${code} โดยทั่วไปบูสเตอร์การ์ดวันพีซฉบับญี่ปุ่นจะเป็นกล่องละ ${PACKS_PER_BOX} ซอง ซองละ ${CARDS_PER_PACK_JP} ใบ (รวม ${PACKS_PER_BOX * CARDS_PER_PACK_JP} ใบต่อกล่อง) ส่วนการ์ดที่ต่างกันในชุดนี้มี ${formatCount(set.cardCount)} ใบ`,
      },
      {
        question: `การ์ดที่แพงที่สุดใน ${code} คือใบไหน`,
        answer: set.topCard
          ? `ตอนนี้คือ ${set.topCard.name} (${set.topCard.cardCode}) ความหายาก ${set.topCard.rarity} ราคากลางล่าสุด ${priceLabel(set.topCard.priceJpy)} ราคาขยับได้ทุกวัน จึงควรกดเข้าไปดูกราฟราคาย้อนหลังของการ์ดใบนั้นก่อนซื้อขาย`
          : `ชุด ${code} ยังไม่มีข้อมูลราคาในระบบ เมื่อมีราคากลางเข้ามาแล้วการ์ดที่แพงที่สุดจะขึ้นอยู่บนสุดของหน้านี้อัตโนมัติ`,
      },
      {
        question: `${code} วางขายเมื่อไหร่`,
        answer: released
          ? `ชุด ${code} ${set.name} วางจำหน่ายวันที่ ${released} (อ้างอิงกำหนดวางขายฉบับญี่ปุ่น) ราคาการ์ดในชุดมักผันผวนมากที่สุดในช่วง 1–2 เดือนแรกหลังวางขาย`
          : `ระบบยังไม่มีวันวางจำหน่ายของชุด ${code} ในฐานข้อมูล — ดูรายชื่อชุดการ์ดวันพีชทั้งหมดพร้อมวันวางขายได้ที่หน้ารวมชุดการ์ด`,
      },
    ];

    if (sec?.avgPerBox != null) {
      const perBoxChance = Math.min(sec.avgPerBox, 1);
      const specific =
        sec.chancePerBoxPerCard != null
          ? ` และถ้าเจาะจงว่าต้องได้ SEC ใบใดใบหนึ่ง (ในชุดนี้มี SEC ${formatCount(sec.count)} ใบ) โอกาสจะเหลือประมาณ ${pct(sec.chancePerBoxPerCard)} ต่อกล่อง`
          : "";
      items.push({
        question: `โอกาสได้ SEC ต่อกล่องของ ${code} เท่าไหร่`,
        answer: `จากข้อมูลอัตราออกที่คอมมูนิตี้รวบรวมไว้ SEC ออกเฉลี่ยกล่องละ ${approx(sec.avgPerBox)} ใบ หรือประมาณ ${pct(perBoxChance)} ที่จะเจอ SEC อย่างน้อย 1 ใบต่อกล่อง${specific} ตัวเลขนี้เป็นค่าประมาณ ไม่ใช่ตัวเลขทางการจาก Bandai`,
      });
    } else if (withDropRate.length > 0) {
      items.push({
        question: `อัตราออกของ ${code} ดูได้ที่ไหน`,
        answer: `ตารางอัตราออก (drop rate) ของชุด ${code} อยู่ท้ายหน้านี้ ครอบคลุม ${formatCount(withDropRate.length)} ระดับความหายาก บอกจำนวนเฉลี่ยต่อกล่องและโอกาสได้การ์ดใบที่ต้องการ ตัวเลขเป็นค่าประมาณจากคอมมูนิตี้ ไม่ใช่ตัวเลขทางการจาก Bandai`,
      });
    }

    items.push({
      question: `ราคาการ์ดในหน้า ${code} มาจากไหน`,
      answer: `ราคากลางมาจากการเก็บราคาซื้อขายจริงในตลาดญี่ปุ่น อัปเดตทุกวัน แล้วแปลงเป็นเงินบาทด้วยอัตราคงที่เพื่อให้เทียบกันได้ ส่วนราคาการ์ดเกรด PSA 10 อ้างอิงจากตลาดซื้อขายการ์ดเกรด ราคาที่แสดงเป็นราคาอ้างอิง ไม่ใช่ราคาขายของ Meecard`,
    });

    return items;
  }

  const items: SeoFaqItem[] = [
    {
      question: `How many packs and cards are in a ${code} box?`,
      answer:
        packs && perPack
          ? `A ${code} box holds ${packs} packs of ${perPack} cards (${formatCount(packs * perPack)} cards per box). The set itself contains ${formatCount(set.cardCount)} distinct cards.`
          : `Pack-per-box data for ${code} is not in the database yet. Japanese One Piece Card Game boosters are typically ${PACKS_PER_BOX} packs of ${CARDS_PER_PACK_JP} cards. The set contains ${formatCount(set.cardCount)} distinct cards.`,
    },
    {
      question: `Which card is the most expensive in ${code}?`,
      answer: set.topCard
        ? `Currently ${set.topCard.name} (${set.topCard.cardCode}, ${set.topCard.rarity}) at ${priceLabel(set.topCard.priceJpy)}. Prices move daily — check the card's price history before you buy or sell.`
        : `${code} has no price data yet.`,
    },
    {
      question: `When was ${code} released?`,
      answer: released
        ? `${code} ${set.name} was released on ${released} (Japanese release schedule).`
        : `The release date for ${code} is not in the database yet.`,
    },
  ];

  if (sec?.avgPerBox != null) {
    items.push({
      question: `What are the odds of pulling a SEC from a ${code} box?`,
      answer: `Community drop-rate data puts SEC at ${approx(sec.avgPerBox)} copies per box — roughly ${pct(Math.min(sec.avgPerBox, 1))} chance of at least one SEC per box${
        sec.chancePerBoxPerCard != null
          ? `, or about ${pct(sec.chancePerBoxPerCard)} per box for one specific SEC out of ${formatCount(sec.count)}`
          : ""
      }. These are community estimates, not official Bandai figures.`,
    });
  }

  items.push({
    question: `Where do the ${code} prices come from?`,
    answer: `Market reference prices are scraped daily from the Japanese secondary market and converted to THB at a fixed rate; PSA 10 prices come from graded-card marketplaces. Meecard reports prices, it does not sell cards.`,
  });

  return items;
}

/* ------------------------------------------------------------------ */
/*  Set index (/opcg/sets)                                             */
/* ------------------------------------------------------------------ */

export type SetsIndexSeoData = {
  setCount: number;
  cardCount: number;
  latest: { code: string; name: string; releaseDate: Date | string | null } | null;
};

export function buildSetsIndexMeta(lang: Language): {
  title: string;
  description: string;
} {
  if (lang === "TH") {
    return {
      title: "ชุดการ์ดวันพีซ (OPCG) ทั้งหมด — ราคา จำนวนการ์ด วันวางขาย",
      description:
        "รวมชุดการ์ดวันพีซ (One Piece Card Game) ทุกชุด ทั้งบูสเตอร์ เอ็กซ์ตร้าบูสเตอร์ สตาร์ทเตอร์เด็ค และโปรโม — บอกจำนวนการ์ดและวันวางขายของแต่ละชุด กดเข้าไปดูราคาการ์ดวันพีชทุกใบในชุดนั้นได้ทันที อัปเดตทุกวัน",
    };
  }
  return {
    title: "All One Piece Card Game Sets — Prices, Card Counts, Releases",
    description:
      "Every One Piece Card Game set: boosters, extra boosters, starter decks and promos, with card counts and release dates. Open a set to see daily prices for every card in it.",
  };
}

export function buildSetsIndexHeading(lang: Language): {
  title: string;
  description: string;
} {
  if (lang === "TH") {
    return {
      title: "ชุดการ์ดวันพีซทั้งหมด",
      description: "เลือกชุดเพื่อดูราคาการ์ดทุกใบในชุดนั้น อัปเดตทุกวัน",
    };
  }
  return {
    title: "All One Piece Card Game sets",
    description: "Pick a set to see the daily price of every card in it.",
  };
}

export function buildSetsIndexIntro(
  lang: Language,
  data: SetsIndexSeoData,
): string[] {
  const latestDate = formatSetDate(lang, data.latest?.releaseDate ?? null);

  if (lang === "TH") {
    const first = `ตอนนี้ Meecard เก็บชุดการ์ดวันพีซ (One Piece Card Game) ไว้ ${formatCount(data.setCount)} ชุด รวมการ์ดที่มีราคากลาง ${formatCount(data.cardCount)} ใบ ครอบคลุมทั้งบูสเตอร์ เอ็กซ์ตร้าบูสเตอร์ สตาร์ทเตอร์เด็ค และการ์ดโปรโม`;
    const second = data.latest
      ? `ชุดล่าสุดในระบบคือ ${data.latest.code.toUpperCase()} ${data.latest.name}${latestDate ? ` วางจำหน่าย ${latestDate}` : ""} — กดที่ชุดไหนก็ได้เพื่อดูราคาการ์ดวันพีชทุกใบในชุดนั้น แยกตามความหายาก พร้อมอัตราออกต่อกล่อง`
      : `กดที่ชุดไหนก็ได้เพื่อดูราคาการ์ดวันพีชทุกใบในชุดนั้น แยกตามความหายาก พร้อมอัตราออกต่อกล่อง`;
    const third = `ชื่อชุดใช้ตามฉบับภาษาอังกฤษ (เช่น OP01 Romance Dawn) เพราะเป็นชื่อที่ใช้อ้างอิงกันในตลาดไทยและตรงกับโค้ดบนตัวการ์ด`;
    return [first, second, third];
  }

  const first = `Meecard tracks ${formatCount(data.setCount)} One Piece Card Game sets and ${formatCount(data.cardCount)} priced cards — boosters, extra boosters, starter decks and promos.`;
  const second = data.latest
    ? `The newest set on file is ${data.latest.code.toUpperCase()} ${data.latest.name}${latestDate ? `, released ${latestDate}` : ""}. Open any set to see every card price in it, grouped by rarity, plus per-box drop rates.`
    : `Open any set to see every card price in it, grouped by rarity, plus per-box drop rates.`;
  return [first, second];
}

export function buildSetsIndexFaq(
  lang: Language,
  data: SetsIndexSeoData,
): SeoFaqItem[] {
  const latest = data.latest;
  const latestDate = formatSetDate(lang, latest?.releaseDate ?? null);

  if (lang === "TH") {
    return [
      {
        question: "ชุดการ์ดวันพีซล่าสุดคือชุดไหน",
        answer: latest
          ? `ชุดล่าสุดที่มีในระบบคือ ${latest.code.toUpperCase()} ${latest.name}${latestDate ? ` วางจำหน่าย ${latestDate}` : ""} เมื่อมีชุดใหม่วางขาย ระบบจะเพิ่มให้อัตโนมัติพร้อมราคาการ์ดทุกใบ`
          : `ยังไม่มีข้อมูลชุดล่าสุดในระบบ`,
      },
      {
        question: "โค้ดชุดอย่าง OP01, EB01, ST01 ต่างกันยังไง",
        answer:
          "OP = บูสเตอร์หลัก (Booster Pack) ออกต่อเนื่องเป็นชุดใหญ่, EB = เอ็กซ์ตร้าบูสเตอร์ ชุดเสริมที่การ์ดน้อยกว่า, ST = สตาร์ทเตอร์เด็ค ซื้อแล้วเล่นได้เลย ส่วน P หรือ PRB คือการ์ดโปรโมที่แจกตามอีเวนต์หรือแถมในสินค้าอื่น",
      },
      {
        question: "ราคาการ์ดในแต่ละชุดอัปเดตบ่อยแค่ไหน",
        answer:
          "ราคากลางดึงจากตลาดญี่ปุ่นทุกวัน แล้วแปลงเป็นเงินบาทด้วยอัตราคงที่ ทำให้เทียบราคาการ์ดวันพีชข้ามชุดกันได้ กดเข้าไปในชุดจะเห็นทั้งราคาปัจจุบันและการเปลี่ยนแปลง 24 ชั่วโมง / 7 วัน / 30 วัน",
      },
      {
        question: "อยากรู้โอกาสเปิดได้การ์ดที่ต้องการ ดูตรงไหน",
        answer:
          "ในหน้าของแต่ละชุดจะมีตารางอัตราออก (drop rate) บอกจำนวนเฉลี่ยต่อกล่องของแต่ละความหายาก และโอกาสได้การ์ดใบที่เจาะจง หรือใช้เครื่องมือคำนวณโอกาสเปิดกล่องเพื่อจำลองการเปิดหลายกล่อง",
      },
    ];
  }

  return [
    {
      question: "Which One Piece Card Game set is the newest?",
      answer: latest
        ? `${latest.code.toUpperCase()} ${latest.name}${latestDate ? `, released ${latestDate}` : ""}. New sets are added automatically with prices for every card.`
        : "No set data yet.",
    },
    {
      question: "What do the set codes OP, EB and ST mean?",
      answer:
        "OP = main booster set, EB = extra booster (a smaller supplementary set), ST = starter deck (ready to play out of the box). P/PRB codes are promo cards handed out at events or bundled with other products.",
    },
    {
      question: "How often are set prices updated?",
      answer:
        "Market reference prices are scraped daily from the Japanese secondary market and converted to THB at a fixed rate, so prices are comparable across sets. Each set page shows the current price plus 24h / 7d / 30d change.",
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Shared labels used by the server-rendered set sections             */
/* ------------------------------------------------------------------ */

export function setDropRateCopy(lang: Language, code: string) {
  const upper = code.toUpperCase();
  if (lang === "TH") {
    return {
      heading: `อัตราออกการ์ด (Drop Rate) ของ ${upper}`,
      intro: `ตารางนี้บอกว่าเปิดกล่อง ${upper} หนึ่งกล่องจะเจอการ์ดแต่ละความหายากเฉลี่ยกี่ใบ และถ้าเจาะจงว่าอยากได้การ์ดใบใดใบหนึ่งของความหายากนั้น โอกาสต่อกล่องจะประมาณเท่าไหร่ ตัวเลขเป็นค่าประมาณที่คอมมูนิตี้รวบรวมจากการเปิดจริง ไม่ใช่ตัวเลขทางการจาก Bandai`,
      rarity: "ความหายาก",
      cardsInSet: "จำนวนในชุด",
      perBox: "เฉลี่ยต่อกล่อง",
      perBoxShort: "ใบ/กล่อง",
      chanceShort: "โอกาสได้ใบที่ต้องการ",
      perPack: "เฉลี่ยต่อซอง",
      chance: "โอกาสได้ใบที่ต้องการ/กล่อง",
      unitCards: "ใบ",
      calculatorLabel: "คำนวณโอกาสเปิดกล่องแบบละเอียด",
      boxNote: (packs: number, perPack: number) =>
        `อ้างอิงกล่องละ ${packs} ซอง ซองละ ${perPack} ใบ`,
    };
  }
  return {
    heading: `${upper} drop rates (per box)`,
    intro: `How many cards of each rarity a single ${upper} box yields on average, and the per-box chance of hitting one specific card of that rarity. Community estimates from real box openings — not official Bandai numbers.`,
    rarity: "Rarity",
    cardsInSet: "In set",
    perBox: "Avg / box",
    perBoxShort: "per box",
    chanceShort: "Chance of a specific card",
    perPack: "Avg / pack",
    chance: "Chance of a specific card / box",
    unitCards: "cards",
    calculatorLabel: "Open the drop-rate calculator",
    boxNote: (packs: number, perPack: number) =>
      `Based on ${packs} packs per box, ${perPack} cards per pack`,
  };
}

export function setRarityGuideLinkLabel(lang: Language): string {
  return lang === "TH"
    ? "ความหายากแต่ละระดับต่างกันยังไง? อ่านคู่มือความหายากการ์ดวันพีซ"
    : "What do these rarity codes mean? Read the rarity guide";
}
