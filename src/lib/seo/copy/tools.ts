/**
 * Thai-first SEO copy for the tool + browse routes (`/opcg/trending`,
 * `/opcg/search`, `/opcg/market-overview`, `/opcg/drop-calculator`,
 * `/opcg/deck-calculator`, `/opcg/decks`, `/opcg/compare`).
 *
 * Lives here — not in the flat `t()` dictionary — because every string below
 * either interpolates live data (card names, prices, percentages) or is a
 * multi-sentence paragraph. The dictionary can do neither.
 *
 * Language rules baked in (doc/seo-content-plan.md §2):
 * - Thai is the primary audience; EN is a reasonable translation, JP mirrors EN.
 * - Both Thai spellings must appear per page: "วันพีซ" in the title/H1,
 *   "วันพีช" at least once in the description or body copy.
 * - Set names are rendered in English wrapped in Thai context words
 *   ("ชุด OP01 Romance Dawn") — `CardSet.nameTh` is NULL for every set.
 */

import {
  BOXES_PER_CARTON,
  BOX_PATTERNS,
  CARDS_PER_PACK_JP,
  EXPECTED_PARALLEL_SLOTS_PER_BOX,
  PACKS_PER_BOX,
} from "@/lib/utils/pull-rate";
import type { Language } from "@/lib/i18n";

export type SeoFaqItem = { question: string; answer: string };

type Localized<T> = { TH: T; EN: T; JP: T };

function pick<T>(lang: Language, value: Localized<T>): T {
  return value[lang] ?? value.EN;
}

/** EN and JP share one string (JP mirrors EN — see module docblock). */
function thEn<T>(th: T, en: T): Localized<T> {
  return { TH: th, EN: en, JP: en };
}

/* ------------------------------------------------------------------ */
/*  Page metadata (Thai-first — these feed `export const metadata`)     */
/* ------------------------------------------------------------------ */

export type ToolRouteKey =
  | "trending"
  | "search"
  | "marketOverview"
  | "dropCalculator"
  | "deckCalculator"
  | "decks"
  | "compare";

/**
 * Visible title stays ≤ ~60 chars — the root layout appends " | Meecard"
 * through its title template, so never append it here.
 */
export const TOOL_PAGE_METADATA: Record<
  ToolRouteKey,
  { title: string; description: string; canonical: string }
> = {
  trending: {
    // ≤60 with the " | Meecard" suffix — "อัปเดตทุกวัน" already lives in the
    // description, and the old title ran 65 chars total (SEO round 2).
    title: "การ์ดวันพีซราคาขึ้นแรงสุดวันนี้ (Trending)",
    description:
      // "ราคาบาทและเยน" was a stale claim — the page shows THB only since the
      // owner cut the yen column (2026-08-06).
      "จัดอันดับการ์ดวันพีช (One Piece Card Game) ที่ราคาขึ้นและลงแรงที่สุดในรอบ 24 ชั่วโมง 7 วัน และ 30 วัน พร้อมราคาบาทจากตลาดญี่ปุ่น อัปเดตทุกวัน",
    canonical: "/opcg/trending",
  },
  search: {
    title: "ค้นหาการ์ดวันพีซ ทุกใบ ทุกชุด พร้อมราคาล่าสุด",
    description:
      // Not "ชื่อไทย": Card.nameTh mirrors the Latin name for every row in
      // production, so promising Thai-name search would be an overclaim.
      "ค้นหาการ์ดวันพีช (One Piece Card Game) จากชื่อการ์ดหรือรหัสการ์ด เช่น OP13-118 ดูราคากลางเป็นเงินบาท ความหายาก และชุดที่การ์ดอยู่ อัปเดตทุกวัน",
    canonical: "/opcg/search",
  },
  marketOverview: {
    title: "ภาพรวมตลาดการ์ดวันพีซ — มูลค่าตลาด ราคาเฉลี่ย รายวัน",
    description:
      "สรุปภาพรวมตลาดการ์ดวันพีช (One Piece Card Game) มูลค่ารวมทั้งตลาด ราคาเฉลี่ยต่อใบ สัดส่วนมูลค่าตามความหายาก และชุดที่มูลค่าสูงสุด อัปเดตทุกวันจากตลาดญี่ปุ่น",
    canonical: "/opcg/market-overview",
  },
  dropCalculator: {
    title: "คำนวณโอกาสออกการ์ดวันพีซ (Drop Rate) ต่อซอง/กล่อง",
    description:
      "อัตราออกการ์ดวันพีช ต่อซอง ต่อกล่อง และต่อคาตัน — เลือกการ์ดที่อยากได้แล้วดูโอกาสเปิดเจอเป็นเปอร์เซ็นต์ พร้อมต้นทุนโดยประมาณและอัตราออกแยกตามความหายาก",
    canonical: "/opcg/drop-calculator",
  },
  deckCalculator: {
    title: "สร้างเด็ควันพีซ พร้อมคำนวณราคาเด็ครวมเป็นเงินบาท",
    description:
      "สร้างเด็คการ์ดวันพีช (One Piece Card Game) 50 ใบ + Leader แล้วดูราคารวมของทั้งเด็คเป็นเงินบาทและเยนทันที อิงราคากลางจากตลาดญี่ปุ่นที่อัปเดตทุกวัน",
    canonical: "/opcg/deck-calculator",
  },
  decks: {
    // Title deliberately avoids "สร้างเด็ค" + "คำนวณราคา" together — that pair
    // is /opcg/deck-calculator's title. This route is noindexed (SEO round 2,
    // see src/app/decks/layout.tsx) but the title still shows on the browser
    // tab and when the link is shared, so it still needs to read on its own.
    title: "เด็คและเครื่องมือ — ทางลัดไปเครื่องมือการ์ดวันพีซ",
    description:
      "รวมเครื่องมือสำหรับคนเล่นการ์ดวันพีช (One Piece Card Game) — สร้างเด็คพร้อมราคารวม คำนวณโอกาสออกการ์ดต่อกล่อง และเปรียบเทียบราคาการ์ดหลายใบพร้อมกัน",
    canonical: "/opcg/decks",
  },
  compare: {
    title: "เปรียบเทียบราคาการ์ดวันพีซ ทีละหลายใบ",
    description:
      "เทียบการ์ดวันพีช (One Piece Card Game) หลายใบพร้อมกัน — ราคากลางเป็นเงินบาท ความหายาก ชุดที่อยู่ และกราฟราคาย้อนหลัง เพื่อดูว่าใบไหนคุ้มกว่ากันก่อนซื้อ",
    canonical: "/opcg/compare",
  },
};

