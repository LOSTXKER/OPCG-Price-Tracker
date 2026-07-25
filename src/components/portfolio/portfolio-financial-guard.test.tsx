import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MASKED } from "@/lib/constants/ui"
import { t } from "@/lib/i18n"
import type { AssetRow, GameBreakdown, PortfolioStats } from "@/lib/types/portfolio"
import { formatDisplayValue, jpyToDisplayValue } from "@/lib/utils/currency"

import { PortfolioGameBreakdown } from "./portfolio-game-breakdown"
import { PortfolioSummary } from "./portfolio-hero-panel"
import { PortfolioHero } from "./portfolio-hero"
import { PortfolioAllocationPanel } from "./portfolio-allocation-panel"
import { PortfolioShareCard } from "./portfolio-share-card"

vi.mock("@/lib/env", () => ({
  clientEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://meecard.test" }),
}))

function slotPosition(markup: string, slot: string) {
  return markup.indexOf(`data-slot="${slot}"`)
}

function openingTagForSlot(markup: string, slot: string) {
  const position = slotPosition(markup, slot)
  return markup.slice(markup.lastIndexOf("<", position), markup.indexOf(">", position) + 1)
}

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
    lots: [],
    lotCount: 1,
    recordedCostJpy: 0,
    costedCopyCount: 1,
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
    const markup = renderToStaticMarkup(<PortfolioSummary stats={stats()} />)
    const knownCost = formatDisplayValue(jpyToDisplayValue(600, "THB"), "THB")

    expect(markup).toContain(t("TH", "portfolioEstimatedValue"))
    expect(markup).toContain("≈")
    expect(markup).toContain('data-slot="portfolio-summary"')
    expect(markup).toContain("surface-1 hairline rounded-lg")
    expect(markup).toContain("portfolio-financial-gradient")
    expect(openingTagForSlot(markup, "portfolio-summary")).toContain(
      'data-trend="neutral"',
    )
    expect(openingTagForSlot(markup, "portfolio-summary")).toContain(
      "p-4 sm:p-6",
    )
    expect(openingTagForSlot(markup, "portfolio-summary-metrics")).toContain(
      "mt-4 grid max-w-2xl grid-cols-2 gap-0 sm:mt-6",
    )
    expect(openingTagForSlot(markup, "portfolio-summary-pnl")).toContain(
      "pr-3 sm:pr-6",
    )
    expect(openingTagForSlot(markup, "portfolio-summary-cost")).toContain(
      "border-l border-hair pl-3 sm:pl-6",
    )
    expect(openingTagForSlot(markup, "portfolio-summary-metrics")).not.toContain(
      "grid-cols-1",
    )
    expect(markup).toContain(t("TH", "portfolioPerformanceIncomplete"))
    expect(markup).toContain(`>${t("TH", "unrealizedPnl")}<`)
    expect(markup).toMatch(
      new RegExp(
        `>${t("TH", "unrealizedPnl")}<\\/dt><dd[^>]*>[\\s\\S]*?—[\\s\\S]*?<\\/dd>`,
      ),
    )
    expect(markup).toContain(`>${t("TH", "costBasis")}<`)
    expect(markup).toContain(knownCost)
    expect(markup).not.toContain('data-slot="portfolio-summary-roi"')
    expect(markup).not.toContain("2 / 2")
    expect(markup).not.toContain(t("TH", "bestPerformer"))
    expect(markup).not.toContain(t("TH", "worstPerformer"))

    const summarySlots = [
      "portfolio-summary-value",
      "portfolio-summary-metrics",
      "portfolio-summary-pnl",
      "portfolio-summary-cost",
    ]
    const positions = summarySlots.map((slot) => slotPosition(markup, slot))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(markup).not.toContain("border-dashed")
    expect(markup).not.toContain("Infinity")
    expect(markup).not.toContain("66.67%")
  })

  it("shows partial cost coverage only when the recorded cost is incomplete", () => {
    const markup = renderToStaticMarkup(
      <PortfolioSummary stats={stats({ costedCopyCount: 1 })} />,
    )

    expect(markup).toContain(t("TH", "dataCoverage"))
    expect(markup).toContain("1 / 2")
  })

  it("shows complete portfolio P/L once in the Dime-style hierarchy", () => {
    const markup = renderToStaticMarkup(
      <PortfolioSummary
        stats={stats({
          estimatedValueJpy: 1_000,
          totalValueJpy: 1_000,
          recordedCostJpy: 600,
          totalCostJpy: 600,
          valuedCopyCount: 2,
          valuationComplete: true,
          performanceComplete: true,
          pnlJpy: 400,
          roiPct: 66.7,
          unrealizedPnl: 400,
          unrealizedPnlPercent: 66.7,
          bestPerformer: { name: "Best card", pnl: 400, pnlPercent: 66.7 },
          worstPerformer: { name: "Worst card", pnl: 100, pnlPercent: 10 },
        })}
      />,
    )
    const pnlAmount = `+${formatDisplayValue(jpyToDisplayValue(400, "THB"), "THB")}`

    expect(markup.split(pnlAmount)).toHaveLength(2)
    expect(markup.split("+66.7%")).toHaveLength(2)
    expect(markup.split(t("TH", "unrealizedPnl"))).toHaveLength(2)
    expect(markup).toContain('data-slot="portfolio-summary-roi"')
    expect(openingTagForSlot(markup, "portfolio-summary")).toContain(
      'data-trend="up"',
    )
    expect(markup).not.toContain("Best card")
    expect(markup).not.toContain("Worst card")
    expect(markup).not.toContain("2 / 2")
  })

  it("uses a down tint without returning performer columns", () => {
    const markup = renderToStaticMarkup(
      <PortfolioSummary
        stats={stats({
          totalValueJpy: 400,
          recordedCostJpy: 600,
          totalCostJpy: 600,
          valuedCopyCount: 2,
          valuationComplete: true,
          performanceComplete: true,
          pnlJpy: -200,
          roiPct: -33.3,
          unrealizedPnl: -200,
          unrealizedPnlPercent: -33.3,
          bestPerformer: { name: "Best card", pnl: 10, pnlPercent: 1 },
          worstPerformer: { name: "Worst card", pnl: -200, pnlPercent: -33.3 },
        })}
      />,
    )

    expect(openingTagForSlot(markup, "portfolio-summary")).toContain(
      'data-trend="down"',
    )
    expect(openingTagForSlot(markup, "portfolio-summary-roi")).toContain(
      "bg-price-down/10",
    )
    expect(markup).toContain("−33.3%")
    expect(markup).not.toContain("Best card")
    expect(markup).not.toContain("Worst card")
  })

  it("uses a dash when none of the holdings has a market price", () => {
    const markup = renderToStaticMarkup(
      <PortfolioSummary
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
    expect(markup).toContain("40.00%")
  })

  it("shows absolute portfolio P/L instead of inventing zero-cost ROI", () => {
    const markup = renderToStaticMarkup(
      <PortfolioSummary
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

    expect(markup).toContain(absolutePnl)
    expect(markup).not.toContain('data-slot="portfolio-summary-roi"')
    expect(markup).not.toContain("0%")
    expect(markup).not.toContain("Infinity")
  })

  it("masks money while preserving ROI direction in the simplified summary", () => {
    const completeStats = stats({
      totalValueJpy: 1_000,
      recordedCostJpy: 600,
      totalCostJpy: 600,
      valuedCopyCount: 2,
      valuationComplete: true,
      performanceComplete: true,
      pnlJpy: 400,
      roiPct: 66.7,
      unrealizedPnl: 400,
      unrealizedPnlPercent: 66.7,
    })
    const markup = renderToStaticMarkup(
      <PortfolioSummary stats={completeStats} hideBalance />,
    )
    const visibleValues = [1_000, 600, 400].map((value) =>
      formatDisplayValue(jpyToDisplayValue(value, "THB"), "THB"),
    )

    expect(markup.split(MASKED).length - 1).toBeGreaterThanOrEqual(3)
    expect(openingTagForSlot(markup, "portfolio-summary")).toContain(
      'data-trend="up"',
    )
    expect(openingTagForSlot(markup, "portfolio-summary-roi")).toContain(
      "bg-price-up/10",
    )
    expect(markup).toContain("+66.7%")
    expect(markup).toMatch(/class="[^"]*text-display[^"]*font-price[^"]*"/)
    for (const visibleValue of visibleValues) {
      expect(markup).not.toContain(visibleValue)
    }
  })

  it("keeps percentages visible in hidden game and share breakdowns", () => {
    const hiddenGameMarkup = renderToStaticMarkup(
      <PortfolioGameBreakdown
        breakdown={[
          game({
            game: { slug: "opcg", name: "One Piece", nameEn: "One Piece", logoUrl: null },
            valuationComplete: true,
            performanceComplete: true,
            valuedCopyCount: 2,
            pnl: 400,
            pnlJpy: 400,
            pnlPercent: 66.7,
            roiPct: 66.7,
          }),
          game({
            game: { slug: "pokemon", name: "Pokémon", nameEn: "Pokémon", logoUrl: null },
            valuationComplete: true,
            performanceComplete: true,
            valuedCopyCount: 2,
            pnl: -100,
            pnlJpy: -100,
            pnlPercent: -16.7,
            roiPct: -16.7,
          }),
        ]}
        totalValueJpy={2_000}
        hideBalance
      />,
    )
    const hiddenShareMarkup = renderToStaticMarkup(
      <PortfolioShareCard
        portfolioName="Main collection"
        totalValueJpy={1_000}
        totalCostJpy={600}
        unrealizedPnl={400}
        unrealizedPnlPercent={66.7}
        valuedCopyCount={1}
        valuationComplete
        performanceComplete
        history={[]}
        assets={[asset({ purchasePrice: 500, recordedCostJpy: 500 })]}
        lang="EN"
        currency="JPY"
        hideBalance
      />,
    )

    expect(hiddenGameMarkup).toContain("66.7%")
    expect(hiddenGameMarkup).toContain("16.7%")
    expect(hiddenGameMarkup).toContain(MASKED)
    expect(hiddenShareMarkup).toContain("66.70%")
    expect(hiddenShareMarkup).toContain("+100.0%")
    expect(hiddenShareMarkup).toContain(MASKED)
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
    expect(markup).not.toContain('data-slot="portfolio-share-roi"')
    expect(markup).not.toContain("+0.00%")
    expect(markup).not.toContain("Infinity")
  })
})
