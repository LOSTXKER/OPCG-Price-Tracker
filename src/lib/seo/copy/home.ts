import type { Language } from "@/lib/i18n";
import { formatCount } from "@/lib/utils/currency";

/**
 * SEO copy for the home page (the "price pillar" — doc/seo-content-plan.md §3.1).
 *
 * Why this lives here and not in the flat `t()` dictionary: every string below
 * either interpolates live data (card counts, set counts) or is a full
 * paragraph/FAQ answer that only the home page uses. The dictionary is shared
 * across the whole app and cannot interpolate.
 *
 * Thai is the language that matters (the site is Thai-first — plan §3.8.8);
 * EN is a reasonable translation and JP mirrors EN so nothing renders blank.
 *
 * Spelling rule (plan §1, flipped 2026-08-08): Thai searchers type BOTH
 * "วันพีช" and "วันพีซ" — and "วันพีช" wins Google suggest. The title uses
 * "วันพีช"; the description carries "วันพีซ" at least once so a single page
 * covers both queries.
 */

/** Structural mirror of `FaqItem` — kept local so `lib/` doesn't import `components/`. */
export type HomeFaqEntry = {
  question: string;
  answer: string;
  /** Read-more destination rendered inside the answer body (FaqSection). */
  link?: HomeSeoLink;
};

export type HomeSeoLink = { href: string; label: string };

// SEO round 2: the old title ("เช็คราคาการ์ดวันพีซ (One Piece Card Game)
// อัปเดตทุกวัน") ran to 64 chars with the " | Meecard" suffix — over the
// ~60-char SERP cutoff. "One Piece Card Game" already carries the English
// name in HOME_META_DESCRIPTION and the H2 body (buildHomeMarketIntro), so
// dropping it from the title costs nothing and buys back the room for the
// higher-intent "ทุกใบ ทุกเกรด" phrase.
/** Visible part of the <title>; the root layout appends " | Meecard". */
export const HOME_META_TITLE = "เช็คราคาการ์ดวันพีช ทุกใบ ทุกเกรด อัปเดตทุกวัน";

// Owner decision (2026-08-06): no source-brand names anywhere on the home
// surface except the one FAQ answer that directly answers "how is the
// reference price calculated?" (the long-tail entry below). "ตลาดญี่ปุ่น"
// carries the trust signal; the brand name only advertises someone else's
// shop on our own search snippet.
export const HOME_META_DESCRIPTION =
  "เช็คราคาการ์ดวันพีซทุกใบ ทุกเกรด — ราคากลางอ้างอิงตลาดญี่ปุ่น อัปเดตทุกวัน พร้อมกราฟราคาย้อนหลัง ราคา PSA 10 พอร์ตสะสม และรายการโปรด ใช้ฟรี";

/** The one visible H1 of the site's pillar page. Must carry "การ์ดวันพีช". */
export function buildHomeHeroHeading(lang: Language): string {
  switch (lang) {
    case "EN":
      return "One Piece card prices — every card, every grade";
    case "JP":
      return "ワンピースカード相場 — 全カード・全グレード";
    default:
      return "เช็คราคาการ์ดวันพีช ทุกใบ ทุกเกรด";
  }
}

/**
 * Static, screen-reader-safe version of the rotating typewriter line that sits
 * under the H1 (the animation itself is decorative and stays `aria-hidden`).
 */
export function buildHomeHeroSubtitle(lang: Language): string {
  switch (lang) {
    // "Daily", not "live" — prices update once a day (same honesty rule as
    // the seoFeat* strings, SEO round 2/3).
    case "EN":
      return "Daily prices · trending cards · PSA 10 prices · your portfolio";
    case "JP":
      return "毎日更新の相場・急上昇カード・PSA 10 相場・ポートフォリオ";
    default:
      return "ราคากลาง · การ์ดมาแรง · ราคา PSA 10 · พอร์ตการ์ด";
  }
}