/* ------------------------------------------------------------------ */
/*  /opcg/trending                                                     */
/* ------------------------------------------------------------------ */

export type TrendingPeriodKey = "24h" | "7d" | "30d";
export type TrendingMoverKind = "gainers" | "losers";

/**
 * H1 + section lead only. The old three-block stack under the H1 (generic
 * description + dynamic summary + methodology paragraph) collapsed into ONE
 * dynamic sentence — `buildTrendingSummary` — per the sitewide owner ruling
 * (2026-08-06): H1 → one keyword sentence → content.
 *
 * The three SEO sections below the H1 are (losers 24h, gainers 7d, gainers
 * 30d) — not three gainers windows — so the first block doesn't duplicate the
 * default gainers-24h tab that sits right above it, and "ราคาลง" actually
 * shows up in the server HTML like the meta description promises.
 */
export function buildTrendingHeading(lang: Language): {
  h1: string;
  moversIntro: string;
} {
  return pick(
    lang,
    thEn(
      {
        h1: "การ์ดวันพีซราคาขึ้นแรงสุดวันนี้",
        moversIntro:
          "สามตารางด้านล่างคือ 10 อันดับแรกของแต่ละช่วงเวลา — ราคาลงแรงสุดในรอบ 24 ชั่วโมง และราคาขึ้นแรงสุดในรอบ 7 วันกับ 30 วัน ใช้ดูได้ทั้งการ์ดที่กำลังถูกเทขายระยะสั้นและใบที่ขึ้นต่อเนื่องมาทั้งเดือน",
      },
      {
        h1: "One Piece cards with the biggest price moves today",
        moversIntro:
          "The three tables below list the top 10 for each window — the biggest 24-hour drops, plus the biggest 7-day and 30-day gainers — useful for spotting a short-term sell-off alongside a card that has climbed all month.",
      },
    ),
  );
}

export function buildTrendingPeriodTitle(
  lang: Language,
  period: TrendingPeriodKey,
  kind: TrendingMoverKind = "gainers",
): string {
  const titles: Localized<Record<TrendingMoverKind, Record<TrendingPeriodKey, string>>> = thEn(
    {
      gainers: {
        "24h": "ราคาขึ้นแรงสุด 24 ชั่วโมง",
        "7d": "ราคาขึ้นแรงสุด 7 วัน",
        "30d": "ราคาขึ้นแรงสุด 30 วัน",
      },
      losers: {
        "24h": "ราคาลงแรงสุด 24 ชั่วโมง",
        "7d": "ราคาลงแรงสุด 7 วัน",
        "30d": "ราคาลงแรงสุด 30 วัน",
      },
    },
    {
      gainers: {
        "24h": "Top gainers — 24 hours",
        "7d": "Top gainers — 7 days",
        "30d": "Top gainers — 30 days",
      },
      losers: {
        "24h": "Top losers — 24 hours",
        "7d": "Top losers — 7 days",
        "30d": "Top losers — 30 days",
      },
    },
  );
  return pick(lang, titles)[kind][period];
}

/** One auto-generated sentence from the freshest mover — no hand-written copy. */
/**
 * The ONE sentence under the H1 — keyword + methodology + (when data exists)
 * the live answer to "which card is pumping today".
 */
export function buildTrendingSummary(
  lang: Language,
  data: { name: string; cardCode: string; changePct: number; priceThb: string } | null,
): string {
  if (!data) {
    return pick(
      lang,
      thEn(
        "จัดอันดับการ์ดวันพีช (One Piece Card Game) ที่ราคาขยับแรงสุดใน 24 ชั่วโมง 7 วัน และ 30 วัน จากราคาตลาดญี่ปุ่น อัปเดตทุกวัน",
        "The One Piece Card Game cards with the biggest price moves over 24 hours, 7 days and 30 days — from Japanese-market prices, updated daily.",
      ),
    );
  }
  const pct = `${data.changePct > 0 ? "+" : ""}${data.changePct.toFixed(2)}%`;
  return pick(
    lang,
    thEn(
      `จัดอันดับการ์ดวันพีช (One Piece Card Game) ที่ราคาขยับแรงสุดใน 24 ชั่วโมง 7 วัน และ 30 วัน อัปเดตทุกวัน — วันนี้ ${data.name} (${data.cardCode}) ขึ้นแรงสุด ${pct} ราคาล่าสุด ${data.priceThb}`,
      `The One Piece Card Game cards with the biggest price moves over 24 hours, 7 days and 30 days, updated daily — today's biggest gainer is ${data.name} (${data.cardCode}) at ${pct}, now ${data.priceThb}.`,
    ),
  );
}

/* ------------------------------------------------------------------ */
/*  /opcg/search                                                       */
/* ------------------------------------------------------------------ */

/**
 * Crawlable "popular searches". Labels are Thai, queries stay Latin/code —
 * `Card.nameEn` and `Card.cardCode` are populated for every row, so each link
 * is guaranteed to land on real results.
 */
export const POPULAR_SEARCHES: { label: string; query: string }[] = [
  { label: "การ์ดลูฟี่", query: "Luffy" },
  { label: "การ์ดโซโล", query: "Zoro" },
  { label: "การ์ดนามิ", query: "Nami" },
  { label: "การ์ดแชงคูส", query: "Shanks" },
  { label: "การ์ดเอส", query: "Ace" },
  { label: "การ์ด Leader", query: "Leader" },
  { label: "ชุด OP13", query: "OP13" },
  { label: "ชุด OP01", query: "OP01" },
];

