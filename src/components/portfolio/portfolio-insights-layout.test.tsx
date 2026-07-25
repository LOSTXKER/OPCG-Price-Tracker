import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ALL_GAMES } from "@/lib/game/constants"
import { t } from "@/lib/i18n"
import { MASKED } from "@/lib/constants/ui"
import {
  formatDisplayValue,
  jpyToDisplayValue,
} from "@/lib/utils/currency"
import type {
  AssetRow,
  GameBreakdown,
  HistoryPoint,
  PortfolioStats,
} from "@/lib/types/portfolio"

import { PortfolioSummary } from "./portfolio-hero-panel"
import { PortfolioInsights } from "./portfolio-insights"

vi.mock("@/lib/env", () => ({
  clientEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://meecard.test" }),
}))

const stats: PortfolioStats = {
  estimatedValueJpy: 1_000,
  recordedCostJpy: 600,
  totalCopyCount: 1,
  valuedCopyCount: 1,
  costedCopyCount: 1,
  valuationComplete: true,
  performanceComplete: true,
  pnlJpy: 400,
  roiPct: 66.67,
  totalValueJpy: 1_000,
  totalCostJpy: 600,
  unrealizedPnl: 400,
  unrealizedPnlPercent: 66.67,
  bestPerformer: null,
  worstPerformer: null,
}

const asset: AssetRow = {
  itemId: 1,
  cardId: 1,
  cardCode: "OP01-001",
  baseCode: "OP01-001",
  nameJp: "ゾロ",
  nameEn: "Roronoa Zoro",
  rarity: "R",
  imageUrl: null,
  quantity: 1,
  lots: [],
  lotCount: 1,
  recordedCostJpy: 600,
  costedCopyCount: 1,
  purchasePrice: 600,
  currentPrice: 1_000,
  currentPriceThb: null,
  priceChange24h: 10,
  priceChange7d: null,
  condition: "NM",
  notes: null,
  game: null,
}

const breakdown: GameBreakdown = {
  game: null,
  estimatedValueJpy: 1_000,
  recordedCostJpy: 600,
  totalCopyCount: 1,
  valuedCopyCount: 1,
  costedCopyCount: 1,
  valuationComplete: true,
  performanceComplete: true,
  pnlJpy: 400,
  roiPct: 66.67,
  valueJpy: 1_000,
  costJpy: 600,
  pnl: 400,
  pnlPercent: 66.67,
  count: 1,
}

function historyPoint(date: string, value = 1_000): HistoryPoint {
  return {
    label: date.slice(5, 10),
    date,
    value,
    cost: 600,
    netInvested: 600,
    cardCount: 1,
    totalCopyCount: 1,
    costedCopyCount: 1,
    isInflow: false,
  }
}

function renderInsights(
  overrides: Partial<Parameters<typeof PortfolioInsights>[0]> = {},
) {
  return renderToStaticMarkup(
    <PortfolioInsights
      history={[]}
      assets={[asset]}
      allocation={[
        {
          name: "Roronoa Zoro",
          value: 1_000,
          percent: 100,
          cardCode: "OP01-001",
          imageUrl: "/images/zoro-card.jpg",
        },
      ]}
      gameBreakdown={[breakdown]}
      stats={stats}
      gameFilter={ALL_GAMES}
      onGameSelect={() => undefined}
      {...overrides}
    />,
  )
}

