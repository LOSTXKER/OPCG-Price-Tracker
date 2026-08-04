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
 * Spelling rule (plan §1): Thai searchers type BOTH "วันพีซ" and "วันพีช".
 * The title uses "วันพีซ"; the description and the market intro paragraph carry
 * "วันพีช" at least once so a single page covers both queries.
 */

/** Structural mirror of `FaqItem` — kept local so `lib/` doesn't import `components/`. */
export type HomeFaqEntry = { question: string; answer: string };

export type HomeSeoLink = { href: string; label: string };

/** Visible part of the <title>; the root layout appends " | Meecard". */
export const HOME_META_TITLE =
  "เช็คราคาการ์ดวันพีซ (One Piece Card Game) อัปเดตทุกวัน";

export const HOME_META_DESCRIPTION =
  "เช็คราคาการ์ดวันพีชทุกใบ ทุกเกรด — ราคากลางอ้างอิง Yuyu-tei อัปเดตทุกวัน พร้อมกราฟราคาย้อนหลัง ราคา PSA 10 พอร์ตสะสม และรายการโปรด ใช้ฟรี";

/** The one visible H1 of the site's pillar page. Must carry "การ์ดวันพีซ". */
export function buildHomeHeroHeading(lang: Language): string {
  switch (lang) {
    case "EN":
      return "One Piece card prices — every card, every grade";
    case "JP":
      return "ワンピースカード相場 — 全カード・全グレード";
    default:
      return "เช็คราคาการ์ดวันพีซ ทุกใบ ทุกเกรด";
  }
}

/**
 * Static, screen-reader-safe version of the rotating typewriter line that sits
 * under the H1 (the animation itself is decorative and stays `aria-hidden`).
 */
export function buildHomeHeroSubtitle(lang: Language): string {
  switch (lang) {
    case "EN":
      return "Live prices · trending cards · PSA 10 prices · your portfolio";
    case "JP":
      return "リアル相場・急上昇カード・PSA 10 相場・ポートフォリオ";
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

  switch (lang) {
    case "EN":
      return {
        heading: "One Piece card prices today",
        body: `Meecard tracks ${cards} One Piece Card Game cards across ${sets} sets. Reference prices come from the Japanese market (Yuyu-tei as the main source), are re-scraped every day and converted to Thai baht automatically. The table below is sorted by highest value — tap a column header to re-sort, or pick a set to narrow it down.`,
      };
    case "JP":
      return {
        heading: "ワンピースカード 本日の相場",
        body: `Meecard は ${sets} 弾・${cards} 枚のワンピースカードの相場を追跡しています。価格は日本市場（主に Yuyu-tei）を参照し、毎日取得してタイバーツへ自動換算しています。下の表は高額順です。列見出しをタップすると並び替え、弾を選ぶと絞り込みできます。`,
      };
    default:
      return {
        heading: "ราคาตลาดการ์ดวันพีซวันนี้",
        body: `Meecard ติดตามราคาการ์ดวันพีซ (One Piece Card Game) ทั้งหมด ${cards} ใบ จาก ${sets} ชุด ราคากลางอ้างอิงจากตลาดญี่ปุ่น โดยมี Yuyu-tei เป็นแหล่งหลัก ดึงข้อมูลใหม่ทุกวันแล้วแปลงเป็นเงินบาทให้อัตโนมัติ ตารางด้านล่างเรียงตามมูลค่าสูงสุด กดที่หัวคอลัมน์เพื่อเรียงใหม่ หรือเลือกชุดการ์ดวันพีชที่สนใจจากช่องเลือกชุด แล้วดูราคาแบบ Raw และ PSA 10 เทียบกันได้ในแถวเดียว`,
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
        heading: "ชุดการ์ดวันพีซล่าสุด",
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
            "The ranking moves every day with the market. The top slots are almost always SEC, Manga Rare and Parallel cards from sets that are out of print. Meecard re-ranks them automatically from live price data — see the “most expensive One Piece cards” page linked below.",
        },
        {
          question: "What is PSA, and where do I get cards graded?",
          answer:
            "PSA is a grading company that inspects a card, scores it 1–10 and seals it in a slab. A PSA 10 usually sells for several times the raw price. Thai collectors normally go through a local submission agent or ship directly to Japan or the US. Meecard shows raw and PSA 10 prices side by side — the rarity guide below explains the grades and rarity codes.",
        },
        {
          question: "Where should I buy One Piece cards?",
          answer:
            "The main options for Thai buyers are local card shops, Facebook trading groups, Shopee/Lazada and ordering straight from Japan. They differ on price, shipping cost and counterfeit risk. Check the reference price here first, then read the buying guide below.",
        },
        {
          question: "How is the reference price calculated?",
          answer:
            "It is based on real selling prices in the Japanese market (Yuyu-tei is the main source), re-scraped daily and converted to Thai baht with a fixed rate. It is a reference for comparison, not a price Meecard sells at. Prices per set are on the sets page below.",
        },
      ];
    case "JP":
      return [
        {
          question: "一番高いワンピースカードは？",
          answer:
            "ランキングは相場とともに毎日入れ替わります。上位はほぼ絶版弾の SEC・マンガレア・パラレルです。Meecard は最新価格から自動で順位を更新しています（下のリンク先ページ）。",
        },
        {
          question: "PSA とは？どこで鑑定に出す？",
          answer:
            "PSA はカードの状態を 1〜10 で採点してスラブに封入する鑑定会社です。PSA 10 は生（Raw）の数倍で取引されることが多くあります。タイでは代行業者経由か、日本・米国へ直送するのが一般的です。Meecard は Raw と PSA 10 を並べて表示します。レアリティの解説は下のガイドへ。",
        },
        {
          question: "ワンピースカードはどこで買う？",
          answer:
            "タイではカードショップ、Facebook の売買グループ、Shopee/Lazada、日本からの直接購入が主な選択肢です。価格・送料・偽物リスクが異なります。まずここで相場を確認し、下の購入ガイドを読んでください。",
        },
        {
          question: "参考価格はどう算出している？",
          answer:
            "日本市場の実売価格（主に Yuyu-tei）を毎日取得し、固定レートでタイバーツに換算しています。比較のための参考値であり、Meecard の販売価格ではありません。弾ごとの価格は下の弾一覧から。",
        },
      ];
    default:
      return [
        {
          question: "การ์ดวันพีซใบไหนแพงที่สุด",
          answer:
            "อันดับการ์ดที่แพงที่สุดขยับทุกวันตามราคาตลาด ใบที่ยืนอยู่หัวตารางเกือบทั้งหมดเป็นการ์ดระดับ SEC, Manga Rare และ Parallel จากชุดเก่าที่เลิกพิมพ์ไปแล้ว Meecard จัดอันดับใหม่ให้อัตโนมัติจากราคาล่าสุด ดูอันดับสดได้ที่หน้า “การ์ดวันพีซที่แพงที่สุด” ในลิงก์ด้านล่าง",
        },
        {
          question: "PSA คืออะไร ส่งเกรดการ์ดวันพีซที่ไหน",
          answer:
            "PSA คือบริษัทรับตรวจสภาพการ์ดแล้วให้คะแนน 1–10 ก่อนซีลลงเคสแข็ง การ์ดที่ได้ PSA 10 มักซื้อขายแพงกว่าการ์ดแบบ Raw หลายเท่า คนไทยส่วนใหญ่ส่งผ่านตัวแทนรับส่งเกรดในไทย หรือส่งตรงไปญี่ปุ่น/สหรัฐฯ Meecard แสดงราคาแบบ Raw และ PSA 10 ให้เทียบกันในแถวเดียว อ่านเรื่องระดับความหายากและการอ่านโค้ดการ์ดต่อได้ที่คู่มือความหายาก ในลิงก์ด้านล่าง",
        },
        {
          question: "ซื้อการ์ดวันพีซที่ไหนดี",
          answer:
            "แหล่งซื้อหลักของคนไทยคือร้านการ์ดหน้าร้าน กลุ่มซื้อขายในเฟซบุ๊ก Shopee/Lazada และการสั่งตรงจากญี่ปุ่น แต่ละทางต่างกันที่ราคา ค่าส่ง และความเสี่ยงเจอของปลอม วิธีที่ปลอดภัยที่สุดคือเช็คราคากลางที่นี่ก่อนแล้วค่อยต่อรอง อ่านวิธีเลือกแหล่งซื้อและวิธีดูการ์ดแท้ได้ที่คู่มือซื้อการ์ด ในลิงก์ด้านล่าง",
        },
        {
          question: "ราคากลางบน Meecard คำนวณจากอะไร",
          answer:
            "ราคากลางอ้างอิงจากราคาขายจริงในตลาดญี่ปุ่น โดยมี Yuyu-tei เป็นแหล่งหลัก ระบบดึงข้อมูลใหม่ทุกวันแล้วแปลงเป็นเงินบาทด้วยอัตราแลกเปลี่ยนคงที่ ตัวเลขนี้เป็นราคาอ้างอิงไว้เทียบก่อนซื้อขาย ไม่ใช่ราคาที่ Meecard ขายเอง อยากดูราคาแยกเป็นรายชุดให้ไปที่หน้ารวมชุดการ์ด ในลิงก์ด้านล่าง",
        },
      ];
  }
}

