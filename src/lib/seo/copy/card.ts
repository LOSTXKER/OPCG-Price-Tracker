import { baseCardCode, formatCardCodeLabel } from "@/lib/cards/card-code";
import type { Language } from "@/lib/i18n";
import { formatJpy, formatSignedPct, formatThb, jpyToThb } from "@/lib/utils/currency";

// Both helpers moved to `@/lib/cards/card-code` (no imports, so client
// components can pull them in without dragging this copy dictionary along).
// Re-exported here because callers across the app already import them by this
// path — new code should import from `@/lib/cards/card-code` directly.
export { baseCardCode, formatCardCodeLabel };

/**
 * Templated SEO copy for the card-detail surface (~3,800 URLs).
 *
 * Lives outside the flat `t()` dictionary on purpose: every string here
 * interpolates real card data (price, rarity, set, scrape date), which a flat
 * key/value dictionary cannot express. TH is the copy that matters — the site
 * is Thai-first — EN is a faithful translation and JP mirrors EN.
 *
 * Thai searchers spell the franchise two ways — "วันพีช" wins Google suggest,
 * so title/description lead with it — and every card page still carries
 * "วันพีซ" once in the body copy for dual coverage.
 */

export interface CardSeoData {
  cardCode: string;
  /** Thai card name from the DB (populated for ~3,834 of 3,838 cards). */
  nameTh: string | null;
  /** `nameEn ?? nameJp` — always present. */
  nameLatin: string;
  rarity: string;
  isParallel: boolean;
  setCode: string;
  /**
   * English set name. `CardSet.nameTh` is NULL for every set, so never promise
   * a Thai set name — wrap the English one in Thai context words instead.
   */
  setName: string;
  latestPriceJpy: number | null;
  /** Explicit THB from the DB when present; otherwise derived from JPY. */
  latestPriceThb: number | null;
  priceChange30d: number | null;
  /** ISO timestamp of the freshest price observation. */
  priceScrapedAt: string | null;
}

const THAI_MONTHS_SHORT = [
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

/**
 * Deterministic UTC date string — no `Date.now()`, no locale lookup, so the
 * server render is stable and cacheable (the page is ISR).
 */
export function formatSeoDate(iso: string | null | undefined, lang: Language = "TH"): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getUTCDate();
  const month = d.getUTCMonth();
  const year = d.getUTCFullYear();
  if (lang === "TH") return `${day} ${THAI_MONTHS_SHORT[month]} ${year}`;
  if (lang === "JP") return `${year}年${month + 1}月${day}日`;
  return `${day} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month]} ${year}`;
}

/** THB text for a card, derived from JPY when the DB column is empty. */
export function cardPriceThbText(data: CardSeoData): string | null {
  if (data.latestPriceThb != null && data.latestPriceThb > 0) {
    return formatThb(Math.round(data.latestPriceThb));
  }
  if (data.latestPriceJpy != null) return formatThb(Math.round(jpyToThb(data.latestPriceJpy)));
  return null;
}

export function cardPriceJpyText(data: CardSeoData): string | null {
  return data.latestPriceJpy != null ? formatJpy(data.latestPriceJpy) : null;
}

/** Name shown to Thai readers (falls back to the Latin name when nameTh is null). */
export function cardDisplayName(lang: Language, data: CardSeoData): string {
  if (lang === "TH" && data.nameTh?.trim()) return data.nameTh.trim();
  return data.nameLatin;
}

const TITLE_BUDGET = 60;

/**
 * "ราคาการ์ดวันพีช OP01-003 Monkey.D.Luffy (SR)" — the card code is mandatory
 * (highest-intent Thai query shape is "OP05-119 ราคา"). Optional segments are
 * appended only while the visible title stays inside the ~60-char budget; the
 * root layout appends " | Meecard" via its title template.
 */
