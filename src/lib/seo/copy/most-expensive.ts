import type { Language } from "@/lib/i18n"
import { formatJpy, formatThb, jpyToThb } from "@/lib/utils/currency"

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

export function mostExpensiveSubtitle(lang: Language, count: number): string {
  return pick(lang, {
    TH: `จัดอันดับ ${count} ใบจากราคาตลาดล่าสุด ไม่ใช่บทความเก่าที่ไม่อัปเดต`,
    EN: `The top ${count} by latest market price — regenerated from live data, not a frozen article.`,
    JP: `最新の市場価格による上位${count}枚のランキング。`,
  })
}

export function mostExpensiveIntro(
  lang: Language,
  data: {
    rankedCount: number
    pricedCardCount: number
    totalCardCount: number
    setCount: number
    topName: string
    topCode: string
    topPriceJpy: number
    updatedLabel: string | null
  }
): string[] {
  const priceText = `${formatThb(Math.round(jpyToThb(data.topPriceJpy)))} (${formatJpy(data.topPriceJpy)})`
  const updated = data.updatedLabel

  if (lang === "EN") {
    return [
      `This page ranks the ${data.rankedCount} most expensive One Piece Card Game (OPTCG) cards by their latest market price. Right now the top card is ${data.topName} (${data.topCode}) at about ${priceText}.`,
      `The ranking is rebuilt from Meecard's own price data — ${data.pricedCardCount.toLocaleString()} priced cards out of ${data.totalCardCount.toLocaleString()} across ${data.setCount} sets${updated ? `, last updated ${updated}` : ""}. Prices track the Japanese secondary market and are converted to Thai baht for reference.`,
      `Prices move: a card that spikes after a tournament result can drop again weeks later. Use the 30-day change column to see which cards are actually climbing, and open a card to read its full price history.`,
    ]
  }
  if (lang === "JP") {
    return [
      `このページでは、ワンピースカードゲーム（OPTCG）の高額カード上位${data.rankedCount}枚を最新の市場価格順に掲載しています。現在の1位は${data.topName}（${data.topCode}）で、およそ${priceText}です。`,
      `ランキングはMeecardの価格データから再生成されます（${data.setCount}セット・${data.totalCardCount.toLocaleString()}枚中${data.pricedCardCount.toLocaleString()}枚に価格あり${updated ? `、最終更新 ${updated}` : ""}）。`,
      `価格は変動します。30日間の変化率とカード詳細の価格推移をあわせてご確認ください。`,
    ]
  }
  return [
    `หน้านี้จัดอันดับการ์ดวันพีซ (One Piece Card Game / OPTCG) ที่ราคาแพงที่สุด ${data.rankedCount} ใบ เรียงจากราคาตลาดล่าสุด ตอนนี้ใบที่แพงที่สุดคือ ${data.topName} (${data.topCode}) ราคาประมาณ ${priceText}`,
    `อันดับนี้สร้างใหม่จากฐานราคาของ Meecard เอง — มีการ์ดที่มีราคาแล้ว ${data.pricedCardCount.toLocaleString()} ใบ จากทั้งหมด ${data.totalCardCount.toLocaleString()} ใบ ใน ${data.setCount} ชุด${updated ? ` อัปเดตล่าสุด ${updated}` : ""} ราคาอ้างอิงตลาดมือสองญี่ปุ่นและแปลงเป็นเงินบาทให้ดูเทียบง่าย`,
    `ราคาการ์ดวันพีชขึ้นลงตลอด การ์ดที่พุ่งขึ้นหลังผลการแข่งอาจย่อลงในไม่กี่สัปดาห์ ดูคอลัมน์ "เปลี่ยนแปลง 30 วัน" เพื่อแยกว่าใบไหนขึ้นจริง แล้วกดเข้าไปดูกราฟราคาย้อนหลังของแต่ละใบก่อนตัดสินใจซื้อขาย`,
  ]
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
): { question: string; answer: string }[] {
  const priceText = `${formatThb(Math.round(jpyToThb(data.topPriceJpy)))} (${formatJpy(data.topPriceJpy)})`

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
          "They are scraped daily from the Japanese secondary market and converted to Thai baht for reference. They are market reference prices, not offers to sell — always compare with the shop you are actually buying from.",
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
        "เก็บจากตลาดมือสองญี่ปุ่นทุกวัน แล้วแปลงเป็นเงินบาทเพื่อให้เทียบง่าย เป็น 'ราคากลางอ้างอิง' ไม่ใช่ประกาศขาย ก่อนซื้อจริงควรเทียบกับร้านที่คุณจะซื้อด้วยเสมอ",
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
    description: `อันดับการ์ดวันพีชที่ราคาแพงที่สุดตอนนี้ อันดับ 1 คือ ${data.topName} (${data.topCode}) ราคาประมาณ ${priceText} จัดอันดับใหม่จากราคาตลาดจริงทุกวัน พร้อมเปลี่ยนแปลง 30 วันและกราฟราคาย้อนหลังรายใบ`,
  }
}