export function buildSearchCopy(lang: Language): {
  h1: string;
  intro: string;
  resultsTitle: (query: string, total: number) => string;
  browseSetsTitle: string;
  browseSetsIntro: string;
  popularTitle: string;
  viewAllSets: string;
  allResultsHint: (query: string) => string;
} {
  return pick(
    lang,
    thEn(
      {
        h1: "ค้นหาการ์ดวันพีซ",
        intro:
          "พิมพ์ชื่อการ์ดภาษาไทย ภาษาอังกฤษ หรือรหัสการ์ดเพื่อค้นหาการ์ดวันพีช (One Piece Card Game) ทุกใบในฐานข้อมูล ผลการค้นหาจะแสดงราคากลางล่าสุดเป็นเงินบาท ความหายาก และชุดที่การ์ดใบนั้นอยู่ ถ้ายังไม่รู้จะเริ่มตรงไหน เลือกจากชุดการ์ดล่าสุดหรือคำค้นยอดนิยมด้านล่างได้เลย",
        resultsTitle: (query: string, total: number) =>
          `ผลการค้นหา “${query}” — พบ ${total.toLocaleString()} ใบ`,
        browseSetsTitle: "ชุดการ์ดล่าสุด",
        browseSetsIntro:
          "คนไทยส่วนใหญ่เช็คราคาโดยเลือกจากชุดก่อน เลือกชุดด้านล่างเพื่อดูราคาการ์ดทุกใบในชุดนั้น",
        popularTitle: "คำค้นยอดนิยม",
        viewAllSets: "ดูชุดการ์ดทั้งหมด",
        allResultsHint: (query: string) =>
          `แสดงผลลัพธ์บางส่วนของคำค้น “${query}” — เปิดใช้งาน JavaScript เพื่อกรองตามความหายาก สี และช่วงราคา`,
      },
      {
        h1: "Search One Piece cards",
        intro:
          "Search every One Piece Card Game card by Thai name, English name or card code. Results show the latest reference price in Thai baht, the rarity and the set the card belongs to. Not sure where to start? Pick one of the recent sets or popular searches below.",
        resultsTitle: (query: string, total: number) =>
          `Results for “${query}” — ${total.toLocaleString()} cards`,
        browseSetsTitle: "Recent sets",
        browseSetsIntro:
          "Most collectors start from the set. Pick a set below to see the price of every card in it.",
        popularTitle: "Popular searches",
        viewAllSets: "Browse all sets",
        allResultsHint: (query: string) =>
          `Showing part of the results for “${query}” — enable JavaScript to filter by rarity, colour and price.`,
      },
    ),
  );
}

export function buildSearchFaq(lang: Language): SeoFaqItem[] {
  return pick(
    lang,
    thEn(
      [
        {
          question: "รหัสการ์ดวันพีซอ่านยังไง เช่น OP13-118",
          answer:
            "รหัสการ์ดแบ่งเป็นสองส่วน ส่วนหน้าคือรหัสชุด (OP13 = ชุด Booster ลำดับที่ 13, ST = Starter Deck, EB = Extra Booster) ส่วนหลังคือลำดับการ์ดในชุดนั้น เช่น OP13-118 คือการ์ดใบที่ 118 ของชุด OP13 พิมพ์รหัสนี้ในช่องค้นหาได้ตรงๆ",
        },
        {
          question: "ต่อท้ายด้วย _p1 หรือ _p2 คืออะไร",
          answer:
            "คือการ์ดลายพิเศษ (parallel / alternate art) ของการ์ดใบเดียวกัน เช่น OP13-118_p1 คือเวอร์ชันลายพิเศษใบที่ 1 ของ OP13-118 ราคาของลายพิเศษมักสูงกว่าลายปกติหลายเท่า เราแยกราคาให้คนละหน้า",
        },
        {
          question: "ค้นหาเป็นภาษาไทยได้ไหม",
          answer:
            "ได้ ฐานข้อมูลมีชื่อการ์ดภาษาไทยเกือบทุกใบ พิมพ์ชื่อตัวละครเป็นไทย เช่น ลูฟี่ หรือ โซโล ก็เจอ ถ้าผลลัพธ์ไม่ตรงใจให้ลองพิมพ์ชื่ออังกฤษหรือรหัสการ์ดแทน",
        },
        {
          question: "ราคาที่แสดงมาจากไหน",
          answer:
            "ราคากลางอ้างอิงจากตลาดญี่ปุ่น อัปเดตทุกวัน ใช้เป็นราคาอ้างอิงก่อนซื้อขายในไทยได้ แต่ราคาจริงอาจสูงหรือต่ำกว่านี้ตามสภาพการ์ดและความต้องการ",
          link: { href: "/about#methodology", label: "วิธีคิดราคากลางของ Meecard" },
        },
      ],
      [
        {
          question: "How do I read a One Piece card code such as OP13-118?",
          answer:
            "The first part is the set code (OP13 = the 13th booster set, ST = starter deck, EB = extra booster); the second part is the card number inside that set. OP13-118 is card 118 of set OP13. You can paste the code straight into the search box.",
        },
        {
          question: "What does the _p1 / _p2 suffix mean?",
          answer:
            "It marks a parallel (alternate art) print of the same card. OP13-118_p1 is the first parallel version of OP13-118. Parallels usually sell for several times the regular print, so we track them as separate cards.",
        },
        {
          question: "Can I search in Thai?",
          answer:
            "Yes — almost every card has a Thai name in the database, so Thai character names work. If the results look off, try the English name or the card code instead.",
        },
        {
          question: "Where do the prices come from?",
          answer:
            "Reference prices come from the Japanese market, updated daily. Treat them as a reference before buying locally; Thai market prices vary with condition and demand.",
          link: { href: "/about#methodology", label: "How Meecard prices work" },
        },
      ],
    ),
  );
}