/**
 * Crawlable destinations for the four long-tail answers above. They live as a
 * real link list under the FAQ because the shared `FaqSection` renders answers
 * as plain text (it takes `answer: string`), so an anchor cannot be embedded in
 * the answer itself without editing a file this area does not own.
 */
export function buildHomeFaqLinks(lang: Language): {
  heading: string;
  links: HomeSeoLink[];
} {
  switch (lang) {
    case "EN":
      return {
        heading: "Read more",
        links: [
          { href: "/opcg/most-expensive", label: "Most expensive One Piece cards" },
          { href: "/guide/rarities", label: "One Piece card rarities (C to SEC)" },
          { href: "/guide/buying", label: "Where to buy One Piece cards" },
          { href: "/opcg/sets", label: "All One Piece card sets" },
        ],
      };
    case "JP":
      return {
        heading: "もっと読む",
        links: [
          { href: "/opcg/most-expensive", label: "高額ワンピースカードランキング" },
          { href: "/guide/rarities", label: "ワンピースカードのレアリティ（C〜SEC）" },
          { href: "/guide/buying", label: "ワンピースカードの買い方" },
          { href: "/opcg/sets", label: "ワンピースカード 全弾一覧" },
        ],
      };
    default:
      return {
        heading: "อ่านต่อจากคำถามด้านบน",
        links: [
          { href: "/opcg/most-expensive", label: "การ์ดวันพีซที่แพงที่สุด" },
          { href: "/guide/rarities", label: "ความหายากการ์ดวันพีซ (C ถึง SEC)" },
          { href: "/guide/buying", label: "ซื้อการ์ดวันพีซที่ไหนดี" },
          { href: "/opcg/sets", label: "ชุดการ์ดวันพีซทั้งหมด" },
        ],
      };
  }
}

/** Name for the ItemList schema wrapping the top rows of the market table. */
export function homeMarketItemListName(count: number): string {
  return `ราคาการ์ดวันพีซ ${count} อันดับมูลค่าสูงสุดวันนี้ — One Piece Card Game`;
}
