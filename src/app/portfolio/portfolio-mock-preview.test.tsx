import { load } from "cheerio"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { t, type Language } from "@/lib/i18n"
import { formatJpyAmount } from "@/lib/utils/currency"

import { PortfolioMockPreview } from "./portfolio-mock-preview"

function slotPosition(markup: string, slot: string) {
  return markup.indexOf(`data-slot="${slot}"`)
}

function openingTagForSlot(markup: string, slot: string) {
  const position = slotPosition(markup, slot)
  return markup.slice(markup.lastIndexOf("<", position), markup.indexOf(">", position) + 1)
}

describe("PortfolioMockPreview", () => {
  it.each<Language>(["TH", "EN", "JP"])(
    "localizes both tabs for %s",
    (lang) => {
      const markup = renderToStaticMarkup(<PortfolioMockPreview lang={lang} />)

      expect(markup).toContain(t(lang, "overviewTab"))
      expect(markup).toContain(t(lang, "insightsTab"))
      expect(markup).toContain(t(lang, "portfolioPreviewNote"))
      expect(markup).toContain(t(lang, "addPortfolioNote"))
      expect(markup).toContain(t(lang, "dateNotSpecified"))
      expect(
        markup.split(`title="${t(lang, "details")}"`).length - 1,
      ).toBe(8)
      expect(markup).not.toContain(`>${t(lang, "details")}<`)
      expect(markup).not.toContain(
        t(lang, "purchaseLotNumber").replace("{number}", "1"),
      )
      expect(markup).not.toContain(
        t(lang, "purchaseLotNumber").replace("{number}", "2"),
      )
      expect(markup.match(/role="tab"/g)).toHaveLength(2)
    },
  )

  it("uses the external PageHeader and mirrors the responsive detail shell", () => {
    const markup = renderToStaticMarkup(<PortfolioMockPreview lang="TH" />)

    expect(markup).toContain('data-slot="portfolio-detail-preview"')
    expect(markup).not.toContain('data-slot="portfolio-vault-stage"')
    expect(markup).not.toContain("<h1")
    expect(markup).toContain(t("TH", "myPortfolio"))
    expect(markup.match(/data-slot="portfolio-detail-preview-mobile-row"/g)).toHaveLength(4)
    expect(markup.match(/data-slot="portfolio-detail-preview-desktop-row"/g)).toHaveLength(4)

    const orderedSlots = [
      "portfolio-detail-preview-sidebar",
      "portfolio-detail-preview-sidebar-list",
      "portfolio-detail-preview-main",
      "portfolio-detail-preview-toolbar",
      "portfolio-detail-preview-switcher",
      "portfolio-detail-preview-tabs",
      "portfolio-detail-preview-actions",
      "portfolio-detail-preview-game-filter",
      "portfolio-overview",
      "portfolio-detail-preview-summary",
      "portfolio-detail-preview-assets",
    ]
    const positions = orderedSlots.map((slot) => slotPosition(markup, slot))

    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    const $ = load(markup)
    const toolbar = $('[data-slot="portfolio-detail-preview-toolbar"]')
    expect(toolbar).toHaveLength(1)
    // Scope filter is a data control, not a tab: it sits below the rail as a
    // sibling of the toolbar at every width (same as the live page).
    expect(
      toolbar.find('[data-slot="portfolio-detail-preview-game-filter"]'),
    ).toHaveLength(0)
    expect(toolbar.attr("class")).toContain(
      "lg:grid-cols-[auto_minmax(0,1fr)]",
    )
    expect(toolbar.attr("class")).toContain("md:border-b")
    const previewGameFilter = $(
      '[data-slot="portfolio-detail-preview-main"] > [data-slot="portfolio-detail-preview-game-filter"]',
    )
    expect(previewGameFilter).toHaveLength(1)
    expect(previewGameFilter.attr("class")).toContain("pt-3")
    expect(previewGameFilter.attr("class")).not.toContain("row-start")
    expect(
      toolbar
        .find('[data-slot="portfolio-detail-preview-switcher"]')
        .attr("class"),
    ).toContain("h-14")
    expect(markup).toContain(t("TH", "allGames"))
    expect(markup).toContain(
      `aria-label="${t("TH", "filterByGame")}: ${t("TH", "allGames")}"`,
    )
    expect(markup).not.toContain("Pokémon")
    expect(markup).toContain('data-slot="portfolio-detail-preview-mobile-list"')
    expect(markup).toContain('data-slot="portfolio-detail-preview-desktop-table"')
    expect(markup).toContain('data-slot="portfolio-detail-preview-colgroup"')
    expect(markup).toContain("table-fixed")
    expect(markup).toContain('data-slot="portfolio-detail-preview-summary"')

    const summaryStart = slotPosition(markup, "portfolio-detail-preview-summary")
    const assetsStart = slotPosition(markup, "portfolio-detail-preview-assets")
    const insightsStart = slotPosition(markup, "portfolio-insights")
    const summaryMarkup = markup.slice(summaryStart, assetsStart)
    const assetsMarkup = markup.slice(assetsStart, insightsStart)
    const summarySlots = [
      "portfolio-detail-preview-summary-value",
      "portfolio-detail-preview-summary-roi",
      "portfolio-detail-preview-summary-metrics",
      "portfolio-detail-preview-summary-pnl",
      "portfolio-detail-preview-summary-cost",
    ]
    const summaryPositions = summarySlots.map((slot) =>
      slotPosition(summaryMarkup, slot),
    )
    expect(summaryPositions.every((position) => position >= 0)).toBe(true)
    expect(summaryPositions).toEqual(
      [...summaryPositions].sort((a, b) => a - b),
    )
    expect(
      summaryMarkup.split(`+${formatJpyAmount(2_180, "THB")}`),
    ).toHaveLength(2)
    expect(
      summaryMarkup.split(formatJpyAmount(13_400, "THB")),
    ).toHaveLength(2)
    expect(summaryMarkup.split("+16.3%")).toHaveLength(2)
    const summaryTag = openingTagForSlot(
      markup,
      "portfolio-detail-preview-summary",
    )
    expect(summaryTag).toContain("portfolio-financial-gradient")
    expect(summaryTag).toContain('data-trend="up"')
    expect(summaryTag).toContain("p-4 sm:p-6")
    expect(
      openingTagForSlot(
        summaryMarkup,
        "portfolio-detail-preview-summary-metrics",
      ),
    ).toContain("mt-4 grid max-w-2xl grid-cols-2 gap-0 sm:mt-6")
    expect(
      openingTagForSlot(
        summaryMarkup,
        "portfolio-detail-preview-summary-pnl",
      ),
    ).toContain("pr-3 sm:pr-6")
    expect(
      openingTagForSlot(
        summaryMarkup,
        "portfolio-detail-preview-summary-cost",
      ),
    ).toContain("border-l border-hair pl-3 sm:pl-6")
    expect(summaryMarkup).not.toContain("9 / 9")
    expect(summaryMarkup).not.toContain(t("TH", "bestPerformer"))
    expect(summaryMarkup).not.toContain(t("TH", "worstPerformer"))
    expect(summaryMarkup).not.toContain("sm:grid-cols-4")
    expect(summaryMarkup).not.toContain("bg-muted/20")
    expect(summaryMarkup).not.toContain("border-dashed")

    // Mobile row = identity + money stack (market price + P/L %), not a mini
    // table: no 3-column grid, no inner dividers, no unit-cost cell.
    const mobileMetricBlocks =
      assetsMarkup.match(
        /<dl[^>]*data-slot="portfolio-detail-preview-mobile-metrics"[^>]*>[\s\S]*?<\/dl>/g,
      ) ?? []
    expect(mobileMetricBlocks).toHaveLength(4)
    expect(
      mobileMetricBlocks.every(
        (block) =>
          block.includes("text-right") &&
          block.includes("portfolio-detail-preview-mobile-price") &&
          block.includes("portfolio-detail-preview-mobile-pnl") &&
          block.includes("sr-only"),
      ),
    ).toBe(true)
    expect(
      mobileMetricBlocks.every(
        (block) =>
          !block.includes("grid-cols-3") &&
          !block.includes("divide-x") &&
          !block.includes("portfolio-detail-preview-mobile-cost") &&
          !block.includes("portfolio-detail-preview-mobile-quantity"),
      ),
    ).toBe(true)
    expect(assetsMarkup.match(/<col(?=\s|>)/g)).toHaveLength(6)
    expect(assetsMarkup).toContain('class="w-[28%]"')
    expect(assetsMarkup).toContain('class="w-[10%]"')
    expect(assetsMarkup).toContain('class="w-[17%]"')
    expect(assetsMarkup).toContain('class="w-[20%]"')
    expect(assetsMarkup).toContain('class="w-[8%]"')
    // Only the 2-copy mock lot earns a quantity badge on mobile.
    expect(
      assetsMarkup.match(
        /data-slot="portfolio-detail-preview-mobile-quantity"/g,
      ),
    ).toHaveLength(1)
    expect(
      assetsMarkup.match(/data-slot="portfolio-detail-preview-mobile-date"/g),
    ).toHaveLength(4)
    expect(
      assetsMarkup.match(/data-slot="portfolio-detail-preview-desktop-date"/g),
    ).toHaveLength(4)
    expect(assetsMarkup).toContain(
      'data-slot="portfolio-detail-preview-head"',
    )
    expect(assetsMarkup).toContain("whitespace-normal")
    expect(assetsMarkup).toContain("py-2.5")
    expect(assetsMarkup).toContain("gap-2.5")
    expect(assetsMarkup).toContain("aspect-[63/88] w-10")
    expect(assetsMarkup).not.toContain("grid-cols-3")
    expect(assetsMarkup).toContain(t("TH", "quantity"))
    expect(assetsMarkup).toContain(t("TH", "marketPricePerCard"))
    expect(assetsMarkup).toContain(
      t("TH", "portfolioPurchaseCountSummary")
        .replace("{purchases}", "4")
        .replace("{copies}", "5"),
    )
    // 2 mobile note flags (only rows that HAVE a note) + 4 desktop previews.
    expect(
      assetsMarkup.match(/data-slot="portfolio-detail-preview-note"/g),
    ).toHaveLength(6)
    expect(
      assetsMarkup.match(
        /data-slot="portfolio-purchase-note-preview" data-state="saved"/g,
      ),
    ).toHaveLength(2)
    expect(
      assetsMarkup.match(
        /data-slot="portfolio-purchase-note-preview" data-state="empty"/g,
      ),
    ).toHaveLength(2)
    expect(
      assetsMarkup.match(/data-slot="portfolio-detail-preview-details"/g),
    ).toHaveLength(8)
    // Mobile chevron is bare (the whole row is tappable); the desktop cell
    // keeps the filled circle.
    const detailsTag = openingTagForSlot(
      assetsMarkup,
      "portfolio-detail-preview-details",
    )
    expect(detailsTag).toContain("size-5")
    expect(detailsTag).not.toContain("rounded-full")
    expect(assetsMarkup).toContain(
      "size-10 items-center justify-center rounded-full border border-hair bg-muted/40",
    )
    expect(detailsTag).toContain(`title="${t("TH", "details")}"`)
    expect(assetsMarkup).not.toContain(`>${t("TH", "details")}<`)
    expect(assetsMarkup).toContain(t("TH", "portfolioPreviewNote"))
    expect(assetsMarkup).toContain(t("TH", "addPortfolioNote"))
    expect(assetsMarkup).not.toContain(
      t("TH", "purchaseLotNumber").replace("{number}", "1"),
    )
    expect(assetsMarkup).not.toContain(
      t("TH", "purchaseLotNumber").replace("{number}", "2"),
    )
    expect(assetsMarkup.match(/OP01-016/g)).toHaveLength(4)
    expect(assetsMarkup).toContain(t("TH", "purchaseLots"))
    expect(assetsMarkup).toContain(t("TH", "unitCost"))
    expect(assetsMarkup).toContain("1 ใบ")
    expect(assetsMarkup).not.toContain("×1")
    expect(
      assetsMarkup.split(t("TH", "dateNotSpecified")).length - 1,
    ).toBe(2)
    expect(assetsMarkup.match(/data-state="recorded"/g)).toHaveLength(6)
    expect(assetsMarkup.match(/data-state="missing"/g)).toHaveLength(2)
    expect(assetsMarkup).not.toContain(t("TH", "totalCost"))
    expect(assetsMarkup).toContain(formatJpyAmount(3_350, "THB"))
    expect(assetsMarkup).toContain(`+${formatJpyAmount(545, "THB")}`)
    expect(assetsMarkup).not.toContain(">24h<")
    expect(assetsMarkup).not.toContain(t("TH", "sparkline30d"))
    expect(assetsMarkup).not.toContain(t("TH", "value"))

    const tabsTag = openingTagForSlot(markup, "portfolio-detail-preview-tabs")
    expect(tabsTag).toContain('data-variant="line"')
    expect(tabsTag).toContain("border-b")
    expect(tabsTag).toContain("group-data-horizontal/tabs:h-11")
    // 44px rail at every width so the tab edge is flush with the rail rule.
    expect(tabsTag).not.toContain("md:group-data-horizontal/tabs:h-10")
    expect(tabsTag).not.toContain("md:w-48")
    expect(tabsTag).not.toContain("bg-muted")
    expect(markup).toContain("group-data-horizontal/tabs:after:-bottom-px")
    expect(markup).not.toContain("group-data-horizontal/tabs:after:bottom-0")
    expect(markup).not.toContain("basis-0")
    expect(markup).toContain("lg:sticky")
    expect(markup).toContain("lg:top-24")
    expect(markup).not.toContain('data-slot="portfolio-detail-preview-sidebar-total"')
    expect(markup).not.toContain(t("TH", "allPortfolios"))
    expect(markup).toContain('data-slot="portfolio-detail-preview-game-filter"')
    expect(markup).toContain('data-slot="game-scope-select"')
    expect(markup).toContain(t("TH", "allGames"))
    expect(markup).not.toContain("Pokémon")
    expect(markup).not.toContain('data-slot="portfolio-manager"')
    expect(markup).not.toContain("bg-gradient")
    expect(markup).not.toContain("backdrop-blur")
  })

  it("keeps the new Insights preview mounted after Overview", () => {
    const markup = renderToStaticMarkup(<PortfolioMockPreview lang="TH" />)

    expect(markup.match(/data-slot="portfolio-insights-kpi"/g)).toHaveLength(3)
    expect(markup.match(/data-slot="portfolio-allocation-card-image"/g)).toHaveLength(3)

    const orderedSlots = [
      "portfolio-detail-preview-assets",
      "portfolio-insights",
      "portfolio-insights-kpis",
      "portfolio-insights-allocation",
    ]
    const positions = orderedSlots.map((slot) => slotPosition(markup, slot))

    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(markup).not.toContain('data-slot="portfolio-insights-value"')
    expect(markup).not.toContain('data-slot="portfolio-insights-structure"')
    expect(markup).not.toContain('data-slot="portfolio-insights-movers"')
    expect(markup).not.toContain('data-slot="portfolio-insights-preview-range"')
    expect(markup).toContain(t("TH", "averageCostPerCard"))
    expect(markup).toContain(t("TH", "largestPortfolioShare"))
    expect(markup).not.toContain('data-slot="portfolio-insights-history"')
    expect(markup).not.toContain('data-slot="portfolio-insights-preview-chart"')
    expect(markup).not.toContain("bg-gradient")
    expect(markup).not.toContain("backdrop-blur")
  })
})