/* ------------------------------------------------------------------ */
/*  /opcg/market-overview                                              */
/* ------------------------------------------------------------------ */

/** H1 for the market overview — the nav label ("ภาพรวมตลาด") carries no keyword. */
export function buildMarketOverviewHeading(lang: Language): string {
  return pick(
    lang,
    thEn("ภาพรวมตลาดการ์ดวันพีซ", "One Piece card market overview"),
  );
}

export function buildMarketOverviewCopy(
  lang: Language,
  data: {
    totalCards: number;
    setCount: number;
    totalValueThb: string;
    avgPriceThb: string;
    weightedDelta7d: number | null;
    topSetCode: string | null;
    topSetName: string | null;
  },
): { summary: string; methodologyTitle: string } {
  const delta =
    data.weightedDelta7d == null
      ? null
      : `${data.weightedDelta7d > 0 ? "+" : ""}${data.weightedDelta7d.toFixed(2)}%`;

  return pick(
    lang,
    thEn(
      {
        summary: [
          `ตอนนี้เราติดตามราคาการ์ดวันพีช ${data.totalCards.toLocaleString()} ใบ จาก ${data.setCount.toLocaleString()} ชุด รวมมูลค่าตลาดประมาณ ${data.totalValueThb} เฉลี่ยใบละ ${data.avgPriceThb}`,
          delta
            ? `ในรอบ 7 วันที่ผ่านมา มูลค่ารวมของตลาดเปลี่ยนแปลง ${delta} เมื่อถ่วงน้ำหนักด้วยราคาของแต่ละใบ`
            : "",
          data.topSetCode
            ? `ชุดที่มูลค่ารวมสูงสุดตอนนี้คือชุด ${data.topSetCode}${data.topSetName ? ` ${data.topSetName}` : ""}`
            : "",
        ]
          .filter(Boolean)
          .join(" · "),
        methodologyTitle: "ราคาบนเว็บนี้มาจากไหน",
      },
      {
        summary: [
          `We currently track ${data.totalCards.toLocaleString()} One Piece cards across ${data.setCount.toLocaleString()} sets, worth roughly ${data.totalValueThb} in total and ${data.avgPriceThb} per card on average.`,
          delta ? `Over the last 7 days the value-weighted market moved ${delta}.` : "",
          data.topSetCode
            ? `The most valuable set right now is ${data.topSetCode}${data.topSetName ? ` ${data.topSetName}` : ""}.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
        methodologyTitle: "Where these prices come from",
      },
    ),
  );
}

export function buildMarketMethodologyFaq(lang: Language): SeoFaqItem[] {
  return pick(
    lang,
    thEn(
      [
        // SEO round 1: only questions ABOUT THIS PAGE's numbers stay here.
        // Generic source/frequency/Raw-vs-PSA knowledge lives once at
        // /about#methodology and /guide/rarities — linked, not restated.
        {
          question: "ราคาการ์ดวันพีซบน Meecard มาจากไหน",
          answer:
            "ราคากลางอ้างอิงจากตลาดญี่ปุ่น อัปเดตทุกวัน และทุกหน้าราคาบนเว็บใช้ชุดข้อมูลเดียวกันหมด",
          link: { href: "/about#methodology", label: "วิธีคิดราคากลางของ Meecard" },
        },
        {
          question: "มูลค่าตลาดรวมคำนวณยังไง",
          answer:
            "คือผลรวมของราคากลางล่าสุดของการ์ดทุกใบที่มีราคา (ใบละ 1 ใบ ไม่ได้คูณจำนวนที่ผลิต) จึงใช้เทียบขนาดของตลาดและดูทิศทางขึ้นลงได้ แต่ไม่ใช่มูลค่าซื้อขายจริงต่อวัน",
        },
        {
          question: "ตัวเลขบนหน้านี้เป็นราคาเกรดไหน",
          answer:
            "เป็นราคา Raw (การ์ดที่ยังไม่ได้ส่งเกรด) ทั้งหมด ซึ่งเป็นราคาที่คนไทยซื้อขายกันปกติ",
          link: { href: "/guide/rarities", label: "ความหายากและเกรดการ์ดวันพีซ" },
        },
        {
          question: "การเปลี่ยนแปลง 7 วันคิดยังไง",
          answer:
            "เราเทียบราคากลางล่าสุดกับราคาเมื่อ 7 วันก่อนของการ์ดแต่ละใบ แล้วถ่วงน้ำหนักด้วยราคาของใบนั้น การ์ดราคาแพงจึงมีผลต่อภาพรวมมากกว่าการ์ดราคาถูก",
        },
      ],
      [
        {
          question: "Where do Meecard's One Piece card prices come from?",
          answer:
            "Reference prices come from the Japanese market, updated daily; every price page on the site uses the same dataset.",
          link: { href: "/about#methodology", label: "How Meecard prices work" },
        },
        {
          question: "How is total market value calculated?",
          answer:
            "It is the sum of the latest reference price of every card that has one (one copy per card, not print runs). Use it to gauge the size and direction of the market, not daily traded volume.",
        },
        {
          question: "Which grade are the figures on this page?",
          answer:
            "All raw (ungraded) prices — the way most cards trade in Thailand.",
          link: { href: "/guide/rarities", label: "One Piece card rarities and grades" },
        },
        {
          question: "How is the 7-day change computed?",
          answer:
            "We compare each card's latest reference price with its price 7 days ago and weight the result by the card's price, so expensive cards move the index more than cheap ones.",
        },
      ],
    ),
  );
}

/* ------------------------------------------------------------------ */
/*  /opcg/drop-calculator                                              */
/* ------------------------------------------------------------------ */

export function buildDropCalculatorCopy(lang: Language): {
  h1: string;
  howTitle: string;
  howParagraphs: string[];
  boxPatternTitle: string;
  boxPatternIntro: string;
  ratesTitle: string;
  ratesIntro: string;
  ratesEmpty: string;
  tableHeads: { rarity: string; perBox: string; perPack: string };
  perPackNote: string;
  linksTitle: string;
  readNext: { href: string; label: string }[];
} {
  const packs = PACKS_PER_BOX;
  const cards = CARDS_PER_PACK_JP;
  const boxes = BOXES_PER_CARTON;
  const parallels = EXPECTED_PARALLEL_SLOTS_PER_BOX.toFixed(2);

  return pick(
    lang,
    thEn(
      {
        h1: "คำนวณโอกาสออกการ์ดวันพีซต่อซองและต่อกล่อง",
        howTitle: "อัตราออกการ์ดวันพีซคิดยังไง",
        howParagraphs: [
          `กล่อง (box) ของการ์ดวันพีช ฉบับญี่ปุ่น 1 กล่องมี ${packs} ซอง ซองละ ${cards} ใบ รวม ${packs * cards} ใบต่อกล่อง และ 1 คาตัน (carton) มี ${boxes} กล่อง ตัวเลขพวกนี้คือฐานของการคำนวณทุกอย่างในหน้านี้`,
          `ในหนึ่งกล่องจะการันตีการ์ดระดับ SR ประมาณ 3 ใบเสมอ ส่วนการ์ดลายพิเศษ (parallel) ออกเฉลี่ยประมาณ ${parallels} ใบต่อกล่อง และการ์ดระดับ SEC จะออกเฉพาะกล่องที่เป็นแพตเทิร์น SEC เท่านั้น ซึ่งมีโอกาสราว ${Math.round(BOX_PATTERNS[0].prob * 100)}% ของกล่องทั้งหมด หรือพูดง่ายๆ คือประมาณ 1 ใบทุก 3 กล่อง`,
          "เครื่องคำนวณจะเอาโอกาสต่อหนึ่งหน่วย (ซอง/กล่อง/คาตัน) มาคูณต่อตามจำนวนที่คุณจะซื้อ ด้วยสูตรความน่าจะเป็นแบบ “อย่างน้อย 1 ใบ” จึงตอบได้ว่าถ้าซื้อ 3 กล่อง โอกาสได้การ์ดที่อยากได้อย่างน้อยหนึ่งใบเป็นกี่เปอร์เซ็นต์ ตัวเลขทั้งหมดเป็นค่าประมาณจากข้อมูลชุมชน ไม่ใช่ตัวเลขทางการจากผู้ผลิต",
        ],
        boxPatternTitle: "แพตเทิร์นกล่อง 3 แบบ",
        boxPatternIntro:
          "กล่องหนึ่งกล่องจะสุ่มมาเป็นหนึ่งในสามแบบนี้ ซึ่งเป็นเหตุผลว่าทำไมบางกล่องเปิดแล้วไม่ได้ SEC เลย",
        ratesTitle: "อัตราออกเฉลี่ยแยกตามความหายาก",
        ratesIntro:
          "ค่าเฉลี่ยจากข้อมูลอัตราออกของทุกชุดที่เรามี ใช้เป็นตัวตั้งต้นได้ แต่แต่ละชุดต่างกันเล็กน้อย เลือกชุดในเครื่องคำนวณด้านบนเพื่อดูตัวเลขของชุดนั้นโดยตรง",
        ratesEmpty: "ยังไม่มีข้อมูลอัตราออกในระบบ",
        tableHeads: {
          rarity: "ความหายาก",
          perBox: "เฉลี่ยต่อกล่อง (ใบ)",
          perPack: "เฉลี่ยต่อซอง (ใบ)",
        },
        perPackNote: `ค่าเฉลี่ยต่อซองคำนวณจากกล่องละ ${packs} ซอง`,
        linksTitle: "อ่านต่อ",
        readNext: [
          { href: "/guide/rarities", label: "ความหายากการ์ดวันพีซ — C ถึง Treasure Rare" },
          { href: "/opcg/sets", label: "ชุดการ์ดทั้งหมด พร้อมราคาการ์ดทุกใบ" },
          { href: "/opcg/deck-calculator", label: "สร้างเด็คและคำนวณราคารวม" },
        ],
      },
      {
        h1: "One Piece card pull-rate calculator",
        howTitle: "How One Piece pull rates work",
        howParagraphs: [
          `A Japanese One Piece Card Game box holds ${packs} packs of ${cards} cards — ${packs * cards} cards per box — and a carton holds ${boxes} boxes. Every number on this page is built on those constants.`,
          `Each box guarantees about 3 SR cards. Parallel (alternate art) cards average ${parallels} per box, and SEC cards only appear in the SEC box pattern, which is roughly ${Math.round(BOX_PATTERNS[0].prob * 100)}% of boxes — about one SEC every three boxes.`,
          "The calculator takes the per-unit chance (pack, box or carton) and compounds it over the quantity you plan to buy using an 'at least one copy' probability, so you can see what three boxes actually buys you. All figures are community estimates, not official rates.",
        ],
        boxPatternTitle: "The three box patterns",
        boxPatternIntro:
          "Every sealed box rolls into one of these three patterns — which is why some boxes contain no SEC at all.",
        ratesTitle: "Average pull rate by rarity",
        ratesIntro:
          "Averaged across every set we hold drop-rate data for. Individual sets differ slightly — pick a set in the calculator above for its exact numbers.",
        ratesEmpty: "No drop-rate data yet.",
        tableHeads: {
          rarity: "Rarity",
          perBox: "Avg per box",
          perPack: "Avg per pack",
        },
        perPackNote: `Per-pack values assume ${packs} packs per box.`,
        linksTitle: "Read next",
        readNext: [
          { href: "/guide/rarities", label: "One Piece card rarities — C to Treasure Rare" },
          { href: "/opcg/sets", label: "All sets, with the price of every card" },
          { href: "/opcg/deck-calculator", label: "Build a deck and price it" },
        ],
      },
    ),
  );
}

export function buildDropCalculatorFaq(lang: Language): SeoFaqItem[] {
  return pick(
    lang,
    thEn(
      [
        {
          question: `กล่องการ์ดวันพีซ 1 กล่องมีกี่ซอง กี่ใบ`,
          answer: `กล่องฉบับญี่ปุ่น 1 กล่องมี ${PACKS_PER_BOX} ซอง ซองละ ${CARDS_PER_PACK_JP} ใบ รวม ${PACKS_PER_BOX * CARDS_PER_PACK_JP} ใบต่อกล่อง และ 1 คาตันมี ${BOXES_PER_CARTON} กล่อง`,
        },
        {
          question: "โอกาสได้การ์ด SEC ต่อกล่องเท่าไหร่",
          answer: `กล่องประมาณ ${Math.round(BOX_PATTERNS[0].prob * 100)}% เป็นแพตเทิร์นที่มี SEC 1 ใบ เฉลี่ยแล้วคือได้ SEC ประมาณ 1 ใบทุก 3 กล่อง และเมื่อได้กล่องแบบนั้นแล้ว SEC ที่ออกยังต้องสุ่มอีกว่าจะเป็นใบไหนในชุด ยิ่งชุดมี SEC หลายแบบ โอกาสได้ใบที่อยากได้ก็ยิ่งน้อยลง`,
        },
        {
          question: "1 กล่องการันตีการ์ด SR กี่ใบ",
          answer:
            "ประมาณ 3 ใบต่อกล่อง เป็นการการันตีระดับกล่อง ไม่ใช่ต่อซอง จึงเป็นเหตุผลว่าทำไมการซื้อยกกล่องคุ้มกว่าการซื้อซองเดี่ยวถ้าเป้าหมายคือการ์ดระดับ SR ขึ้นไป",
        },
        {
          question: "การ์ดลายพิเศษ (parallel) ออกบ่อยแค่ไหน",
          answer: `เฉลี่ยประมาณ ${EXPECTED_PARALLEL_SLOTS_PER_BOX.toFixed(2)} ใบต่อกล่อง โดยกล่องที่ไม่ได้เป็นแพตเทิร์น SEC จะมีลายพิเศษ 1–2 ใบ และการ์ดที่ออกจะสุ่มจากลายพิเศษทั้งหมดของชุดนั้น`,
        },
        {
          question: "ตัวเลขพวกนี้เชื่อถือได้แค่ไหน",
          answer:
            "เป็นค่าประมาณจากข้อมูลที่ชุมชนผู้เล่นรวบรวมจากการเปิดกล่องจำนวนมาก ผู้ผลิตไม่เคยประกาศอัตราออกอย่างเป็นทางการ ใช้ประกอบการตัดสินใจได้ แต่ผลจริงของแต่ละกล่องยังเป็นเรื่องของดวง",
        },
        {
          question: "ซื้อกล่องคุ้มกว่าซื้อการ์ดใบที่อยากได้เลยไหม",
          answer:
            "เทียบง่ายๆ คือเอาราคากล่องหารด้วยโอกาสที่จะได้ใบนั้น ถ้าตัวเลขที่ได้สูงกว่าราคาซื้อการ์ดใบเดียวในตลาด การซื้อใบเดียวก็คุ้มกว่า เครื่องคำนวณด้านบนแสดงทั้งต้นทุนที่ต้องจ่ายและมูลค่ารวมของการ์ดที่อยากได้ให้เทียบในหน้าเดียว",
        },
      ],
      [
        {
          question: "How many packs and cards are in a One Piece box?",
          answer: `A Japanese box holds ${PACKS_PER_BOX} packs of ${CARDS_PER_PACK_JP} cards — ${PACKS_PER_BOX * CARDS_PER_PACK_JP} cards per box — and a carton holds ${BOXES_PER_CARTON} boxes.`,
        },
        {
          question: "What are the odds of pulling a SEC per box?",
          answer: `About ${Math.round(BOX_PATTERNS[0].prob * 100)}% of boxes follow the pattern that contains one SEC — roughly one SEC every three boxes — and which SEC you get is then random across the set's SEC pool.`,
        },
        {
          question: "How many SR cards does a box guarantee?",
          answer:
            "Around three per box. It is a box-level guarantee, not a per-pack one, which is why sealed boxes beat loose packs when you are chasing SR and above.",
        },
        {
          question: "How often do parallel cards appear?",
          answer: `About ${EXPECTED_PARALLEL_SLOTS_PER_BOX.toFixed(2)} per box on average: non-SEC boxes contain one or two parallels drawn at random from the set's parallel pool.`,
        },
        {
          question: "How reliable are these numbers?",
          answer:
            "They are community estimates aggregated from large numbers of box openings. The publisher has never released official rates, so treat them as guidance, not a guarantee.",
        },
        {
          question: "Is buying a box better than buying the single card?",
          answer:
            "Divide the box price by your chance of hitting the card. If that number is higher than the card's market price, buying the single is cheaper. The calculator above shows both the purchase cost and the value of your wanted cards side by side.",
        },
      ],
    ),
  );
}

