import type { Language } from "@/lib/i18n";
import { formatJpy, formatSignedPct, formatThb, jpyToThb } from "@/lib/utils/currency";

/**
 * Templated SEO copy for the card-detail surface (~3,800 URLs).
 *
 * Lives outside the flat `t()` dictionary on purpose: every string here
 * interpolates real card data (price, rarity, set, scrape date), which a flat
 * key/value dictionary cannot express. TH is the copy that matters — the site
 * is Thai-first — EN is a faithful translation and JP mirrors EN.
 *
 * Thai searchers spell the franchise two ways ("วันพีซ" and "วันพีช"); every
 * card page therefore carries both spellings across title/description/body.
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

/**
 * Human-readable form of a card code. Parallel printings are stored with a
 * machine suffix (`EB01-001_p1`); readers — and Thai searchers, who type the
 * base code — get `EB01-001 (Parallel 1)`. URLs, `sku` and canonical links keep
 * the raw `cardCode`.
 */
export function formatCardCodeLabel(cardCode: string): string {
  const match = cardCode.match(/^(.*)_p(\d+)$/i);
  return match ? `${match[1]} (Parallel ${match[2]})` : cardCode;
}

/** Name shown to Thai readers (falls back to the Latin name when nameTh is null). */
export function cardDisplayName(lang: Language, data: CardSeoData): string {
  if (lang === "TH" && data.nameTh?.trim()) return data.nameTh.trim();
  return data.nameLatin;
}

const TITLE_BUDGET = 60;

/**
 * "ราคาการ์ดวันพีซ OP01-003 Monkey.D.Luffy (SR)" — the card code is mandatory
 * (highest-intent Thai query shape is "OP05-119 ราคา"). Optional segments are
 * appended only while the visible title stays inside the ~60-char budget; the
 * root layout appends " | Meecard" via its title template.
 */