/** H2 + context sentences that sit directly above the market table. */
export function buildHomeMarketIntro(
  lang: Language,
  data: { totalCards: number; totalSets: number }
): { heading: string; body: string } {
  const cards = formatCount(data.totalCards);
  const sets = formatCount(data.totalSets);

  // ONE sentence (owner ruling เบส 2026-08-07, same rule as the set pages):
  // the old three-clause paragraph restated the methodology (the "อัปเดต
  // ล่าสุด" line above + /about#methodology own that) and narrated how to use
  // the table that sits directly below it. Counts + OPTCG (the abbreviation
  // serious players search) stay; the body spells it "วันพีช" like every
  // visible surface — the "วันพีซ" carrier is HOME_META_DESCRIPTION.
  switch (lang) {
    case "EN":
      return {
        heading: "One Piece card prices today",
        body: `Meecard tracks ${cards} One Piece Card Game (OPTCG) cards across ${sets} sets, priced daily from the Japanese market.`,
      };
    case "JP":
      return {
        heading: "ワンピースカード 本日の相場",
        body: `Meecard は ${sets} 弾・${cards} 枚のワンピースカードの相場を毎日更新しています。`,
      };
    default:
      return {
        heading: "ราคาตลาดการ์ดวันพีชวันนี้",
        body: `Meecard ติดตามราคาการ์ดวันพีช (One Piece Card Game / OPTCG) ทั้งหมด ${cards} ใบ จาก ${sets} ชุด อัปเดตทุกวันจากตลาดญี่ปุ่น`,
      };
  }
}

/** Heading + helper copy for the crawlable "latest sets" link strip. */
export function buildHomeSetStripCopy(lang: Language): {
  heading: string;
  description: string;
  allLabel: string;
} {
  switch (lang) {
    case "EN":
      return {
        heading: "Latest One Piece sets",
        description: "Browse every card price set by set.",
        allLabel: "All sets",
      };
    case "JP":
      return {
        heading: "最新のワンピースカード弾",
        description: "弾ごとに全カードの相場を確認できます。",
        allLabel: "すべての弾",
      };
    default:
      return {
        heading: "ชุดการ์ดวันพีชล่าสุด",
        description: "เลือกดูราคาการ์ดทุกใบ แยกตามชุด",
        allLabel: "ดูชุดทั้งหมด",
      };
  }
}

/**
 * Long-tail questions taken from real Thai search behaviour (plan §3.1).
 * Appended after the seven evergreen FAQ entries in the shared dictionary.
 */
