import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { HistoryPoint, PortfolioStats } from "@/lib/types/portfolio"

import { PortfolioScrubChart } from "./portfolio-scrub-chart"

function stats(overrides: Partial<PortfolioStats> = {}): PortfolioStats {
  return {
    estimatedValueJpy: 0,
    recordedCostJpy: 0,
    totalCopyCount: 0,
    valuedCopyCount: 0,
    costedCopyCount: 0,
    valuationComplete: false,
    performanceComplete: false,
    pnlJpy: null,
    roiPct: null,
    totalValueJpy: 0,
    totalCostJpy: 0,
    unrealizedPnl: null,
    unrealizedPnlPercent: null,
    bestPerformer: null,
    worstPerformer: null,
    ...overrides,
  }
}

describe("PortfolioScrubChart sparse history", () => {
  it("shows a compact explanation without disabled range controls or a fake zero", () => {
    const markup = renderToStaticMarkup(
      <PortfolioScrubChart data={[]} stats={stats()} />,
    )

    expect(markup).toContain('data-slot="portfolio-chart-sparse"')
    expect(markup).not.toContain('data-slot="portfolio-chart-range"')
    expect(markup).not.toContain('role="radio"')
    expect(markup).not.toContain('disabled=""')
    expect(markup).not.toContain("overflow-x-auto")
    expect(markup).not.toContain("h-44")
    expect(markup).not.toContain("sm:h-56")
    expect(markup).not.toContain('data-slot="portfolio-chart-live-point"')
    expect(markup).not.toContain("border-dashed")
  })

  it("shows one honest live point without inventing a line", () => {
    const markup = renderToStaticMarkup(
      <PortfolioScrubChart
        data={[]}
        stats={stats({
          estimatedValueJpy: 1_250,
          totalValueJpy: 1_250,
          totalCopyCount: 1,
          valuedCopyCount: 1,
          valuationComplete: true,
        })}
      />,
    )

    expect(markup).toContain('data-slot="portfolio-chart-live-point"')
    expect(markup).not.toContain('data-partial="true"')
    expect(markup).not.toContain("recharts-area")
  })

  it("marks a partial live valuation as approximate", () => {
    const markup = renderToStaticMarkup(
      <PortfolioScrubChart
        data={[]}
        stats={stats({
          estimatedValueJpy: 1_250,
          totalValueJpy: 1_250,
          totalCopyCount: 2,
          valuedCopyCount: 1,
        })}
      />,
    )

    expect(markup).toContain('data-partial="true"')
    expect(markup).toContain("≈")
  })

  it("keeps range controls for a real multi-point trend", () => {
    const now = Date.now()
    const point = (
      daysAgo: number,
      value: number,
    ): HistoryPoint => ({
      label: `${daysAgo}d`,
      date: new Date(now - daysAgo * 24 * 60 * 60 * 1_000).toISOString(),
      value,
      cost: 500,
      netInvested: 500,
      cardCount: 1,
      totalCopyCount: 1,
      costedCopyCount: 1,
      isInflow: false,
    })
    const markup = renderToStaticMarkup(
      <PortfolioScrubChart
        data={[point(2, 1_000), point(1, 1_100)]}
        stats={stats()}
      />,
    )

    expect(markup).toContain('data-slot="portfolio-chart-range"')
    expect(markup.match(/role="radio"/g)).toHaveLength(3)
    expect(markup).not.toContain('disabled=""')
    expect(markup).toContain("h-44")
    expect(markup).not.toContain('data-slot="portfolio-chart-sparse"')
  })
})