export function buildCardSeoTitle(lang: Language, data: CardSeoData): string {
  const name = cardDisplayName(lang, data);
  const prefix =
    lang === "TH" ? "ราคาการ์ดวันพีช" : lang === "JP" ? "ワンピースカード 価格" : "One Piece Card Price";

  const head = `${prefix} ${formatCardCodeLabel(data.cardCode)}`;
  const rarityPart = ` (${data.rarity})`;

  const roomWithRarity = TITLE_BUDGET - head.length - rarityPart.length - 1;

  // Optional segments are dropped longest-first to stay inside the budget; the
  // card NAME is never cut. A mid-word "Shanks (Paral…" destroys the exact term
  // people search for, and Google indexes the full title anyway — it only
  // truncates the SERP display, which costs far less than losing the keyword.
  if (name.length <= roomWithRarity) {
    const base = `${head} ${name}${rarityPart}`;
    const withSet = `${base} — ${data.setName}`;
    return withSet.length <= TITLE_BUDGET ? withSet : base;
  }
  return `${head} ${name}`;
}

/** Google truncates a SERP snippet around this many characters. */
const DESCRIPTION_BUDGET = 160;

/**
 * Snippet copy: real numbers (฿ and ¥, 30-day move), the set, and the update
 * date. Leads with the primary Thai spelling ("วันพีช") inside the first ~20
 * chars so the keyword survives any SERP truncation; the second spelling
 * ("วันพีซ") lives in the intro body copy instead.
 *
 * SEO round 2: the old template always closed with a ~70-char fixed tail
 * ("ราคากลางจากตลาดญี่ปุ่น อัปเดตทุกวัน เช็คราคาการ์ดวันพีชทุกใบที่
 * Meecard") that pushed every one of the ~3,800 card pages to ~190–210
 * chars — past what Google shows and identical noise on every URL. That
 * sign-off is gone; "อัปเดต {date}" already carries the freshness signal it
 * duplicated. What's left is templated per-card content only, trimmed to
 * the ~160-char budget by dropping optional segments (yen figure, then the
 * 30-day move, then the update date — in that order) the same way
 * `buildCardSeoTitle` drops optional segments, never the name/code/price.
 */
export function buildCardSeoDescription(lang: Language, data: CardSeoData): string {
  const name = cardDisplayName(lang, data);
  // Base code: nobody searches the `_p3` suffix. Four same-name printings stay
  // distinguishable here because the price is interpolated into the snippet.
  const code = baseCardCode(data.cardCode);
  const thb = cardPriceThbText(data);
  const jpy = cardPriceJpyText(data);
  const change =
    data.priceChange30d != null ? formatSignedPct(data.priceChange30d) : null;
  const updated = formatSeoDate(data.priceScrapedAt, lang);

  const head =
    lang === "TH"
      ? `เช็คราคาการ์ดวันพีช ${name} (${code}) ${data.rarity} ชุด ${data.setName}`
      : `Check the OPTCG price of ${name} (${code}), ${data.rarity} from ${data.setName}`;
  const pricePart = thb
    ? lang === "TH"
      ? `ล่าสุด ${thb}`
      : `latest ${thb}`
    : lang === "TH"
      ? "ยังไม่มีราคากลางล่าสุด"
      : "no reference price yet";

  let out = `${head} — ${pricePart}`;

  const optionalSegments = thb
    ? [
        jpy ? ` (${jpy})` : "",
        change ? (lang === "TH" ? ` · 30 วัน ${change}` : ` · 30d ${change}`) : "",
        updated ? (lang === "TH" ? ` · อัปเดต ${updated}` : ` · updated ${updated}`) : "",
      ]
    : [updated ? (lang === "TH" ? ` · อัปเดต ${updated}` : ` · updated ${updated}`) : ""];

  for (const segment of optionalSegments) {
    if (segment && out.length + segment.length <= DESCRIPTION_BUDGET) out += segment;
  }

  return out;
}

/**
 * One server-rendered line under the price, unique per card: name, code,
 * rarity, set and where the price comes from. Gives a page of numbers a
 * sentence Google can read without burying the price it sits under.
 */
