import { load } from "cheerio"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PortfolioDetailSkeleton } from "./portfolio-detail-skeleton"

function slotPosition(markup: string, slot: string) {
  return markup.indexOf(`data-slot="${slot}"`)
}

function openingTagForSlot(markup: string, slot: string) {
  const position = slotPosition(markup, slot)
  return markup.slice(markup.lastIndexOf("<", position), markup.indexOf(">", position) + 1)
}

describe("PortfolioDetailSkeleton", () => {
  it("mirrors the sidebar, responsive toolbar, hero, and asset fallbacks", () => {
    const markup = renderToStaticMarkup(<PortfolioDetailSkeleton rows={3} />)

    expect(markup).toContain('data-slot="portfolio-detail-skeleton"')
    expect(markup).not.toContain('data-slot="portfolio-detail-skeleton-header"')
    expect(markup.match(/data-slot="portfolio-detail-skeleton-tab"/g)).toHaveLength(2)
    expect(markup.match(/data-slot="portfolio-detail-skeleton-mobile-row"/g)).toHaveLength(3)
    expect(markup.match(/data-slot="portfolio-detail-skeleton-desktop-row"/g)).toHaveLength(3)
    expect(markup).toContain('data-slot="portfolio-overview-skeleton"')
    expect(markup).not.toContain('data-slot="portfolio-insights"')
    expect(markup).toContain('data-slot="portfolio-detail-skeleton-summary"')

    const orderedSlots = [
      "portfolio-detail-skeleton-sidebar",
      "portfolio-detail-skeleton-sidebar-list",
      "portfolio-detail-skeleton-main",
      "portfolio-detail-skeleton-toolbar",
      "portfolio-detail-skeleton-switcher",
      "portfolio-detail-skeleton-tabs",
      "portfolio-detail-skeleton-actions",
      "portfolio-detail-skeleton-game-filter",
      "portfolio-detail-skeleton-summary",
      "portfolio-detail-skeleton-summary-value",
      "portfolio-detail-skeleton-summary-roi",
      "portfolio-detail-skeleton-summary-metrics",
      "portfolio-detail-skeleton-summary-pnl",
      "portfolio-detail-skeleton-summary-cost",
      "portfolio-detail-skeleton-assets",
    ]
    const positions = orderedSlots.map((slot) => slotPosition(markup, slot))

    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    const $ = load(markup)
    const toolbar = $('[data-slot="portfolio-detail-skeleton-toolbar"]')
    expect(toolbar).toHaveLength(1)
    // The scope filter is a data control, not a tab: it lives BELOW the rail as
    // a sibling of the toolbar, at every width (mirrors the live layout).
    expect(
      toolbar.find('[data-slot="portfolio-detail-skeleton-game-filter"]'),
    ).toHaveLength(0)
    expect(toolbar.attr("class")).toContain(
      "lg:grid-cols-[auto_minmax(0,1fr)]",
    )
    expect(toolbar.attr("class")).toContain("md:border-b")
    const skeletonGameFilter = $(
      '[data-slot="portfolio-detail-skeleton-main"] > [data-slot="portfolio-detail-skeleton-game-filter"]',
    )
    expect(skeletonGameFilter).toHaveLength(1)
    expect(skeletonGameFilter.attr("class")).toContain("pt-3")
    expect(skeletonGameFilter.attr("class")).not.toContain("row-start")
    expect(
      toolbar
        .find('[data-slot="portfolio-detail-skeleton-switcher"]')
        .attr("class"),
    ).toContain("h-14")

    expect(markup).toContain('data-slot="portfolio-detail-skeleton-mobile-list"')
    expect(markup).toContain('data-slot="portfolio-detail-skeleton-desktop-table"')
    expect(markup).toContain('data-slot="portfolio-detail-skeleton-colgroup"')
    expect(markup).toContain("table-fixed")
    const mobileMetricsTag = openingTagForSlot(
      markup,
      "portfolio-detail-skeleton-mobile-metrics",
    )
    expect(
      markup.match(/data-slot="portfolio-detail-skeleton-mobile-metrics"/g),
    ).toHaveLength(3)
    // Note previews are desktop-only now (the mobile row flags a note inline),
    // so only the 3 desktop rows carry a note placeholder.
    expect(
      markup.match(/data-slot="portfolio-detail-skeleton-note"/g),
    ).toHaveLength(3)
    expect(
      markup.match(/data-slot="portfolio-detail-skeleton-details"/g),
    ).toHaveLength(6)
    const assetsStart = slotPosition(markup, "portfolio-detail-skeleton-assets")
    const assetsMarkup = markup.slice(assetsStart)
    expect(assetsMarkup.match(/<col(?=\s|>)/g)).toHaveLength(6)
    expect(assetsMarkup).toContain('class="w-[28%]"')
    expect(assetsMarkup).toContain('class="w-[10%]"')
    expect(assetsMarkup).toContain('class="w-[17%]"')
    expect(assetsMarkup).toContain('class="w-[20%]"')
    expect(assetsMarkup).toContain('class="w-[8%]"')
    // Mobile row: bare chevron placeholder; the desktop row keeps its circle.
    const detailsTag = openingTagForSlot(
      assetsMarkup,
      "portfolio-detail-skeleton-details",
    )
    expect(detailsTag).toContain("size-5")
    expect(detailsTag).not.toContain("w-20")
    expect(assetsMarkup).toContain("size-10 rounded-full")
    expect(assetsMarkup).toContain(
      'data-slot="portfolio-detail-skeleton-head"',
    )
    // Money stack, not a mini table.
    expect(mobileMetricsTag).toContain("text-right")
    expect(mobileMetricsTag).not.toContain("grid-cols-3")
    expect(mobileMetricsTag).not.toContain("divide-x")
    expect(
      assetsMarkup.match(
        /data-slot="portfolio-detail-skeleton-mobile-quantity"/g,
      ),
    ).toHaveLength(3)
    expect(
      assetsMarkup.match(
        /data-slot="portfolio-detail-skeleton-mobile-date"/g,
      ),
    ).toHaveLength(3)
    expect(
      assetsMarkup.match(
        /data-slot="portfolio-detail-skeleton-desktop-date"/g,
      ),
    ).toHaveLength(3)
    expect(assetsMarkup).toContain("py-2.5")
    expect(assetsMarkup).toContain("gap-2.5")
    expect(assetsMarkup).toContain("aspect-[63/88] w-10")
    expect(assetsMarkup).not.toContain("lg:table-cell")
    expect(markup).toContain("lg:grid-cols-[280px_minmax(0,1fr)]")
    const tabsTag = openingTagForSlot(markup, "portfolio-detail-skeleton-tabs")
    expect(tabsTag).toContain("border-b")
    expect(tabsTag).toContain("h-11")
    // 44px at every width so the tab bottom edge is flush with the rail rule.
    expect(tabsTag).not.toContain("md:h-10")
    expect(tabsTag).not.toContain("md:w-48")
    expect(tabsTag).not.toContain("bg-muted")
    expect(tabsTag).not.toContain("p-0.5")
    expect(markup).toContain('data-slot="portfolio-detail-skeleton-tab-indicator"')
    expect(markup).toContain("h-0.5")
    // Indicator overlaps the rail rule instead of stacking a line above it.
    expect(
      openingTagForSlot(markup, "portfolio-detail-skeleton-tab-indicator"),
    ).toContain("-bottom-px")
    expect(markup).toContain("lg:sticky")
    expect(markup).toContain("lg:top-24")
    expect(markup).not.toContain('data-slot="portfolio-detail-skeleton-sidebar-total"')
    expect(markup).toContain('data-slot="portfolio-detail-skeleton-game-filter"')
    expect(markup).toContain("h-11 w-32 rounded-lg sm:h-9")
    expect(markup).not.toContain('data-slot="portfolio-detail-skeleton-vault"')
    const summaryTag = openingTagForSlot(
      markup,
      "portfolio-detail-skeleton-summary",
    )
    expect(summaryTag).toContain("portfolio-financial-gradient")
    expect(summaryTag).toContain('data-trend="neutral"')
    expect(summaryTag).toContain("p-4 sm:p-6")
    expect(
      openingTagForSlot(
        markup,
        "portfolio-detail-skeleton-summary-metrics",
      ),
    ).toContain("mt-4 grid max-w-2xl grid-cols-2 gap-0 sm:mt-6")
    expect(
      openingTagForSlot(markup, "portfolio-detail-skeleton-summary-pnl"),
    ).toContain("pr-3 sm:pr-6")
    expect(
      openingTagForSlot(markup, "portfolio-detail-skeleton-summary-cost"),
    ).toContain("border-l border-hair pl-3 sm:pl-6")
    expect(markup).not.toContain("border-dashed")
    expect(markup).not.toContain("sm:grid-cols-4")
    expect(markup).not.toContain("bg-muted/20")
    expect(markup).not.toContain("bg-gradient")
    expect(markup).not.toContain("backdrop-blur")
    expect(markup).not.toContain("portfolio-manager-skeleton")
  })

  it("mirrors three KPIs, history, and allocation in the Insights state", () => {
    const markup = renderToStaticMarkup(
      <PortfolioDetailSkeleton rows={3} tab="insights" />,
    )

    expect(markup).not.toContain('data-slot="portfolio-detail-skeleton-summary"')
    expect(markup).not.toContain('data-slot="portfolio-detail-skeleton-assets"')
    expect(markup.match(/data-slot="portfolio-insights-kpi"/g)).toHaveLength(3)
    expect(markup.match(/data-slot="portfolio-allocation-card-image"/g)).toHaveLength(3)

    const orderedSlots = [
      "portfolio-detail-skeleton-sidebar",
      "portfolio-detail-skeleton-main",
      "portfolio-detail-skeleton-toolbar",
      "portfolio-detail-skeleton-tabs",
      "portfolio-detail-skeleton-game-filter",
      "portfolio-insights",
      "portfolio-insights-kpis",
      "portfolio-insights-history",
      "portfolio-insights-skeleton-chart",
      "portfolio-insights-allocation",
    ]
    const positions = orderedSlots.map((slot) => slotPosition(markup, slot))

    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(markup).not.toContain('data-slot="portfolio-detail-skeleton-vault"')
    expect(markup).not.toContain('data-slot="portfolio-insights-value"')
    expect(markup).not.toContain('data-slot="portfolio-insights-structure"')
    expect(markup).not.toContain('data-slot="portfolio-insights-movers"')
    expect(markup).not.toContain("h-44")
    expect(markup).not.toContain("sm:h-56")
    expect(markup).toContain("h-24")
    expect(markup).toContain("sm:h-28")
    expect(markup).not.toContain("bg-gradient")
    expect(markup).not.toContain("backdrop-blur")
  })
})
