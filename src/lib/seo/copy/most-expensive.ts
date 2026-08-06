import type { Language } from "@/lib/i18n"
import { formatThb, jpyToThb } from "@/lib/utils/currency"

/**
 * Copy for the live "most expensive cards" ranking.
 *
 * SEO copy lives in modules like this one rather than the flat i18n dictionary
 * because every sentence interpolates real data (counts, prices, dates) — which
 * `t()` cannot do — and because a per-area module keeps page-specific prose out
 * of a 2,800-line shared file.
 *
 * Thai is the indexed language (a cookie-less crawler always renders TH), so the
 * TH strings carry the keywords; EN/JP exist for visitors who switch language.
 */

type Copy = Record<Language, string>

function pick(lang: Language, copy: Copy): string {
  return copy[lang] ?? copy.EN
}

export function mostExpensiveTitle(lang: Language): string {
  return pick(lang, {
    TH: "การ์ดวันพีซที่แพงที่สุดตอนนี้",
    EN: "Most Expensive One Piece Cards Right Now",
    JP: "現在もっとも高額なワンピースカード",
  })
}

/**
 * The ONE keyword sentence under the H1 — it sits in the PageHeader
 * description slot (sitewide owner ruling 2026-08-06: H1 → one keyword
 * sentence → content; the old generic subtitle + separate intro paragraph
 * both collapsed into this). Carries the query answer (top card + live
 * price), the keyword, the coverage and the freshness claim; provenance and
 * volatility caveats live in the FAQ below the table.
 */
export function mostExpensiveIntro(
  lang: Language,
  data: {
    rankedCount: number
    totalCardCount: number
    setCount: number
    topName: string
    topCode: string
    topPriceJpy: number
  }
): string {
  const priceText = formatThb(Math.round(jpyToThb(data.topPriceJpy)))

  if (lang === "EN") {
    return `The ${data.rankedCount} most expensive One Piece Card Game (OPTCG) cards — out of ${data.totalCardCount.toLocaleString()} across ${data.setCount} sets — by latest Japanese-market price, updated daily. Right now the top card is ${data.topName} (${data.topCode}) at about ${priceText}.`
  }
  if (lang === "JP") {
    return `ワンピースカードゲーム（OPTCG）全${data.totalCardCount.toLocaleString()}枚・${data.setCount}セットから高額上位${data.rankedCount}枚を日本市場の最新価格順に毎日更新。現在の1位は${data.topName}（${data.topCode}）、およそ${priceText}です。`
  }
  return `จัดอันดับการ์ดวันพีซ (One Piece Card Game / OPTCG) ที่แพงที่สุด ${data.rankedCount} ใบ จากทั้งหมด ${data.totalCardCount.toLocaleString()} ใบ ใน ${data.setCount} ชุด ตามราคาตลาดญี่ปุ่นล่าสุด อัปเดตทุกวัน — อันดับ 1 ตอนนี้คือ ${data.topName} (${data.topCode}) ราคาประมาณ ${priceText}`
}

export function mostExpensiveSectionHeadings(lang: Language) {
  return {
    ranking: pick(lang, {
      TH: "อันดับการ์ดวันพีซที่แพงที่สุด",
      EN: "Most expensive cards ranking",
      JP: "高額カードランキング",
    }),
    byRarity: pick(lang, {
      TH: "ใบที่แพงที่สุดของแต่ละความหายาก",
      EN: "Most expensive card per rarity",
      JP: "レアリティ別の最高額カード",
    }),
    faq: pick(lang, {
      TH: "คำถามที่พบบ่อยเรื่องการ์ดวันพีชราคาแพง",
      EN: "FAQ about expensive One Piece cards",
      JP: "高額カードに関するよくある質問",
    }),
  }
}

export function mostExpensiveTableLabels(lang: Language) {
  return {
    rank: pick(lang, { TH: "อันดับ", EN: "Rank", JP: "順位" }),
    card: pick(lang, { TH: "การ์ด", EN: "Card", JP: "カード" }),
    set: pick(lang, { TH: "ชุด", EN: "Set", JP: "セット" }),
    rarity: pick(lang, { TH: "ความหายาก", EN: "Rarity", JP: "レアリティ" }),
    price: pick(lang, { TH: "ราคาล่าสุด", EN: "Latest price", JP: "最新価格" }),
    change30d: pick(lang, { TH: "เปลี่ยนแปลง 30 วัน", EN: "30-day change", JP: "30日変動" }),
    empty: pick(lang, {
      TH: "ยังไม่มีข้อมูลราคาสำหรับจัดอันดับตอนนี้",
      EN: "No price data available to rank yet.",
      JP: "ランキングに使える価格データがまだありません。",
    }),
  }
}