/* ------------------------------------------------------------------ */
/*  /opcg/deck-calculator                                              */
/* ------------------------------------------------------------------ */

export function buildDeckCalculatorCopy(lang: Language): {
  h1: string;
  costTitle: string;
  costParagraphs: string[];
  rulesTitle: string;
  rules: { term: string; detail: string }[];
  readNextIntro: string;
  readNext: { href: string; label: string }[];
} {
  return pick(
    lang,
    thEn(
      {
        h1: "สร้างเด็ควันพีซ พร้อมราคารวม",
        costTitle: "เด็ควันพีซราคาเท่าไหร่",
        costParagraphs: [
          "เด็คการ์ดวันพีช หนึ่งชุดประกอบด้วยการ์ด Leader 1 ใบ และการ์ดในเด็คอีก 50 ใบ ราคารวมของเด็คจึงขึ้นอยู่กับว่าใช้การ์ดระดับไหนเป็นแกน เด็คที่ใช้การ์ดระดับ C/UC/R เป็นหลักมักจบที่หลักร้อยถึงหลักพันบาท ส่วนเด็คที่ต้องใส่การ์ดระดับ SR หรือ Leader ยอดนิยมใบละหลายพันบาท อย่างละ 4 ใบ ราคารวมขยับขึ้นไปหลักหมื่นได้ไม่ยาก",
          "เครื่องมือนี้คิดราคารวมให้อัตโนมัติจากราคากลางล่าสุดของการ์ดแต่ละใบ คูณด้วยจำนวนที่ใส่ในเด็ค แล้วรวมกับราคา Leader ทำให้เห็นทันทีว่าถ้าจะเล่นเด็คนี้จริงต้องใช้งบเท่าไหร่ และการ์ดใบไหนกินงบมากที่สุด",
          "เคล็ดลับสำหรับคนงบจำกัด: ลองสลับการ์ดที่แพงที่สุดในลิสต์เป็นตัวเลือกที่ทำหน้าที่ใกล้เคียงกันแล้วดูราคารวมใหม่ หลายครั้งราคาลดลงเกินครึ่งโดยที่เด็คยังเล่นได้เหมือนเดิม",
        ],
        rulesTitle: "กฎการสร้างเด็คที่ต้องรู้",
        rules: [
          {
            term: "Leader 1 ใบ + การ์ดในเด็ค 50 ใบ",
            detail:
              "การ์ด Leader นับแยกจาก 50 ใบ และสีของ Leader เป็นตัวกำหนดว่าใส่การ์ดสีไหนลงเด็คได้บ้าง",
          },
          {
            term: "การ์ดชื่อเดียวกันใส่ได้ไม่เกิน 4 ใบ",
            detail:
              "นับตามชื่อการ์ด ไม่ได้นับตามรหัส ดังนั้นลายปกติกับลายพิเศษของการ์ดใบเดียวกันก็นับรวมกันในโควตา 4 ใบ",
          },
          {
            term: "การ์ด DON!! ไม่นับใน 50 ใบ",
            detail:
              "DON!! เป็นกองแยกของตัวเอง (10 ใบ) จึงไม่ต้องคิดรวมในราคาเด็คที่คำนวณจากการ์ด 50 ใบ",
          },
        ],
        readNextIntro: "อ่านต่อก่อนลงมือซื้อการ์ดจริง",
        readNext: [
          { href: "/guide/rarities", label: "ความหายากการ์ดวันพีซ — ระดับไหนแพงเพราะอะไร" },
          { href: "/opcg/sets", label: "ราคาการ์ดทุกใบ แยกตามชุด" },
          { href: "/opcg/drop-calculator", label: "โอกาสเปิดได้การ์ดที่ต้องการต่อกล่อง" },
        ],
      },
      {
        h1: "Build a One Piece deck with live pricing",
        costTitle: "How much does a One Piece deck cost?",
        costParagraphs: [
          "A One Piece Card Game deck is one Leader plus 50 cards, so the total cost depends on which rarities carry the deck. A list built on C/UC/R staples usually lands in the low hundreds to low thousands of baht, while a deck that needs four copies of an SR or a popular Leader can easily reach five figures.",
          "This tool totals the deck for you: the latest reference price of each card multiplied by its copy count, plus the Leader. You immediately see the real budget and which single card eats most of it.",
          "Budget tip: swap the most expensive card in the list for a functional alternative and re-check the total — the price often halves while the deck plays much the same.",
        ],
        rulesTitle: "Deck-building rules to know",
        rules: [
          {
            term: "1 Leader + 50 cards",
            detail:
              "The Leader sits outside the 50-card deck, and its colours decide which cards you may include.",
          },
          {
            term: "Max 4 copies per card name",
            detail:
              "The limit is by card name, not card code — a regular print and its parallel share the same 4-copy allowance.",
          },
          {
            term: "DON!! cards are separate",
            detail:
              "The 10-card DON!! deck is its own pile, so it never counts toward the 50 cards or the deck price.",
          },
        ],
        readNextIntro: "Read next before you buy",
        readNext: [
          { href: "/guide/rarities", label: "One Piece card rarities — why some cards cost more" },
          { href: "/opcg/sets", label: "Every card's price, set by set" },
          { href: "/opcg/drop-calculator", label: "Your odds of pulling the card you need" },
        ],
      },
    ),
  );
}