export function buildCardIntro(lang: Language, data: CardSeoData): string[] {
  // Reader-facing code = the official card number, without our `_p3` printing
  // suffix (owner decision). The suffix still lives in the URL and the <title>.
  const code = baseCardCode(data.cardCode);
  const hasPrice = cardPriceThbText(data) != null;

  // Wording supplied by the owner (เบส, 2026-08-04). It does NOT restate the
  // price, the 30-day move or the update date — all three already render on
  // screen around this line, and repeating them turned it into a five-line wall
  // between the card name and the price.
  if (lang === "TH") {
    const nameTh = data.nameTh?.trim();
    const namePart =
      nameTh && nameTh !== data.nameLatin ? `${nameTh} (${data.nameLatin})` : data.nameLatin;
    // "วันพีซ" here is deliberate — the one second-spelling slot on the page
    // (title and description already lead with the primary "วันพีช").
    const head = `การ์ด ${namePart} รหัส ${code} ความหายาก ${data.rarity} จากชุด ${data.setName} ในเกมการ์ดวันพีซ (One Piece Card Game)`;

    return [
      hasPrice
        ? // "ความหายาก" is not repeated in the tail — it already appears above,
          // and the owner's draft carried it twice.
          `เช็คราคา${head} พร้อมข้อมูลการ์ด กราฟราคา และประวัติราคา อัปเดตทุกวัน`
        : `${head} ตอนนี้ยังไม่มีราคากลางล่าสุด เพราะยังไม่พบประกาศขายจากแหล่งที่เราติดตามในตลาดญี่ปุ่น เราเก็บราคาใหม่ทุกวัน`,
    ];
  }

  const head = `${data.nameLatin}, card ${code}, a ${data.rarity} card from ${data.setName} in the One Piece Card Game`;
  return [
    hasPrice
      ? `Check the price of ${head}, with card details, a price chart and full price history, updated daily.`
      : `${head}. There is no reference price yet — we have not seen it listed by the sources we track in Japan, and prices are collected daily.`,
  ];
}

export interface CardFaqItem {
  question: string;
  answer: string;
  /** Read-more inside the answer body (FaqSection `link` — not in JSON-LD). */
  link?: { href: string; label: string };
}

/**
 * Per-card FAQ, templated from real data. Feeds FAQPage JSON-LD via FaqSection.
 *
 * SEO round 1: only questions whose answers interpolate THIS card's data may
 * live here. The old static "Raw vs PSA 10" and "what is a parallel" items
 * were byte-identical across all ~3,800 card pages (scaled-content pattern,
 * pumped into FAQPage JSON-LD on every page) — that knowledge now lives once
 * in /guide/rarities and /about#methodology, linked from the answers below.
 */
