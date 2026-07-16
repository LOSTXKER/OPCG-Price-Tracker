import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PortfolioManager, type PortfolioManagerRow } from "./portfolio-manager"
import { PortfolioManagerSkeleton } from "./portfolio-manager-skeleton"
import { PortfolioManagerSummary } from "./portfolio-manager-summary"

const row: PortfolioManagerRow = {
  id: 1,
  name: "Main collection",
  isPublic: false,
  totalValue: 120_000,
  totalCost: 80_000,
  itemCount: 2,
  copyCount: 3,
  estimatedValueJpy: 120_000,
  recordedCostJpy: 80_000,
  totalCopyCount: 3,
  valuedCopyCount: 3,
  costedCopyCount: 3,
  valuationComplete: true,
  performanceComplete: true,
  pnlJpy: 40_000,
  roiPct: 50,
  games: [],
  previewItems: Array.from({ length: 3 }, (_, index) => ({
    cardCode: `OP01-00${index + 1}`,
    imageUrl: null,
    nameJp: "ゾロ",
    nameEn: "Zoro",
  })),
}

const mutationCallbacks = {
  onCreatePortfolio: () => undefined,
  onAddCards: () => undefined,
  onRename: () => true,
  onSetVisibility: () => true,
  onDelete: () => true,
}

const money = (value: number) => `¥${value.toLocaleString("en-US")}`

describe("PortfolioManagerSummary", () => {
  it("renders one compact, value-only aggregate", () => {
    const markup = renderToStaticMarkup(
      <PortfolioManagerSummary
        data={{
          totalValueJpy: 162_900,
          portfolioCount: 2,
          valuedCopyCount: 18,
          valuationComplete: true,
        }}
        lang="EN"
        formatMoney={money}
      />,
    )

    expect(markup).toContain('data-slot="portfolio-manager-summary"')
    expect(markup).toContain("2 portfolios")
    expect(markup).toContain("Estimated value")
    expect(markup).toContain("¥162,900")
    expect(markup).not.toContain("ROI")
    expect(markup).not.toContain("Cost basis")
    expect(markup).not.toContain("Profit / Loss")
  })

  it("marks partial and unavailable valuation without exposing it while masked", () => {
    const partial = renderToStaticMarkup(
      <PortfolioManagerSummary
        data={{
          totalValueJpy: 120_000,
          portfolioCount: 2,
          valuedCopyCount: 2,
          valuationComplete: false,
        }}
        lang="EN"
        formatMoney={money}
      />,
    )
    const unavailable = renderToStaticMarkup(
      <PortfolioManagerSummary
        data={{
          totalValueJpy: 0,
          portfolioCount: 2,
          valuedCopyCount: 0,
          valuationComplete: false,
        }}
        lang="EN"
        formatMoney={money}
      />,
    )
    const masked = renderToStaticMarkup(
      <PortfolioManagerSummary
        data={{
          totalValueJpy: 120_000,
          portfolioCount: 2,
          valuedCopyCount: 2,
          valuationComplete: false,
        }}
        lang="EN"
        masked
        maskText="PRIVATE"
        formatMoney={money}
      />,
    )

    expect(partial).toContain("≈ ¥120,000")
    expect(partial).toContain("Some prices are missing")
    expect(unavailable).toContain('aria-label="No price data"')
    expect(masked).toContain("PRIVATE")
    expect(masked).not.toContain("¥120,000")
    expect(masked).not.toContain("Some prices are missing")
  })
})