export function buildDeckCalculatorFaq(lang: Language): SeoFaqItem[] {
  return pick(
    lang,
    thEn(
      [
        {
          question: "เด็ควันพีซใช้การ์ดกี่ใบ",
          answer:
            "การ์ด Leader 1 ใบ บวกการ์ดในเด็คอีก 50 ใบพอดี ไม่มากไม่น้อยกว่านี้ ส่วนการ์ด DON!! อีก 10 ใบเป็นกองแยกที่ไม่นับรวมใน 50 ใบ",
        },
        {
          question: "การ์ดใบเดียวกันใส่ซ้ำได้กี่ใบ",
          answer:
            "ใส่ได้ไม่เกิน 4 ใบต่อชื่อการ์ดหนึ่งชื่อ ถ้ามีทั้งลายปกติและลายพิเศษของการ์ดชื่อเดียวกัน ก็ยังนับรวมกันไม่เกิน 4 ใบอยู่ดี",
        },
        {
          question: "ราคาเด็คคิดมาจากไหน",
          answer:
            "คิดจากราคากลางล่าสุดของการ์ดแต่ละใบ คูณจำนวนที่ใส่ในเด็ค แล้วบวกราคา Leader แสดงผลได้ทั้งเงินเยนและเงินบาท",
          link: { href: "/about#methodology", label: "วิธีคิดราคากลางของ Meecard" },
        },
        {
          question: "ต้องสมัครสมาชิกไหมถึงจะสร้างเด็คได้",
          answer:
            "ดูตัวอย่างเด็คและราคารวมได้เลยโดยไม่ต้องล็อกอิน แต่ถ้าอยากบันทึกเด็คของตัวเองไว้กลับมาแก้ทีหลัง ต้องเข้าสู่ระบบก่อน",
        },
      ],
      [
        {
          question: "How many cards are in a One Piece deck?",
          answer:
            "Exactly one Leader plus 50 deck cards. The 10-card DON!! deck is separate and does not count toward the 50.",
        },
        {
          question: "How many copies of one card can I run?",
          answer:
            "Up to four per card name. A regular print and its parallel share that allowance.",
        },
        {
          question: "How is the deck price calculated?",
          answer:
            "Each card's latest raw reference price multiplied by its copy count, plus the Leader — shown in both yen and baht.",
          link: { href: "/about#methodology", label: "How Meecard prices work" },
        },
        {
          question: "Do I need an account?",
          answer:
            "No — you can browse the example deck and its pricing without logging in. An account is only needed to save your own decks.",
        },
      ],
    ),
  );
}

