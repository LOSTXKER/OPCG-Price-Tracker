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
  formatThb,
  jpyToThb,
} from "@/lib/utils/currency";
import { CARDS_PER_PACK_JP, PACKS_PER_BOX } from "@/lib/utils/pull-rate";

export type SeoFaqItem = {
  question: string;
  answer: string;
  /** Read-more rendered inside the answer body (FaqSection `link`). */
  link?: { href: string; label: string };
};

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

// THB only — owner ruling 2026-08-06 ("ไม่เอาเยน"): no yen in user-facing copy.
function priceLabel(jpy: number): string {
  return formatThb(Math.round(jpyToThb(jpy)));
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

  // Google truncates descriptions around ~160 chars — the old template ran
  // ~195-205 with a long top-card name, cutting the drop-rate benefit and the
  // "วันพีช" spelling out of the snippet. Same clamp idea as the title: try
  // the fullest variant first, drop segments until it fits.
  const DESC_BUDGET = 160;
  const clampDesc = (candidates: string[]): string =>
    candidates.find((c) => c.length <= DESC_BUDGET) ??
    candidates[candidates.length - 1]!;

  if (lang === "TH") {
    const title = clampTitle([
      `ราคาการ์ดวันพีซ ${code} ${set.name} ทุกใบ อัปเดตทุกวัน`,
      `ราคาการ์ดวันพีซ ${code} ${set.name} ทุกใบ`,
      `ราคาการ์ดวันพีซ ${code} ทุกใบ อัปเดตทุกวัน`,
    ]);
    const top = set.topCard
      ? ` ใบแพงสุด ${set.topCard.name} ${priceLabel(set.topCard.priceJpy)}`
      : "";
    const tail = " พร้อมอัตราออกต่อกล่องของการ์ดวันพีชทุกระดับ";
    const description = clampDesc([
      `เช็คราคาการ์ดวันพีซ ${code} ${set.name} ครบ ${count} ใบ อัปเดตทุกวัน —${top}${tail}`,
      `เช็คราคาการ์ดวันพีซ ${code} ครบ ${count} ใบ อัปเดตทุกวัน —${top}${tail}`,
      `เช็คราคาการ์ดวันพีซ ${code} ${set.name} ครบ ${count} ใบ อัปเดตทุกวัน —${tail}`,
    ]);
    return { title, description };
  }

  const title = clampTitle([
    `${code} ${set.name} — Every Card Price, Updated Daily`,
    `${code} ${set.name} — Card Prices`,
  ]);
  const top = set.topCard
    ? ` Most valuable: ${set.topCard.name} ${priceLabel(set.topCard.priceJpy)}.`
    : "";
  return {
    title,
    description: clampDesc([
      `All ${count} cards in One Piece Card Game set ${code} ${set.name} with daily prices.${top} Includes per-box drop rates.`,
      `All ${count} cards in set ${code} with daily prices.${top} Includes per-box drop rates.`,
      `All ${count} cards in One Piece Card Game set ${code} with daily prices and per-box drop rates.`,
    ]),
  };
}

/* ------------------------------------------------------------------ */
/*  Set detail — intro prose                                           */
/* ------------------------------------------------------------------ */

/** H2 above the intro — the money keyword for this page. */
export function buildSetIntroHeading(lang: Language, set: SetSeoData): string {
  const code = set.code.toUpperCase();
  return lang === "TH"
    ? `ราคาการ์ดวันพีซ ${code} ทุกใบ`
    : `Every card price in ${code}`;
}

/**
 * ONE short keyword sentence (owner ruling เบส 2026-08-07, from the live
 * page): every fact this paragraph used to carry is ALREADY VISIBLE on the
 * page — the top card + price sit in the hero directly above it, the rarity
 * breakdown IS the price wall's section headings below, and the box
 * configuration lives in the drop-rate section and its FAQ item. Restating
 * them here read as a data dump. What remains is the only sentence a reader
 * needs at this point: what the page is, how fresh it is, both spellings.
 */
export function buildSetIntro(lang: Language, set: SetSeoData): string[] {
  const code = set.code.toUpperCase();
  const released = formatSetDate(lang, set.releaseDate);

  if (lang === "TH") {
    return [
      `${code} ${set.name} — ชุด${setTypeThai(set.type)}ของการ์ดวันพีซ (One Piece Card Game)${released ? ` วางจำหน่าย ${released}` : ""} เช็คราคาการ์ดวันพีชครบทั้ง ${formatCount(set.cardCount)} ใบ อัปเดตทุกวันจากตลาดญี่ปุ่น`,
    ];
  }

  return [
    `${code} ${set.name} — a ${SET_TYPE_EN[normalizeType(set.type)] ?? "set"} for the One Piece Card Game${released ? `, released ${released}` : ""}. Every one of its ${formatCount(set.cardCount)} cards is priced daily from the Japanese market.`,
  ];
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
        // Methodology lives at /about#methodology only (SEO round 1) — the
        // old per-set "where do prices come from" item repeated the same
        // answer verbatim on all 51 set pages, straight into FAQPage JSON-LD.
        link: { href: "/about#methodology", label: "วิธีคิดราคากลางของ Meecard" },
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
      link: { href: "/about#methodology", label: "How Meecard prices work" },
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
      // ≤160: the old version ran 203 chars and Google cut it mid-sentence.
      description:
        "รวมชุดการ์ดวันพีซ (One Piece Card Game) ทุกชุด ทั้งบูสเตอร์ สตาร์ทเตอร์เด็ค และโปรโม กดเข้าไปเช็คราคาการ์ดวันพีชทุกใบในชุดนั้นได้ทันที อัปเดตทุกวัน",
    };
  }
  return {
    title: "All One Piece Card Game Sets — Prices, Card Counts, Releases",
    description:
      "Every One Piece Card Game set: boosters, extra boosters, starter decks and promos, with card counts and release dates. Open a set to see daily prices for every card in it.",
  };
}