export function buildCardFaq(lang: Language, data: CardSeoData): CardFaqItem[] {
  const name = cardDisplayName(lang, data);
  const code = baseCardCode(data.cardCode);
  const thb = cardPriceThbText(data);
  const jpy = cardPriceJpyText(data);
  const change = data.priceChange30d != null ? formatSignedPct(data.priceChange30d) : null;
  const updated = formatSeoDate(data.priceScrapedAt, lang);

  if (lang === "TH") {
    return [
      {
        question: `การ์ด ${name} (${code}) ราคาเท่าไหร่?`,
        answer: thb
          ? `ราคากลางล่าสุดของ ${name} (${code}) อยู่ที่ ${thb}${jpy ? ` หรือประมาณ ${jpy}` : ""}${change ? ` และเปลี่ยนแปลง ${change} ในรอบ 30 วัน` : ""}${updated ? ` ข้อมูลอัปเดตเมื่อ ${updated}` : ""} ราคานี้เป็นราคาอ้างอิงจากตลาดญี่ปุ่น ราคาซื้อขายจริงในไทยอาจสูงหรือต่ำกว่านี้ ขึ้นกับสภาพการ์ด ผู้ขาย และค่าจัดส่ง`
          : `ตอนนี้ยังไม่มีราคากลางล่าสุดของ ${name} (${code}) เพราะยังไม่พบประกาศขายจากแหล่งที่เราติดตาม ลองกดติดตามการ์ดใบนี้ไว้ ระบบจะเก็บราคาให้ทันทีที่มีคนตั้งขาย`,
      },
      {
        question: "ราคามาจากแหล่งไหน อัปเดตบ่อยแค่ไหน?",
        answer: `ราคากลางอ้างอิงจากตลาดญี่ปุ่น อัปเดตทุกวัน แล้วแปลงเป็นเงินบาทให้อัตโนมัติ${updated ? ` การ์ด ${code} อัปเดตล่าสุดเมื่อ ${updated}` : ""}`,
        link: { href: "/about#methodology", label: "วิธีคิดราคากลางของ Meecard" },
      },
    ];
  }

  return [
    {
      question: `How much is ${name} (${code})?`,
      answer: thb
        ? `The latest market reference price for ${name} (${code}) is ${thb}${jpy ? ` (about ${jpy})` : ""}${change ? `, ${change} over 30 days` : ""}${updated ? `, updated ${updated}` : ""}. This is a Japanese-market reference; real trades in Thailand can be higher or lower depending on condition, seller and shipping.`
        : `There is no reference price for ${name} (${code}) yet — no tracked source currently lists it.`,
    },
    {
      question: "Where do the prices come from and how often are they updated?",
      answer: `Reference prices come from the Japanese market, rescraped daily and converted to THB automatically${updated ? `; ${code} was last updated ${updated}` : ""}.`,
      link: { href: "/about#methodology", label: "How Meecard prices work" },
    },
  ];
}

/** Headings + lead copy for the server-rendered price-history block. */
export function buildPriceHistoryCopy(
  lang: Language,
  data: { cardCode: string; latestDate: string | null; pointCount: number },
): { title: string; lead: string; recentTitle: string; windowsTitle: string; emptyText: string } {
  const code = baseCardCode(data.cardCode);
  if (lang === "TH") {
    return {
      title: `ประวัติราคา ${code}`,
      lead: data.pointCount
        ? `ราคากลางจากตลาดญี่ปุ่น${data.latestDate ? ` อัปเดตล่าสุด ${data.latestDate}` : ""} ทุกช่วงคำนวณย้อนหลังจากวันที่อัปเดตล่าสุด`
        : `ยังไม่มีประวัติราคาย้อนหลังของ ${code} มากพอจะสรุปเป็นตาราง ระบบจะเก็บราคาใหม่ให้ทุกวัน`,
      recentTitle: "ราคารายวัน",
      windowsTitle: "สรุปช่วงราคา",
      emptyText: "ยังไม่มีข้อมูลราคาย้อนหลังสำหรับการ์ดใบนี้",
    };
  }
  return {
    title: `${code} price history`,
    lead: data.pointCount
      ? `Market reference prices from Japan${data.latestDate ? `, updated ${data.latestDate}` : ""}. Every window is measured back from the most recent update.`
      : `Not enough price history for ${code} yet — new prices are collected daily.`,
    recentTitle: "Daily prices",
    windowsTitle: "Range summary",
    emptyText: "No price history for this card yet.",
  };
}

/** Column + row labels for the price-history tables. */
export function priceHistoryLabels(lang: Language) {
  if (lang === "TH") {
    return {
      date: "วันที่",
      priceThb: "ราคา (บาท)",
      priceJpy: "ราคา (เยน)",
      changeCol: "เทียบครั้งก่อน",
      window: "ช่วงเวลา",
      low: "ต่ำสุด",
      high: "สูงสุด",
      avg: "เฉลี่ย",
      days: (n: number) => `${n} วัน`,
      samples: (n: number) => `${n} จุดข้อมูล`,
    };
  }
  return {
    date: "Date",
    priceThb: "Price (THB)",
    priceJpy: "Price (JPY)",
    changeCol: "Change",
    window: "Window",
    low: "Low",
    high: "High",
    avg: "Average",
    days: (n: number) => `${n} days`,
    samples: (n: number) => `${n} data points`,
  };
}