/* ------------------------------------------------------------------ */
/*  /opcg/decks  +  /opcg/compare                                      */
/* ------------------------------------------------------------------ */

export function buildDecksHubCopy(lang: Language): {
  h1: string;
  intro: string;
  toolsTitle: string;
  tools: { href: string; title: string; detail: string }[];
} {
  return pick(
    lang,
    thEn(
      {
        h1: "เด็คและเครื่องมือการ์ดวันพีซ",
        intro:
          "รวมเครื่องมือที่ใช้บ่อยสำหรับคนเล่นและคนสะสมการ์ดวันพีช (One Piece Card Game) ทุกตัวใช้ราคากลางชุดเดียวกันกับหน้าเช็คราคา จึงเทียบตัวเลขข้ามเครื่องมือได้โดยไม่ต้องแปลงเอง",
        toolsTitle: "เครื่องมือทั้งหมด",
        tools: [
          {
            href: "/opcg/deck-calculator",
            title: "สร้างเด็ค",
            detail:
              "ใส่ Leader และการ์ด 50 ใบ แล้วดูราคารวมของทั้งเด็คเป็นเงินบาททันที",
          },
          {
            href: "/opcg/drop-calculator",
            title: "คำนวณโอกาสออกการ์ด",
            detail:
              "เลือกการ์ดที่อยากได้ แล้วดูโอกาสเปิดเจอต่อซอง ต่อกล่อง และต่อคาตัน พร้อมต้นทุนโดยประมาณ",
          },
          {
            href: "/opcg/compare",
            title: "เปรียบเทียบการ์ด",
            detail:
              "เทียบราคา ความหายาก และกราฟราคาย้อนหลังของการ์ดหลายใบพร้อมกันในหน้าเดียว",
          },
        ],
      },
      {
        h1: "One Piece decks & tools",
        intro:
          "The tools collectors and players use most, all sharing the same daily reference prices as the price pages — so numbers stay comparable across tools.",
        toolsTitle: "All tools",
        tools: [
          {
            href: "/opcg/deck-calculator",
            title: "Deck builder",
            detail: "Add a Leader and 50 cards, and see the whole deck priced in baht instantly.",
          },
          {
            href: "/opcg/drop-calculator",
            title: "Pull-rate calculator",
            detail:
              "Pick the cards you want and see the odds per pack, box and carton with the estimated cost.",
          },
          {
            href: "/opcg/compare",
            title: "Card comparison",
            detail:
              "Compare price, rarity and price history for several cards side by side on one page.",
          },
        ],
      },
    ),
  );
}

