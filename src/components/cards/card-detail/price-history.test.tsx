import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  buildCardFaq,
  buildCardIntro,
  buildCardSeoDescription,
  buildCardSeoTitle,
  formatCardCodeLabel,
  type CardSeoData,
} from "@/lib/seo/copy/card"

import { derivePriceHistory } from "./price-history"
import { CardPriceHistory } from "./price-history-table"

function day(offset: number) {
  return new Date(Date.UTC(2026, 6, 1 + offset, 3, 0, 0)).toISOString()
}

const rows = Array.from({ length: 12 }, (_, i) => ({
  scrapedAt: day(i),
  priceJpy: 1_000 + i * 100,
  priceThb: null,
  source: "YUYUTEI",
  gradeCondition: null,
}))

const seo: CardSeoData = {
  cardCode: "OP01-003",
  nameTh: "มังกี้ ดี. ลูฟี่",
  nameLatin: "Monkey.D.Luffy",
  rarity: "SR",
  isParallel: false,
  setCode: "OP01",
  setName: "Romance Dawn",
  latestPriceJpy: 2_100,
  latestPriceThb: null,
  priceChange30d: 12.5,
  priceScrapedAt: day(11),
}

describe("derivePriceHistory", () => {
  it("keeps one raw point per UTC day, newest first, and computes 7/30/90-day windows", () => {
    const history = derivePriceHistory(rows)

    expect(history.latestIso).toBe(day(11))
    expect(history.points).toHaveLength(10)
    expect(history.points[0]!.priceJpy).toBe(2_100)
    expect(history.points[0]!.dateIso).toBe(day(11))
    // 2100 vs 2000 = +5%
    expect(history.points[0]!.changePct).toBe(5)
    // Derived THB (no priceThb column in the DB) — 2100 * 0.21
    expect(history.points[0]!.priceThb).toBe(441)

    const window7 = history.windows.find((w) => w.days === 7)!
    expect(window7.lowJpy).toBe(1_400)
    expect(window7.highJpy).toBe(2_100)
    expect(window7.avgJpy).toBe(1_750)

    const window30 = history.windows.find((w) => w.days === 30)!
    expect(window30.count).toBe(12)
    expect(window30.lowJpy).toBe(1_000)
  })

  it("collapses several observations on the same UTC day to the newest one", () => {
    const history = derivePriceHistory([
      { scrapedAt: "2026-07-01T01:00:00.000Z", priceJpy: 900, priceThb: null, source: "YUYUTEI", gradeCondition: null },
      { scrapedAt: "2026-07-01T22:00:00.000Z", priceJpy: 950, priceThb: null, source: "YUYUTEI", gradeCondition: null },
    ])

    expect(history.points).toHaveLength(1)
    expect(history.points[0]!.priceJpy).toBe(950)
  })

  it("ignores graded rows so the raw reference series stays clean", () => {
    const history = derivePriceHistory([
      { scrapedAt: day(0), priceJpy: 1_000, priceThb: null, source: "YUYUTEI", gradeCondition: null },
      { scrapedAt: day(1), priceJpy: 90_000, priceThb: null, source: "SNKRDUNK", gradeCondition: "PSA 10" },
    ])

    expect(history.points).toHaveLength(1)
    expect(history.points[0]!.priceJpy).toBe(1_000)
  })

  it("returns an empty summary when there is nothing to show", () => {
    expect(derivePriceHistory([])).toEqual({ points: [], windows: [], latestIso: null })
  })
})

describe("CardPriceHistory (server-rendered)", () => {
  const markup = renderToStaticMarkup(
    <CardPriceHistory cardCode="OP01-003" history={derivePriceHistory(rows)} lang="TH" />,
  )

  it("puts real dated price rows in the initial HTML as tables", () => {
    expect(markup).toContain("<table")
    expect(markup).toContain("ประวัติราคา OP01-003")
    expect(markup).toContain("ช่วงราคา 7 / 30 / 90 วัน")
    // A real, dated observation — not a chart, not a client fetch.
    expect(markup).toContain("11 ก.ค. 2026")
    expect(markup).toContain("441 ฿")
    expect(markup).toContain("¥2,100")
  })

  it("never renders fabricated-sample labelling", () => {
    expect(markup).not.toContain("Sample")
    expect(markup).not.toContain("ตัวอย่าง")
  })

  it("ships a list fallback under sm instead of a horizontally scrolling table", () => {
    expect(markup).toContain("sm:hidden")
    expect(markup).toContain("hidden sm:block")
    expect(markup).not.toContain("overflow-x-auto")
  })
})

