import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { t } from "@/lib/i18n"
import type { AssetRow, GameBreakdown, PortfolioStats } from "@/lib/types/portfolio"

import { PortfolioGameBreakdown } from "./portfolio-game-breakdown"
import { PortfolioHeroPanel } from "./portfolio-hero-panel"
import { PortfolioHero } from "./portfolio-hero"
import { PortfolioAllocationPanel } from "./portfolio-allocation-panel"
import { PortfolioShareCard } from "./portfolio-share-card"
import { MASKED } from "@/lib/constants/ui"
import { formatDisplayValue, jpyToDisplayValue } from "@/lib/utils/currency"

vi.mock("@/lib/env", () => ({
  clientEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://meecard.test" }),
}))

function stats(overrides: Partial<PortfolioStats> = {}): PortfolioStats {
  return {
    estimatedValueJpy: 1_000,
    recordedCostJpy: 600,
    totalCopyCount: 2,
    valuedCopyCount: 1,
    costedCopyCount: 2,
    valuationComplete: false,
    performanceComplete: false,
    pnlJpy: null,
    roiPct: null,
    totalValueJpy: 1_000,
    totalCostJpy: 600,
    unrealizedPnl: null,
    unrealizedPnlPercent: null,
    bestPerformer: null,
    worstPerformer: null,
    ...overrides,
  }
}

function game(overrides: Partial<GameBreakdown> = {}): GameBreakdown {
  return {
    game: null,
    estimatedValueJpy: 1_000,
    recordedCostJpy: 600,
    totalCopyCount: 2,
    valuedCopyCount: 1,
    costedCopyCount: 2,
    valuationComplete: false,
    performanceComplete: false,
    pnlJpy: null,
    roiPct: null,
    valueJpy: 1_000,
    costJpy: 600,
    pnl: null,
    pnlPercent: null,
    count: 2,
    ...overrides,
  }
}

function asset(overrides: Partial<AssetRow> = {}): AssetRow {
  return {
    itemId: 1,
    cardId: 1,
    cardCode: "OP01-001",
    baseCode: "OP01-001",
    nameJp: "カード",
    nameEn: "Free card",
    rarity: "R",
    imageUrl: null,
    quantity: 1,
    purchasePrice: 0,
    currentPrice: 1_000,
    currentPriceThb: null,
    priceChange24h: null,
    priceChange7d: null,
    condition: "NM",
    notes: null,
    game: null,
    ...overrides,
  }
}

describe("portfolio financial display guard", () => {
  it("keeps the estimated value but replaces incomplete aggregate performance", () => {
    const markup = renderToStaticMarkup(<PortfolioHeroPanel stats={stats()} />)

    expect(markup).toContain(t("TH", "portfolioEstimatedValue"))
    expect(markup).toContain("≈")
    expect(markup).toContain(t("TH", "portfolioPerformanceIncomplete"))
    expect(markup).not.toContain(t("TH", "pnl"))
    expect(markup).not.toContain(`>${t("TH", "costBasis")}<`)
    expect(markup).not.toContain(t("TH", "bestPerformer"))
  })

  it("uses a dash when none of the holdings has a market price", () => {
    const markup = renderToStaticMarkup(
      <PortfolioHeroPanel
        stats={stats({ estimatedValueJpy: 0, totalValueJpy: 0, valuedCopyCount: 0 })}
      />,
    )

    expect(markup).toContain(`aria-label="${t("TH", "portfolioValueUnavailable")}"`)
    expect(markup).toContain("—")
  })

  it("does not invent per-game returns or allocation bars from partial prices", () => {
    const markup = renderToStaticMarkup(
      <PortfolioGameBreakdown
        breakdown={[
          game(),
          game({
            game: {
              slug: "pokemon",
              name: "Pokémon",
              nameEn: "Pokémon",
              logoUrl: null,
            },
            estimatedValueJpy: 0,
            valueJpy: 0,
            valuedCopyCount: 0,
            totalCopyCount: 1,
            count: 1,
          }),
        ]}
        totalValueJpy={1_000}
      />,
    )

    expect(markup).toContain("Pokémon")
    expect(markup).toContain("≈")
    expect(markup).not.toContain("%")
    expect(markup).not.toContain('role="presentation"')
  })

  it("removes aggregate return and cost from an incomplete share card", () => {
    const markup = renderToStaticMarkup(
      <PortfolioShareCard
        portfolioName="Main collection"
        totalValueJpy={1_000}
        totalCostJpy={600}
        unrealizedPnl={null}
        unrealizedPnlPercent={null}
        valuedCopyCount={1}
        valuationComplete={false}
        performanceComplete={false}
        history={[]}
        assets={[]}
        lang="EN"
        currency="JPY"
      />,
    )

    expect(markup).toContain("Estimated value")
    expect(markup).toContain("≈")
    expect(markup).not.toContain("Unrealized P/L")
    expect(markup).not.toContain("Cost basis")
    expect(markup).not.toContain("ROI")
  })

  it("masks allocation money while preserving the non-sensitive share", () => {
    const markup = renderToStaticMarkup(
      <PortfolioAllocationPanel
        allocation={[{ name: "Zoro", value: 123_456, percent: 100 }]}
        hideBalance
      />,
    )
    const visibleValue = formatDisplayValue(jpyToDisplayValue(123_456, "THB"), "THB")

    expect(markup).toContain(MASKED)
    expect(markup).not.toContain(visibleValue)
    expect(markup).toContain("100.0%")
  })

  it("localizes the hidden-balance label exposed to assistive technology", () => {
    const markup = renderToStaticMarkup(
      <PortfolioHero
        valueJpy={1_000}
        deltaJpy={400}
        deltaPct={40}
        hasPnl
        hideBalance
      />,
    )

    expect(markup).toContain(`aria-label="${t("TH", "balanceHidden")}"`)
    expect(markup).not.toContain('aria-label="balance hidden"')
  })

  it("shows absolute best-performer P/L instead of inventing zero-cost ROI", () => {
    const markup = renderToStaticMarkup(
      <PortfolioHeroPanel
        stats={stats({
          recordedCostJpy: 0,
          totalCopyCount: 1,
          valuedCopyCount: 1,
          costedCopyCount: 1,
          valuationComplete: true,
          performanceComplete: true,
          pnlJpy: 1_000,
          roiPct: null,
          totalCostJpy: 0,
          unrealizedPnl: 1_000,
          unrealizedPnlPercent: null,
          bestPerformer: { name: "Free card", pnl: 1_000, pnlPercent: null },
        })}
      />,
    )
    const absolutePnl = formatDisplayValue(jpyToDisplayValue(1_000, "THB"), "THB")

    expect(markup).toContain("Free card")
    expect(markup).toContain(absolutePnl)
    expect(markup).not.toContain("0%")
    expect(markup).not.toContain("Infinity")
  })

  it("does not leak a fabricated +0% ROI from a zero-cost share holding", () => {
    const markup = renderToStaticMarkup(
      <PortfolioShareCard
        portfolioName="Free collection"
        totalValueJpy={1_000}
        totalCostJpy={0}
        unrealizedPnl={1_000}
        unrealizedPnlPercent={null}
        valuedCopyCount={1}
        valuationComplete
        performanceComplete
        history={[]}
        assets={[asset()]}
        lang="EN"
        currency="JPY"
      />,
    )

    expect(markup).toContain("Free card")
    expect(markup).not.toContain("0%")
    expect(markup).not.toContain("Infinity")
  })
})