describe("Portfolio Insights layout", () => {
  it("keeps the Overview hero separate from the ordered Insights dashboard", () => {
    const overview = renderToStaticMarkup(<PortfolioSummary stats={stats} />)
    const insights = renderInsights({
      history: [
        historyPoint("2026-07-22T06:00:00.000Z", 900),
        historyPoint("2026-07-23T06:00:00.000Z"),
      ],
    })
    const kpis = insights.indexOf('data-slot="portfolio-insights-kpis"')
    const history = insights.indexOf('data-slot="portfolio-insights-history"')
    const allocation = insights.indexOf(
      'data-slot="portfolio-insights-allocation"',
    )

    expect(overview).toContain('data-slot="portfolio-summary"')
    expect(overview).toContain("surface-1 hairline rounded-lg")
    expect(overview).toContain("portfolio-financial-gradient")
    expect(overview).not.toContain('data-slot="portfolio-insights"')
    expect(insights).not.toContain('data-slot="portfolio-summary"')
    expect(insights).not.toContain("portfolio-financial-gradient")
    expect(insights.match(/data-slot="portfolio-insights-kpi"/g)).toHaveLength(3)
    expect(kpis).toBeGreaterThanOrEqual(0)
    expect(history).toBeGreaterThan(kpis)
    expect(allocation).toBeGreaterThan(history)
    expect(insights).not.toMatch(
      /data-slot="portfolio-insights-(?:value|structure|movers)"/,
    )
    expect(insights).not.toContain(`>${t("TH", "portfolioValue")}<`)
    expect(insights).toContain(t("TH", "averageCostPerCard"))
    expect(insights).toContain(t("TH", "largestPortfolioShare"))
    expect(insights).toContain(`1 ${t("TH", "cardCopiesShort")}`)
  })

  it("hides history until two different calendar days are available", () => {
    const empty = renderInsights()
    const sameDay = renderInsights({
      history: [
        historyPoint("2026-07-22T06:00:00.000Z", 900),
        historyPoint("2026-07-22T12:00:00.000Z"),
      ],
    })
    const twoDays = renderInsights({
      history: [
        historyPoint("2026-07-22T06:00:00.000Z", 900),
        historyPoint("2026-07-23T06:00:00.000Z"),
      ],
    })

    expect(empty).not.toContain('data-slot="portfolio-insights-history"')
    expect(sameDay).not.toContain('data-slot="portfolio-insights-history"')
    expect(twoDays).toContain('data-slot="portfolio-insights-history"')
  })

  it("labels a game-scoped current value without showing aggregate history", () => {
    const markup = renderInsights({
      gameFilter: "opcg",
      scopeLabel: "One Piece",
      history: [
        historyPoint("2026-07-22T06:00:00.000Z", 900),
        historyPoint("2026-07-23T06:00:00.000Z"),
      ],
    })

    expect(markup).toContain("One Piece")
    expect(markup).not.toContain('data-slot="portfolio-insights-history"')
    expect(markup).not.toContain(t("TH", "showFullPortfolio"))
  })

  it("presents a recorded zero cost as free instead of missing data", () => {
    const markup = renderInsights({
      stats: {
        ...stats,
        recordedCostJpy: 0,
        totalCostJpy: 0,
      },
    })

    expect(markup).toContain(t("TH", "portfolioFreeCost"))
    expect(markup).toContain(
      t("TH", "costCoverage")
        .replace("{known}", "1")
        .replace("{total}", "1"),
    )
  })

  it("masks money across the KPI and allocation surfaces without hiding shares", () => {
    const markup = renderInsights({ hideBalance: true })
    const visibleValue = formatDisplayValue(
      jpyToDisplayValue(stats.recordedCostJpy, "THB"),
      "THB",
    )

    expect(markup.match(new RegExp(MASKED, "g"))?.length).toBeGreaterThanOrEqual(2)
    expect(markup).not.toContain(visibleValue)
    expect(markup).toContain("100.0%")
    expect(markup).toContain("100%")
    expect(markup).not.toContain("66.67%")
    expect(markup).not.toContain("+66.7%")
  })

  it("shows card artwork beside the allocation rows", () => {
    const markup = renderInsights()

    expect(markup).toContain('data-slot="portfolio-allocation-card-image"')
    expect(markup).toContain('alt="Roronoa Zoro"')
    expect(markup).toContain("%2Fimages%2Fzoro-card.jpg")
  })

  it("marks partial valuation coverage without presenting aggregate returns", () => {
    const partialStats: PortfolioStats = {
      ...stats,
      estimatedValueJpy: 1_000,
      recordedCostJpy: 600,
      totalCopyCount: 2,
      valuedCopyCount: 1,
      costedCopyCount: 1,
      valuationComplete: false,
      performanceComplete: false,
      pnlJpy: null,
      roiPct: null,
      totalValueJpy: 1_000,
      totalCostJpy: 600,
      unrealizedPnl: null,
      unrealizedPnlPercent: null,
    }
    const unpricedAsset: AssetRow = {
      ...asset,
      itemId: 2,
      cardId: 2,
      cardCode: "OP01-002",
      baseCode: "OP01-002",
      currentPrice: null,
      purchasePrice: null,
      recordedCostJpy: 0,
      costedCopyCount: 0,
      priceChange24h: null,
    }
    const markup = renderInsights({
      assets: [asset, unpricedAsset],
      stats: partialStats,
    })

    expect(markup).not.toContain(`>${t("TH", "portfolioValue")}<`)
    expect(markup).toContain(`2 ${t("TH", "cardCopiesShort")}`)
    expect(markup).toContain(
      t("TH", "costCoverage")
        .replace("{known}", "1")
        .replace("{total}", "2"),
    )
    expect(markup.match(/1 \/ 2 · 50%/g)).toHaveLength(2)
    expect(markup).toContain(
      `${t("TH", "dataCoverage")} · 1 / 2 · 50%`,
    )
    expect(markup).not.toContain(t("TH", "unrealizedPnl"))
    expect(markup).not.toContain(t("TH", "roi"))
    expect(markup).not.toContain("66.67%")
    expect(markup).not.toContain("+66.7%")
  })
})