describe("card SEO copy", () => {
  it("puts the card code in a Thai title that fits the ~60-char budget", () => {
    const title = buildCardSeoTitle("TH", seo)

    expect(title).toContain("OP01-003")
    expect(title.startsWith("ราคาการ์ดวันพีซ")).toBe(true)
    expect(title.length).toBeLessThanOrEqual(60)
    expect(title).not.toContain("| Meecard")
  })

  it("keeps a long name whole and drops the optional segments instead", () => {
    const longName = "เอ็ดเวิร์ด นิวเกต (ไวท์เบียร์ด) พาราเรล"
    const title = buildCardSeoTitle("TH", {
      ...seo,
      cardCode: "OP09-119",
      nameTh: longName,
      rarity: "SEC",
      setName: "Emperors in the New World",
    })

    // Cutting the name mid-word ("…เอ็ดเวิร์ด นิวเก…") would destroy the exact
    // term people search for. Google indexes the whole title and only truncates
    // the SERP display, so overshooting the display budget is the cheaper loss.
    expect(title).toContain(longName)
    expect(title).not.toContain("…")
    expect(title).toContain("OP09-119")
    expect(title.startsWith("ราคาการ์ดวันพีซ")).toBe(true)
    // Rarity and set are the segments that give way.
    expect(title).not.toContain("(SEC)")
    expect(title).not.toContain("Emperors in the New World")
  })

  it("humanises the parallel code suffix everywhere it is shown to a reader", () => {
    expect(formatCardCodeLabel("OP01-003")).toBe("OP01-003")
    expect(formatCardCodeLabel("EB01-001_p1")).toBe("EB01-001 (Parallel 1)")

    const parallel: CardSeoData = { ...seo, cardCode: "EB01-001_p1", isParallel: true }
    expect(buildCardSeoTitle("TH", parallel)).toContain("EB01-001 (Parallel 1)")
    expect(buildCardSeoTitle("TH", parallel).length).toBeLessThanOrEqual(60)
    expect(buildCardIntro("TH", parallel).join(" ")).toContain("EB01-001 (Parallel 1)")
    expect(buildCardFaq("TH", parallel)[3]!.answer).toContain("แบบ parallel")
  })

  it("covers both Thai spellings across title + description", () => {
    const title = buildCardSeoTitle("TH", seo)
    const description = buildCardSeoDescription("TH", seo)

    expect(title).toContain("วันพีซ")
    expect(description).toContain("วันพีช")
  })

  it("templates the description from real numbers", () => {
    const description = buildCardSeoDescription("TH", seo)

    expect(description).toContain("441 ฿")
    expect(description).toContain("¥2,100")
    expect(description).toContain("+12.5%")
    expect(description).toContain("Romance Dawn")
    expect(description).toContain("อัปเดตทุกวัน")
  })

  it("writes one short Thai intro line built from this card's own data", () => {
    const paragraphs = buildCardIntro("TH", seo)
    const intro = paragraphs.join(" ")

    expect(paragraphs).toHaveLength(1)
    expect(intro).toContain("มังกี้ ดี. ลูฟี่")
    expect(intro).toContain("Monkey.D.Luffy")
    expect(intro).toContain("OP01-003")
    expect(intro).toContain("SR")
    expect(intro).toContain("Romance Dawn")
    expect(intro).toContain("Yuyu-tei")
    // Second Thai spelling lives in the body copy.
    expect(intro).toContain("วันพีช")
    // Owner-specified length: one line, not a paragraph block. Measured on the
    // worst case that production actually renders — a parallel printing (its
    // code expands to "OP13-118 (Parallel 3)") in a set with a long name. The
    // name appears once because Card.nameTh mirrors the Latin name for every
    // row in this database.
    const worstCase = buildCardIntro("TH", {
      ...seo,
      nameTh: "Monkey.D.Luffy",
      cardCode: "OP13-118_p3",
      isParallel: true,
      rarity: "P-SEC",
      setName: "Carrying on His Will",
    }).join(" ")

    expect(worstCase.length).toBeLessThanOrEqual(185)
    // formatCardCodeLabel already emits "(Parallel 3)" — the copy must not wrap
    // it in another pair of brackets or repeat the word.
    expect(worstCase).not.toContain("((")
    expect(worstCase).not.toContain("(Parallel 3)) ")
    expect(worstCase.match(/parallel/gi) ?? []).toHaveLength(1)
  })

  it("does not restate figures the page already renders", () => {
    // Price, 30-day move and the update date all appear on screen around this
    // copy; repeating them made it a wall of text between the card name and the
    // number people came for. The meta description and FAQ still carry them.
    const intro = buildCardIntro("TH", seo).join(" ")

    expect(intro).not.toContain("441 ฿")
    expect(intro).not.toContain("¥2,100")
    expect(intro).not.toContain("+12.5%")
    expect(intro).not.toContain("12 ก.ค. 2026")
  })

  it("builds a four-question per-card FAQ from the card's own data", () => {
    const faq = buildCardFaq("TH", seo)

    expect(faq).toHaveLength(4)
    expect(faq[0]!.question).toBe("การ์ด มังกี้ ดี. ลูฟี่ (OP01-003) ราคาเท่าไหร่?")
    expect(faq[0]!.answer).toContain("441 ฿")
    expect(faq[1]!.answer).toContain("Yuyu-tei")
    expect(faq[2]!.question).toContain("PSA 10")
    expect(faq[3]!.answer).toContain("ใบพิมพ์ปกติ")
  })

  it("degrades honestly when a card has no reference price", () => {
    const priceless: CardSeoData = {
      ...seo,
      latestPriceJpy: null,
      latestPriceThb: null,
      priceChange30d: null,
    }

    expect(buildCardIntro("TH", priceless).join(" ")).toContain("ยังไม่มีราคากลางล่าสุด")
    expect(buildCardSeoDescription("TH", priceless)).toContain("ยังไม่มีราคากลางล่าสุด")
    expect(buildCardFaq("TH", priceless)[0]!.answer).toContain("ยังไม่มีราคากลางล่าสุด")
  })
})