/**
 * H1 only — the line under it is the keyword sentence from
 * `buildSetsIndexIntro`, passed as the PageHeader description. The old
 * generic helper line ("เลือกชุดเพื่อดู…") said the same thing with zero
 * keyword value, so the page carried two grey lines doing one job.
 */
export function buildSetsIndexHeading(lang: Language): { title: string } {
  return {
    title: lang === "TH" ? "ชุดการ์ดวันพีซทั้งหมด" : "All One Piece Card Game sets",
  };
}

/**
 * ONE short sentence, keyword-first — owner ruling 2026-08-06 ("เน้น SEO
 * เน้นๆ"): only what ranks earns a place here. Keyword up front, both Thai
 * spellings, the coverage numbers, the freshness claim, and (once
 * `releaseDate` is backfilled) the newest set. Set types, usage hints and
 * the English-names note all went — the filter tabs and the FAQ under the
 * grid already carry them as real text.
 */
export function buildSetsIndexIntro(
  lang: Language,
  data: SetsIndexSeoData,
): string[] {
  const latestDate = formatSetDate(lang, data.latest?.releaseDate ?? null);

  if (lang === "TH") {
    const latestPart = data.latest
      ? ` ชุดล่าสุดคือ ${data.latest.code.toUpperCase()} ${data.latest.name}${latestDate ? ` วางจำหน่าย ${latestDate}` : ""}`
      : "";
    return [
      `รวมชุดการ์ดวันพีซ (One Piece Card Game) ทั้ง ${formatCount(data.setCount)} ชุด — เช็คราคาการ์ดวันพีชทุกใบรวม ${formatCount(data.cardCount)} ใบ อัปเดตทุกวัน${latestPart}`,
    ];
  }

  const latestPart = data.latest
    ? ` The newest set is ${data.latest.code.toUpperCase()} ${data.latest.name}${latestDate ? `, released ${latestDate}` : ""}.`
    : "";
  return [
    `All ${formatCount(data.setCount)} One Piece Card Game sets — daily prices for every card, ${formatCount(data.cardCount)} in total.${latestPart}`,
  ];
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
          "ราคากลางอัปเดตทุกวัน กดเข้าไปในชุดจะเห็นทั้งราคาปัจจุบันและการเปลี่ยนแปลง 24 ชั่วโมง / 7 วัน / 30 วัน ของการ์ดวันพีชทุกใบ",
        link: { href: "/about#methodology", label: "วิธีคิดราคากลางของ Meecard" },
      },
      {
        question: "อยากรู้โอกาสเปิดได้การ์ดที่ต้องการ ดูตรงไหน",
        answer:
          "ในหน้าของแต่ละชุดจะมีตารางอัตราออก (drop rate) บอกจำนวนเฉลี่ยต่อกล่องของแต่ละความหายาก และโอกาสได้การ์ดใบที่เจาะจง หรือใช้เครื่องมือคำนวณโอกาสเปิดกล่องเพื่อจำลองการเปิดหลายกล่อง",
        link: { href: "/opcg/drop-calculator", label: "เปิดเครื่องคำนวณโอกาสเปิดกล่อง" },
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
        "Reference prices update daily. Each set page shows the current price plus 24h / 7d / 30d change for every card.",
      link: { href: "/about#methodology", label: "How Meecard prices work" },
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
      calculatorDesc:
        "จำลองเปิดหลายซอง/หลายกล่อง ดูเป็นเปอร์เซ็นต์ว่าจะได้การ์ดใบที่ต้องการ",
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
    calculatorDesc:
      "Simulate opening packs and boxes — see your odds of the exact card as a percentage",
    boxNote: (packs: number, perPack: number) =>
      `Based on ${packs} packs per box, ${perPack} cards per pack`,
  };
}

export function setRarityGuideLinkLabel(lang: Language): string {
  return lang === "TH"
    ? "ความหายากแต่ละระดับต่างกันยังไง? อ่านคู่มือความหายากการ์ดวันพีซ"
    : "What do these rarity codes mean? Read the rarity guide";
}