export function buildCompareCopy(lang: Language): {
  h1: string;
  intro: string;
  howTitle: string;
  howParagraphs: string[];
} {
  return pick(
    lang,
    thEn(
      {
        h1: "เปรียบเทียบราคาการ์ดวันพีซ",
        intro:
          "เลือกการ์ดวันพีช (One Piece Card Game) ได้หลายใบพร้อมกัน แล้วดูราคากลาง ความหายาก ชุดที่อยู่ และกราฟราคาย้อนหลังเรียงข้างกันในหน้าเดียว เหมาะกับตอนตัดสินใจว่าจะซื้อใบไหนก่อน หรือจะขายใบไหนตอนราคาขึ้น",
        howTitle: "ใช้หน้าเปรียบเทียบยังไงให้คุ้ม",
        howParagraphs: [
          "เทียบลายปกติกับลายพิเศษของการ์ดใบเดียวกัน เพื่อดูว่าส่วนต่างราคาคุ้มกับความสวยหรือไม่ รหัสการ์ดที่ลงท้ายด้วย _p1 คือลายพิเศษของใบนั้น",
          "เทียบการ์ดที่ทำหน้าที่คล้ายกันในเด็คเดียวกัน เพื่อเลือกตัวที่ราคาถูกกว่าเมื่อผลในเกมใกล้เคียงกัน",
          "ดูกราฟย้อนหลังพร้อมกันหลายใบ จะเห็นว่าใบไหนราคานิ่ง ใบไหนขึ้นลงตามกระแสสั้นๆ ก่อนตัดสินใจซื้อจริง",
        ],
      },
      {
        h1: "Compare One Piece card prices",
        intro:
          "Line several One Piece Card Game cards up side by side — reference price, rarity, set and price history in one view. Handy when deciding which card to buy first, or which to sell into a spike.",
        howTitle: "Getting the most out of the comparison",
        howParagraphs: [
          "Compare a regular print with its parallel (the _p1 suffix) to see whether the premium is worth the art.",
          "Compare cards that fill the same slot in a deck and take the cheaper one when the in-game effect is close.",
          "Reading several price histories together shows which cards hold value and which spike on hype.",
        ],
      },
    ),
  );
}