export function mostExpensiveFaq(
  lang: Language,
  data: { topName: string; topCode: string; topPriceJpy: number; updatedLabel: string | null }
): { question: string; answer: string; link?: { href: string; label: string } }[] {
  const priceText = formatThb(Math.round(jpyToThb(data.topPriceJpy)))

  if (lang === "EN") {
    return [
      {
        question: "Which One Piece card is the most expensive right now?",
        answer: `${data.topName} (${data.topCode}) currently tops the ranking at about ${priceText}. The list is rebuilt from live market data, so the answer changes as prices move.`,
      },
      {
        question: "Why is one card worth so much more than another?",
        answer:
          "Price comes from rarity and print run, tournament demand, alternate/parallel artwork, character popularity, and whether the set is out of print. A card can be rare and still cheap if nobody plays or collects it.",
      },
      {
        question: "Where do these prices come from?",
        answer:
          "Reference prices from the Japanese market, updated daily — not offers to sell. Always compare with the shop you are actually buying from.",
        link: { href: "/about#methodology", label: "How Meecard prices work" },
      },
      {
        question: "Does grading make a card worth more?",
        answer:
          "Usually yes for high-value cards: a PSA 10 copy typically sells well above the raw price, while a played copy sells below it. Open any card to compare its Raw and PSA 10 prices side by side.",
      },
    ]
  }
  if (lang === "JP") {
    return [
      {
        question: "今もっとも高いワンピースカードは？",
        answer: `現在の1位は${data.topName}（${data.topCode}）で、およそ${priceText}です。市場データから再生成されるため順位は変動します。`,
      },
      {
        question: "価格差はどこから生まれますか？",
        answer:
          "レアリティと流通量、大会での需要、パラレル/イラスト違い、キャラクター人気、絶版かどうかで決まります。",
      },
      {
        question: "価格の出どころは？",
        answer:
          "日本の二次流通市場から毎日取得し、参考用にタイバーツへ換算しています。売買のオファーではありません。",
        link: { href: "/about#methodology", label: "価格の算出方法について" },
      },
      {
        question: "鑑定に出すと価値は上がりますか？",
        answer: "高額カードでは一般にPSA 10は未鑑定より高く、傷みのある個体は安くなります。",
      },
    ]
  }
  return [
    {
      question: "การ์ดวันพีซใบไหนแพงที่สุดตอนนี้?",
      answer: `ตอนนี้อันดับ 1 คือ ${data.topName} (${data.topCode}) ราคาประมาณ ${priceText}${data.updatedLabel ? ` อัปเดตล่าสุด ${data.updatedLabel}` : ""} อันดับนี้สร้างใหม่จากราคาตลาดจริง ไม่ได้พิมพ์ตายตัว เลยเปลี่ยนตามราคาที่ขยับ`,
    },
    {
      question: "ทำไมการ์ดบางใบแพงกว่าใบอื่นหลายเท่า?",
      answer:
        "ราคามาจากหลายปัจจัยรวมกัน: ความหายากและจำนวนที่พิมพ์ · ความต้องการในสนามแข่ง · ภาพพิเศษ (parallel / alternate art) · ความดังของตัวละคร · และชุดนั้นเลิกผลิตไปแล้วหรือยัง การ์ดหายากแต่ไม่มีคนเล่นหรือไม่มีคนสะสมก็ราคาไม่ขึ้น",
    },
    {
      question: "ราคาที่เห็นในหน้านี้มาจากไหน?",
      answer:
        "เป็นราคากลางอ้างอิงจากตลาดญี่ปุ่น อัปเดตทุกวัน ไม่ใช่ประกาศขาย ก่อนซื้อจริงควรเทียบกับร้านที่คุณจะซื้อด้วยเสมอ",
      link: { href: "/about#methodology", label: "วิธีคิดราคากลางของ Meecard" },
    },
    {
      question: "ส่งเกรด (PSA) แล้วการ์ดแพงขึ้นไหม?",
      answer:
        "กับการ์ดราคาสูงมักจะใช่ — ใบที่ได้ PSA 10 ปกติขายได้สูงกว่าใบ Raw พอสมควร ส่วนใบที่สภาพไม่ดีจะต่ำกว่าราคากลาง กดเข้าไปในหน้าการ์ดแต่ละใบจะเทียบราคา Raw กับ PSA 10 ให้ดูข้างกัน",
    },
  ]
}

export function mostExpensiveMeta(data: {
  topName: string
  topCode: string
  topPriceJpy: number
  count: number
}) {
  const priceText = `${formatThb(Math.round(jpyToThb(data.topPriceJpy)))}`
  return {
    title: `การ์ดวันพีซที่แพงที่สุด ${data.count} อันดับ — อัปเดตทุกวัน`,
    // SEO round 2: dropped "กราฟราคาย้อนหลังรายใบ" — this ranking page has no
    // per-card price chart (that lives on /opcg/cards/[code]), so the claim
    // overclaimed what the snippet's landing page actually shows. Also
    // shortened so it stays ≤160 chars with real (longer) card names.
    description: `อันดับการ์ดวันพีชแพงสุดตอนนี้ อันดับ 1 ${data.topName} (${data.topCode}) ราคาประมาณ ${priceText} อัปเดตจากราคาตลาดจริงทุกวัน พร้อมเปลี่ยนแปลง 30 วัน`,
  }
}