export function buildCardSeoTitle(lang: Language, data: CardSeoData): string {
  const name = cardDisplayName(lang, data);
  const prefix =
    lang === "TH" ? "ราคาการ์ดวันพีซ" : lang === "JP" ? "ワンピースカード 価格" : "One Piece Card Price";

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

/**
 * Snippet copy: real numbers (฿ and ¥, 30-day move), the set, the source and
 * "อัปเดตทุกวัน". Carries the second Thai spelling ("วันพีช") so both spellings
 * are covered across title + description.
 */
export function buildCardSeoDescription(lang: Language, data: CardSeoData): string {
  const name = cardDisplayName(lang, data);
  const code = formatCardCodeLabel(data.cardCode);
  const thb = cardPriceThbText(data);
  const jpy = cardPriceJpyText(data);
  const change =
    data.priceChange30d != null ? formatSignedPct(data.priceChange30d) : null;
  const updated = formatSeoDate(data.priceScrapedAt, lang);

  if (lang === "TH") {
    const pricePart = thb
      ? `ราคาล่าสุด ${thb}${jpy ? ` (${jpy})` : ""}${change ? ` · 30 วัน ${change}` : ""}`
      : "ยังไม่มีราคากลางล่าสุด";
    const updatedPart = updated ? ` · อัปเดต ${updated}` : "";
    return `${name} (${code}) ความหายาก ${data.rarity} จากชุด ${data.setName} — ${pricePart}${updatedPart} ราคากลางจาก Yuyu-tei อัปเดตทุกวัน เช็คราคาการ์ดวันพีชทุกใบที่ Meecard`;
  }

  const pricePart = thb
    ? `Latest ${thb}${jpy ? ` (${jpy})` : ""}${change ? ` · 30d ${change}` : ""}`
    : "No reference price yet";
  const updatedPart = updated ? ` · updated ${updated}` : "";
  return `${name} (${code}), ${data.rarity} from ${data.setName} — ${pricePart}${updatedPart}. One Piece Card Game market prices from Yuyu-tei, refreshed daily on Meecard.`;
}

/**
 * One server-rendered line under the price, unique per card: name, code,
 * rarity, set and where the price comes from. Gives a page of numbers a
 * sentence Google can read without burying the price it sits under.
 */
export function buildCardIntro(lang: Language, data: CardSeoData): string[] {
  const code = formatCardCodeLabel(data.cardCode);
  const hasPrice = cardPriceThbText(data) != null;

  // One short line, owner-specified length (เบส, 2026-08-04). Two rules behind
  // the wording:
  //   1. It does not restate the price, the 30-day move or the update date —
  //      all three render on screen above/below this copy, and repeating them
  //      made it a five-line wall between the card name and the price.
  //   2. Every clause is per-card data (name, code, printing, rarity, set,
  //      source). A tail listing the page's own sections ("พร้อมข้อมูลการ์ด
  //      กราฟราคา ประวัติราคา") would be byte-identical on all 3,838 cards —
  //      boilerplate that adds a keyword but no information.
  if (lang === "TH") {
    const nameTh = data.nameTh?.trim();
    const namePart =
      nameTh && nameTh !== data.nameLatin ? `${nameTh} (${data.nameLatin})` : data.nameLatin;
    // No "(code)" wrapper and no separate parallel clause: formatCardCodeLabel
    // already returns "OP13-118 (Parallel 3)", so both would double up into
    // "(OP13-118 (Parallel 3)) แบบ parallel".
    return [
      hasPrice
        ? `เช็คราคาการ์ด ${namePart} รหัส ${code} ความหายาก ${data.rarity} จากชุด ${data.setName} ในเกมการ์ดวันพีช (One Piece Card Game) ราคากลางจาก Yuyu-tei ตลาดญี่ปุ่น อัปเดตทุกวัน`
        : `การ์ด ${namePart} รหัส ${code} ความหายาก ${data.rarity} จากชุด ${data.setName} ในเกมการ์ดวันพีช (One Piece Card Game) ตอนนี้ยังไม่มีราคากลางล่าสุด เพราะยังไม่พบประกาศขายจากแหล่งที่เราติดตาม (Yuyu-tei ตลาดญี่ปุ่น) เราเก็บราคาใหม่ทุกวัน`,
    ];
  }

  return [
    hasPrice
      ? `Check the price of ${data.nameLatin}, card ${code}, a ${data.rarity} card from ${data.setName} in the One Piece Card Game. The reference price tracks the Japanese market via Yuyu-tei and is refreshed daily.`
      : `${data.nameLatin}, card ${code}, is a ${data.rarity} card from ${data.setName} in the One Piece Card Game. There is no reference price yet — we have not seen it listed by the sources we track (Yuyu-tei in Japan), and prices are collected daily.`,
  ];
}

export interface CardFaqItem {
  question: string;
  answer: string;
}

/** Per-card FAQ, templated from real data. Feeds FAQPage JSON-LD via FaqSection. */
export function buildCardFaq(lang: Language, data: CardSeoData): CardFaqItem[] {
  const name = cardDisplayName(lang, data);
  const code = formatCardCodeLabel(data.cardCode);
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
        answer: `Meecard เก็บราคาการ์ดวันพีซจากตลาดญี่ปุ่นเป็นหลัก โดยราคาการ์ดแบบ Raw (ยังไม่ส่งเกรด) อ้างอิงจาก Yuyu-tei และราคาการ์ดเกรดอ้างอิงจาก SNKRDUNK ระบบดึงราคาใหม่ทุกวันแล้วแปลงเป็นเงินบาทให้อัตโนมัติ${updated ? ` การ์ด ${code} อัปเดตล่าสุดเมื่อ ${updated}` : ""}`,
      },
      {
        question: "Raw กับ PSA 10 ต่างกันยังไง?",
        answer:
          "Raw คือการ์ดที่ยังไม่ได้ส่งตรวจเกรด ซื้อขายกันตามสภาพที่เห็น ส่วน PSA 10 คือการ์ดที่ส่งให้ PSA ตรวจแล้วได้คะแนนเต็ม 10 (Gem Mint) ปิดผนึกในเคสพร้อมหมายเลขกำกับ การ์ดใบเดียวกันที่เป็น PSA 10 จึงมักแพงกว่าแบบ Raw หลายเท่า เพราะยืนยันสภาพและกันการปลอมได้ ถ้าจะซื้อเก็บสะสมระยะยาวให้เทียบราคาทั้งสองเกรดก่อนตัดสินใจ",
      },
      {
        question: "การ์ด parallel ต่างจากใบปกติยังไง?",
        answer: `Parallel หรือ Alternate Art คือการ์ดใบเดียวกัน ความสามารถเหมือนกันทุกอย่าง แต่พิมพ์ภาพ/ลายฟอยล์ต่างออกไปและออกยากกว่ามาก ราคาจึงสูงกว่าใบปกติ ${code} ใบนี้เป็น${data.isParallel ? "แบบ parallel" : "ใบพิมพ์ปกติ"} — ถ้ามีเวอร์ชันอื่นของการ์ดใบนี้ จะแสดงไว้ในหัวข้อ "เวอร์ชันอื่น" ด้านล่าง กดเทียบราคาได้เลย`,
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
      answer: `Raw prices come from Yuyu-tei in Japan and graded prices from SNKRDUNK. Meecard rescrapes daily and converts to THB automatically${updated ? `; ${code} was last updated ${updated}` : ""}.`,
    },
    {
      question: "What is the difference between Raw and PSA 10?",
      answer:
        "Raw means ungraded — sold as-is. PSA 10 (Gem Mint) means PSA inspected the card, scored it 10/10 and sealed it in a serialised slab. The same card in a PSA 10 slab usually sells for several times the raw price because condition is certified and counterfeiting is much harder.",
    },
    {
      question: "How is a parallel different from the normal printing?",
      answer: `A parallel (alternate art) is the same card with the same abilities but a different illustration or foil treatment and a much lower pull rate, so it trades higher. ${code} is the ${data.isParallel ? "parallel" : "standard"} printing — any other versions are listed under "Other versions" below.`,
    },
  ];
}

