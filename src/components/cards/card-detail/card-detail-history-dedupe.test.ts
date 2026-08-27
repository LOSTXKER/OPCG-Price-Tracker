import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

import { getSectionActivationLine } from "./use-card-detail-tabs"

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

describe("card detail price-history composition", () => {
  it("uses the chart as the price-history anchor without rendering the duplicate table", () => {
    const detailSource = readSource("src/components/cards/card-detail.tsx")
    const chartSource = readSource("src/components/cards/card-detail/card-detail-chart-section.tsx")

    expect(detailSource).toContain("<CardDetailChartSection")
    expect(detailSource).not.toContain("CardPriceHistory")
    expect(chartSource).toContain('id="sources"')
    expect(chartSource).toContain('aria-labelledby="price-history-chart-heading"')
    expect(chartSource).toContain('<h2 id="price-history-chart-heading"')
    expect(chartSource).toContain("mt-6 scroll-mt-")
  })

  it("does not derive or serialize table-only history into the client card detail", () => {
    const pageSource = readSource("src/app/cards/[code]/page.tsx")
    const typesSource = readSource("src/components/cards/card-detail/types.ts")

    expect(pageSource).not.toContain("derivePriceHistory")
    expect(pageSource).not.toContain("priceHistory={")
    expect(typesSource).not.toContain("priceHistory?:")
    expect(typesSource).not.toContain("PriceHistorySummary")
  })

  it("feeds the remaining Raw chart from dedicated stored CardPrice rows without a synthetic today point", () => {
    const pageSource = readSource("src/app/cards/[code]/page.tsx")
    const dataSource = readSource("src/lib/data/card-detail.ts")
    const modelSource = readSource("src/components/cards/card-detail/use-card-detail-model.ts")
    const apiSource = readSource("src/app/api/cards/[code]/prices/route.ts")

    expect(pageSource).toContain("getRawPriceHistoryForCard(card.id, freeHistoryDays)")
    expect(pageSource).toContain('getLimits("FREE").priceHistoryDays')
    expect(pageSource).toContain("buildChartData(rawPriceHistory)")
    expect(pageSource).not.toContain("scrapedAt: new Date().toISOString()")
    expect(modelSource).toContain("deriveRawPriceChart(chartRows")
    expect(modelSource).not.toContain("mockGradeSeries")
    expect(dataSource).toContain("getRawPriceHistoryForCard = cache(async (cardId: number, days: number)")
    expect(dataSource).not.toContain("take: 800")
    expect(modelSource).toContain("apiGet<PriceHistoryApiResponse>")
    expect(apiSource).toContain('type: "SELL"')
    expect(apiSource).toContain("effectiveDays")
  })

  it("activates a target at its intentional scroll-margin landing line", () => {
    expect(getSectionActivationLine(100, 124)).toBe(128)
    expect(124 - getSectionActivationLine(100, 124)).toBeLessThanOrEqual(0)
    expect(670 - getSectionActivationLine(646, 124)).toBeGreaterThan(0)
  })
})