export function buildHomeLongTailFaq(lang: Language): HomeFaqEntry[] {
  switch (lang) {
    case "EN":
      return [
        {
          question: "Which One Piece card is the most expensive?",
          answer:
            "The ranking moves every day with the market. The top slots are almost always SEC, Manga Rare and Parallel cards from sets that are out of print. Meecard re-ranks them automatically from live price data.",
          link: { href: "/opcg/most-expensive", label: "Most expensive One Piece cards" },
        },
        {
          question: "What is PSA, and where do I get cards graded?",
          answer:
            "PSA is a grading company that inspects a card, scores it 1–10 and seals it in a slab. A PSA 10 usually sells for several times the raw price. Thai collectors normally go through a local submission agent or ship directly to Japan or the US. Meecard shows raw and PSA 10 prices side by side.",
          link: { href: "/guide/rarities", label: "One Piece card rarities (C to SEC)" },
        },
        {
          question: "Where should I buy One Piece cards?",
          answer:
            "The main options for Thai buyers are local card shops, Facebook trading groups, Shopee/Lazada and ordering straight from Japan. They differ on price, shipping cost and counterfeit risk. Check the reference price here first, then negotiate.",
          link: { href: "/guide/buying", label: "Where to buy One Piece cards" },
        },
        {
          question: "How is the reference price calculated?",
          answer:
            "It is based on real selling prices in the Japanese market, re-scraped daily and converted to Thai baht with a fixed rate. It is a reference for comparison, not a price Meecard sells at.",
          // Site-wide rule (SEO round 1): methodology has ONE home —
          // /about#methodology. Every other page answers in a sentence and
          // links there instead of restating it.
          link: { href: "/about#methodology", label: "How Meecard prices work" },
        },
      ];
    case "JP":
      return [
        {
          question: "一番高いワンピースカードは？",
          answer:
            "ランキングは相場とともに毎日入れ替わります。上位はほぼ絶版弾の SEC・マンガレア・パラレルです。Meecard は最新価格から自動で順位を更新しています。",
          link: { href: "/opcg/most-expensive", label: "高額ワンピースカードランキング" },
        },
        {
          question: "PSA とは？どこで鑑定に出す？",
          answer:
            "PSA はカードの状態を 1〜10 で採点してスラブに封入する鑑定会社です。PSA 10 は生（Raw）の数倍で取引されることが多くあります。タイでは代行業者経由か、日本・米国へ直送するのが一般的です。Meecard は Raw と PSA 10 を並べて表示します。",
          link: { href: "/guide/rarities", label: "ワンピースカードのレアリティ（C〜SEC）" },
        },
        {
          question: "ワンピースカードはどこで買う？",
          answer:
            "タイではカードショップ、Facebook の売買グループ、Shopee/Lazada、日本からの直接購入が主な選択肢です。価格・送料・偽物リスクが異なります。まずここで相場を確認してから交渉しましょう。",
          link: { href: "/guide/buying", label: "ワンピースカードの買い方" },
        },
        {
          question: "参考価格はどう算出している？",
          answer:
            "日本市場の実売価格を毎日取得し、固定レートでタイバーツに換算しています。比較のための参考値であり、Meecard の販売価格ではありません。",
          link: { href: "/about#methodology", label: "価格の算出方法について" },
        },
      ];
    default:
      return [
        {
          question: "การ์ดวันพีชใบไหนแพงที่สุด",
          answer:
            "อันดับการ์ดที่แพงที่สุดขยับทุกวันตามราคาตลาด ใบที่ยืนอยู่หัวตารางเกือบทั้งหมดเป็นการ์ดระดับ SEC, Manga Rare และ Parallel จากชุดเก่าที่เลิกพิมพ์ไปแล้ว Meecard จัดอันดับใหม่ให้อัตโนมัติจากราคาล่าสุด",
          link: { href: "/opcg/most-expensive", label: "การ์ดวันพีชที่แพงที่สุด" },
        },
        {
          question: "PSA คืออะไร ส่งเกรดการ์ดวันพีชที่ไหน",
          answer:
            "PSA คือบริษัทรับตรวจสภาพการ์ดแล้วให้คะแนน 1–10 ก่อนซีลลงเคสแข็ง การ์ดที่ได้ PSA 10 มักซื้อขายแพงกว่าการ์ดแบบ Raw หลายเท่า คนไทยส่วนใหญ่ส่งผ่านตัวแทนรับส่งเกรดในไทย หรือส่งตรงไปญี่ปุ่น/สหรัฐฯ Meecard แสดงราคาแบบ Raw และ PSA 10 ให้เทียบกันในแถวเดียว",
          link: { href: "/guide/rarities", label: "ความหายากการ์ดวันพีช (C ถึง SEC)" },
        },
        {
          question: "ซื้อการ์ดวันพีชที่ไหนดี",
          answer:
            "แหล่งซื้อหลักของคนไทยคือร้านการ์ดหน้าร้าน กลุ่มซื้อขายในเฟซบุ๊ก Shopee/Lazada และการสั่งตรงจากญี่ปุ่น แต่ละทางต่างกันที่ราคา ค่าส่ง และความเสี่ยงเจอของปลอม วิธีที่ปลอดภัยที่สุดคือเช็คราคากลางที่นี่ก่อนแล้วค่อยต่อรอง",
          link: { href: "/guide/buying", label: "คู่มือซื้อการ์ดวันพีช" },
        },
        {
          question: "ราคากลางบน Meecard คำนวณจากอะไร",
          answer:
            "ราคากลางอ้างอิงจากราคาขายจริงในตลาดญี่ปุ่น ระบบดึงข้อมูลใหม่ทุกวันแล้วแปลงเป็นเงินบาทด้วยอัตราแลกเปลี่ยนคงที่ ตัวเลขนี้เป็นราคาอ้างอิงไว้เทียบก่อนซื้อขาย ไม่ใช่ราคาที่ Meecard ขายเอง",
          link: { href: "/about#methodology", label: "วิธีคิดราคากลางของ Meecard" },
        },
      ];
  }
}

/** Name for the ItemList schema wrapping the top rows of the market table. */
export function homeMarketItemListName(count: number): string {
  return `ราคาการ์ดวันพีช ${count} อันดับมูลค่าสูงสุดวันนี้ — One Piece Card Game`;
}