/** Headings + lead copy for the server-rendered price-history block. */
export function buildPriceHistoryCopy(
  lang: Language,
  data: { cardCode: string; latestDate: string | null; pointCount: number },
): { title: string; lead: string; recentTitle: string; windowsTitle: string; emptyText: string } {
  const code = formatCardCodeLabel(data.cardCode);
  if (lang === "TH") {
    return {
      title: `ประวัติราคา ${code}`,
      lead: data.pointCount
        ? `ราคากลางของ ${code} ที่ Meecard เก็บได้จากตลาดญี่ปุ่น${data.latestDate ? ` ล่าสุดเมื่อ ${data.latestDate}` : ""} ใช้ดูว่าราคากำลังขึ้นหรือลงก่อนตัดสินใจซื้อ–ขาย ทุกช่วงคำนวณย้อนหลังจากวันที่อัปเดตล่าสุด`
        : `ยังไม่มีประวัติราคาย้อนหลังของ ${code} มากพอจะสรุปเป็นตาราง ระบบจะเก็บราคาใหม่ให้ทุกวัน`,
      recentTitle: "ราคาล่าสุดรายวัน",
      windowsTitle: "ช่วงราคา 7 / 30 / 90 วัน",
      emptyText: "ยังไม่มีข้อมูลราคาย้อนหลังสำหรับการ์ดใบนี้",
    };
  }
  return {
    title: `${code} price history`,
    lead: data.pointCount
      ? `Market reference prices Meecard collected for ${code}${data.latestDate ? `, latest ${data.latestDate}` : ""}. Every window is measured back from the most recent update.`
      : `Not enough price history for ${code} yet — new prices are collected daily.`,
    recentTitle: "Recent daily prices",
    windowsTitle: "7 / 30 / 90-day range",
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