describe("PortfolioManager", () => {
  it("owns the zero state and exposes exactly one create action", () => {
    const markup = renderToStaticMarkup(
      <PortfolioManager
        rows={[]}
        lang="EN"
        formatMoney={money}
        {...mutationCallbacks}
      />,
    )

    expect(markup).toContain("No portfolios yet")
    expect(markup.match(/Create portfolio/g)?.length).toBe(1)
    expect(markup).not.toContain('data-slot="portfolio-manager-summary"')
    expect(markup).not.toContain("Estimated value")
  })

  it("renders one responsive list row without duplicating single-portfolio totals", () => {
    const markup = renderToStaticMarkup(
      <PortfolioManager
        rows={[row]}
        lang="EN"
        formatMoney={money}
        onToggleMasked={() => undefined}
        {...mutationCallbacks}
      />,
    )

    expect(markup).toContain('href="/portfolio/1"')
    expect(markup).toContain("Main collection")
    expect(markup).toContain("Private")
    expect(markup).toContain("3 cards")
    expect(markup.match(/¥120,000/g)?.length).toBe(1)
    expect(markup.match(/data-slot="portfolio-preview"/g)?.length).toBe(2)
    expect(markup).toContain('aria-label="Add cards to Main collection"')
    expect(markup).toContain('aria-label="Manage: Main collection"')
    expect(markup).toContain('aria-label="Hide balance"')
    expect(markup).toContain("size-11")
    expect(markup).not.toContain('data-slot="portfolio-manager-summary"')
    expect(markup).not.toContain("<table")
    expect(markup).not.toContain("Open portfolio")
    expect(markup).not.toContain("holdings")
    expect(markup).not.toContain("ROI")
    expect(markup).not.toContain("Cost basis")
    expect(markup).not.toContain("Choose a portfolio")
  })

  it("shows one compact aggregate only when there are multiple portfolios", () => {
    const markup = renderToStaticMarkup(
      <PortfolioManager
        rows={[
          row,
          {
            ...row,
            id: 2,
            name: "Slabs",
            estimatedValueJpy: 42_900,
            totalValue: 42_900,
          },
        ]}
        lang="EN"
        formatMoney={money}
        {...mutationCallbacks}
      />,
    )

    expect(markup.match(/data-slot="portfolio-manager-summary"/g)?.length).toBe(1)
    expect(markup).toContain("2 portfolios")
    expect(markup).toContain("¥162,900")
  })

  it("does not mark a complete priced portfolio partial because a sibling is empty", () => {
    const markup = renderToStaticMarkup(
      <PortfolioManager
        rows={[
          row,
          {
            ...row,
            id: 2,
            name: "Empty",
            totalValue: 0,
            totalCost: 0,
            itemCount: 0,
            copyCount: 0,
            estimatedValueJpy: 0,
            recordedCostJpy: 0,
            totalCopyCount: 0,
            valuedCopyCount: 0,
            costedCopyCount: 0,
            valuationComplete: false,
            performanceComplete: false,
            pnlJpy: null,
            roiPct: null,
            previewItems: [],
          },
        ]}
        lang="EN"
        formatMoney={money}
        {...mutationCallbacks}
      />,
    )

    expect(markup).toContain("¥120,000")
    expect(markup).not.toContain("≈ ¥120,000")
    expect(markup).not.toContain("Some prices are missing")
  })

  it("uses a quiet upgrade action when the portfolio quota is full", () => {
    const markup = renderToStaticMarkup(
      <PortfolioManager
        rows={[row]}
        lang="EN"
        atPortfolioLimit
        formatMoney={money}
        {...mutationCallbacks}
      />,
    )

    expect(markup).toContain(">Upgrade<")
    expect(markup).not.toContain(">Create portfolio<")
    expect(markup).toContain("bg-muted/70")
  })

  it("handles empty, partial, and masked row values honestly", () => {
    const unavailable = renderToStaticMarkup(
      <PortfolioManager
        rows={[
          {
            ...row,
            itemCount: 0,
            copyCount: 0,
            totalCopyCount: 0,
            valuedCopyCount: 0,
            estimatedValueJpy: 0,
            totalValue: 0,
            valuationComplete: false,
            previewItems: [],
          },
        ]}
        lang="EN"
        formatMoney={money}
        {...mutationCallbacks}
      />,
    )
    const partialRow = { ...row, valuedCopyCount: 2, valuationComplete: false }
    const partial = renderToStaticMarkup(
      <PortfolioManager
        rows={[partialRow]}
        lang="EN"
        formatMoney={money}
        {...mutationCallbacks}
      />,
    )
    const masked = renderToStaticMarkup(
      <PortfolioManager
        rows={[partialRow]}
        lang="EN"
        masked
        formatMoney={money}
        {...mutationCallbacks}
      />,
    )

    expect(unavailable).toContain("No cards yet")
    expect(unavailable).toContain('aria-label="No price data"')
    expect(partial).toContain("≈ ¥120,000")
    expect(partial).toContain("Some prices are missing")
    expect(masked).not.toContain("¥120,000")
    expect(masked).not.toContain("Some prices are missing")
    expect(masked).toContain("••••")
  })
})

describe("PortfolioManagerSkeleton", () => {
  it("mirrors one responsive list with two previews and two row actions", () => {
    const markup = renderToStaticMarkup(<PortfolioManagerSkeleton rows={2} />)

    expect(markup).toContain('data-slot="portfolio-manager-skeleton"')
    expect(markup.match(/data-slot="portfolio-skeleton-preview"/g)?.length).toBe(4)
    expect(markup).toContain("divide-y divide-hair")
    expect(markup).toContain("grid-cols-[minmax(0,1fr)_auto]")
    expect(markup).not.toContain("<table")
    expect(markup).not.toContain("sm:hidden")
    expect(markup).not.toContain("sm:block")
  })
})
