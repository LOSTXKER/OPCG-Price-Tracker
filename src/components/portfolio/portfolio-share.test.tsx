import type { ComponentProps } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MASKED } from "@/lib/constants/ui"
import type { AssetRow } from "@/lib/types/portfolio"

import {
  PORTFOLIO_SHARE_PRESETS,
  PortfolioShareCard,
  type PortfolioSharePreset,
  type PortfolioShareSections,
} from "./portfolio-share-card"

vi.mock("@/lib/env", () => ({
  clientEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://meecard.test" }),
}))

type ShareProps = ComponentProps<typeof PortfolioShareCard>

const defaultProps: ShareProps = {
  portfolioName: "Main collection",
  totalValueJpy: 1_000,
  totalCostJpy: 600,
  unrealizedPnl: 400,
  unrealizedPnlPercent: 66.67,
  valuedCopyCount: 1,
  valuationComplete: true,
  performanceComplete: true,
  history: [],
  assets: [],
  lang: "EN",
  currency: "JPY",
}

function asset(overrides: Partial<AssetRow> = {}): AssetRow {
  return {
    itemId: 1,
    cardId: 1,
    cardCode: "OP01-001",
    baseCode: "OP01-001",
    nameJp: "カード",
    nameEn: "Monkey D. Luffy",
    rarity: "R",
    imageUrl: null,
    quantity: 1,
    lots: [],
    lotCount: 1,
    recordedCostJpy: 500,
    costedCopyCount: 1,
    purchasePrice: 500,
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

function renderShare(overrides: Partial<ShareProps> = {}) {
  return renderToStaticMarkup(
    <PortfolioShareCard {...defaultProps} {...overrides} />,
  )
}

function openingTagForSlot(markup: string, slot: string) {
  const marker = `data-slot="${slot}"`
  const position = markup.indexOf(marker)
  expect(position, `missing ${marker}`).toBeGreaterThanOrEqual(0)
  return markup.slice(
    markup.lastIndexOf("<", position),
    markup.indexOf(">", position) + 1,
  )
}

function elementForSlot(markup: string, slot: string, closingTag: string) {
  const marker = `data-slot="${slot}"`
  const position = markup.indexOf(marker)
  expect(position, `missing ${marker}`).toBeGreaterThanOrEqual(0)
  const start = markup.lastIndexOf("<", position)
  const end = markup.indexOf(closingTag, position)
  expect(end, `missing ${closingTag} after ${marker}`).toBeGreaterThan(position)
  return markup.slice(start, end + closingTag.length)
}

function countSlot(markup: string, slot: string) {
  return markup.split(`data-slot="${slot}"`).length - 1
}

function sections(
  overrides: Partial<PortfolioShareSections> = {},
): PortfolioShareSections {
  return { ...PORTFOLIO_SHARE_PRESETS.full, ...overrides }
}

const sectionAssets = [
  asset({
    itemId: 1,
    cardId: 1,
    nameEn: "Visible alpha",
    quantity: 2,
    currentPrice: 123_456,
    recordedCostJpy: 100_000,
    purchasePrice: 50_000,
    costedCopyCount: 2,
  }),
  asset({
    itemId: 2,
    cardId: 2,
    cardCode: "OP01-002",
    baseCode: "OP01-002",
    nameEn: "Visible bravo",
    quantity: 1,
    currentPrice: 41_152,
    recordedCostJpy: 40_000,
    purchasePrice: 40_000,
  }),
]

describe("PortfolioShareCard presets", () => {
  it("exports the exact full, percent, and collection section maps", () => {
    const expected: Record<PortfolioSharePreset, PortfolioShareSections> = {
      full: {
        monetaryValues: true,
        performance: true,
        costBasis: true,
        allocation: true,
        holdings: true,
        holdingPrices: true,
        counts: true,
        date: true,
      },
      percent: {
        monetaryValues: false,
        performance: true,
        costBasis: false,
        allocation: true,
        holdings: true,
        holdingPrices: false,
        counts: false,
        date: true,
      },
      collection: {
        monetaryValues: false,
        performance: false,
        costBasis: false,
        allocation: false,
        holdings: true,
        holdingPrices: false,
        counts: true,
        date: true,
      },
    }

    expect(PORTFOLIO_SHARE_PRESETS).toEqual(expected)
    expect(Object.keys(PORTFOLIO_SHARE_PRESETS).sort()).toEqual(
      ["collection", "full", "percent"].sort(),
    )
  })

  it("does not mutate a preset while rendering or deriving a custom selection", () => {
    const before = structuredClone(PORTFOLIO_SHARE_PRESETS)
    const custom = {
      ...PORTFOLIO_SHARE_PRESETS.percent,
      counts: true,
    }

    renderShare({ sections: custom, assets: sectionAssets })

    expect(PORTFOLIO_SHARE_PRESETS).toEqual(before)
    expect(PORTFOLIO_SHARE_PRESETS.percent.counts).toBe(false)
    expect(custom.counts).toBe(true)
    expect(PORTFOLIO_SHARE_PRESETS.full).not.toBe(
      PORTFOLIO_SHARE_PRESETS.percent,
    )
    expect(PORTFOLIO_SHARE_PRESETS.full).not.toBe(
      PORTFOLIO_SHARE_PRESETS.collection,
    )
  })

  it("uses the full preset when sections are omitted", () => {
    const shared = {
      assets: sectionAssets,
      valuedCopyCount: 3,
      totalValueJpy: 288_064,
      totalCostJpy: 140_000,
      unrealizedPnl: 148_064,
      unrealizedPnlPercent: 105.76,
    }
    const implicit = renderShare(shared)
    const explicit = renderShare({
      ...shared,
      sections: PORTFOLIO_SHARE_PRESETS.full,
    })
    const fullSlots = [
      "portfolio-share-value",
      "portfolio-share-performance",
      "portfolio-share-cost-basis",
      "portfolio-share-allocation",
      "portfolio-share-gallery",
      "portfolio-share-holding-price",
      "portfolio-share-holding-count",
      "portfolio-share-copy-count",
      "portfolio-share-date",
    ]

    for (const slot of fullSlots) {
      expect(countSlot(implicit, slot), `implicit full: ${slot}`).toBeGreaterThan(
        0,
      )
      expect(countSlot(explicit, slot), `explicit full: ${slot}`).toBeGreaterThan(
        0,
      )
    }
  })

  it("keeps percentages and collection art in the percent preset without leaking money or counts", () => {
    const markup = renderShare({
      sections: PORTFOLIO_SHARE_PRESETS.percent,
      assets: sectionAssets,
      valuedCopyCount: 3,
      totalValueJpy: 288_064,
      totalCostJpy: 140_000,
      unrealizedPnl: 148_064,
      unrealizedPnlPercent: 105.76,
    })

    expect(markup).not.toContain('data-slot="portfolio-share-value"')
    expect(markup).not.toContain('data-slot="portfolio-share-pnl"')
    expect(markup).not.toContain('data-slot="portfolio-share-cost-basis"')
    expect(markup).not.toContain('data-slot="portfolio-share-holding-price"')
    expect(markup).not.toContain('data-slot="portfolio-share-gallery-counts"')
    expect(markup).not.toContain('data-slot="portfolio-share-holding-count"')
    expect(markup).not.toContain('data-slot="portfolio-share-copy-count"')
    expect(markup).not.toContain('data-slot="portfolio-share-holding-quantity"')
    expect(markup).not.toContain("288,064")
    expect(markup).not.toContain("148,064")
    expect(markup).not.toContain("140,000")
    expect(markup).not.toContain("246,912")
    expect(markup).not.toContain("41,152")

    expect(markup).toContain('data-slot="portfolio-share-performance"')
    expect(markup).toContain('data-slot="portfolio-share-roi"')
    expect(markup).toContain("+105.76%")
    expect(markup).toContain('data-slot="portfolio-share-allocation"')
    expect(
      elementForSlot(markup, "portfolio-share-allocation", "</section>"),
    ).toContain("%")
    expect(markup).toContain('data-slot="portfolio-share-gallery"')
    expect(markup).toContain('data-slot="portfolio-share-date"')
  })

  it("keeps only collection identity, holdings, counts, and date in the collection preset", () => {
    const markup = renderShare({
      sections: PORTFOLIO_SHARE_PRESETS.collection,
      assets: sectionAssets,
      valuedCopyCount: 3,
      totalValueJpy: 288_064,
      totalCostJpy: 140_000,
      unrealizedPnl: 148_064,
      unrealizedPnlPercent: 105.76,
    })

    expect(markup).not.toContain('data-slot="portfolio-share-value"')
    expect(markup).not.toContain('data-slot="portfolio-share-performance"')
    expect(markup).not.toContain('data-slot="portfolio-share-cost-basis"')
    expect(markup).not.toContain('data-slot="portfolio-share-allocation"')
    expect(markup).not.toContain('data-slot="portfolio-share-holding-price"')
    expect(markup).not.toContain("105.76%")
    expect(markup).not.toContain("288,064")
    expect(markup).not.toContain("246,912")
    expect(markup).not.toContain("41,152")

    expect(markup).toContain('data-slot="portfolio-share-gallery"')
    expect(markup).toContain('data-slot="portfolio-share-gallery-counts"')
    expect(markup).toContain('data-slot="portfolio-share-holding-quantity"')
    expect(markup).toContain('data-slot="portfolio-share-holding-count"')
    expect(markup).toContain('data-slot="portfolio-share-copy-count"')
    expect(markup).toContain('data-slot="portfolio-share-date"')
  })
})

describe("PortfolioShareCard section controls", () => {
  const financialProps: Partial<ShareProps> = {
    assets: sectionAssets,
    valuedCopyCount: 3,
    totalValueJpy: 288_064,
    totalCostJpy: 140_000,
    unrealizedPnl: 148_064,
    unrealizedPnlPercent: 105.76,
  }

  it("treats monetaryValues as the upper gate for every money amount while retaining percentages", () => {
    const markup = renderShare({
      ...financialProps,
      sections: sections({
        monetaryValues: false,
        holdingPrices: true,
      }),
    })

    expect(markup).not.toContain('data-slot="portfolio-share-value"')
    expect(markup).not.toContain('data-slot="portfolio-share-pnl"')
    expect(markup).not.toContain('data-slot="portfolio-share-cost-basis"')
    expect(markup).not.toContain('data-slot="portfolio-share-holding-price"')
    expect(markup).not.toContain("288,064")
    expect(markup).not.toContain("148,064")
    expect(markup).not.toContain("140,000")
    expect(markup).not.toContain("246,912")
    expect(markup).not.toContain("41,152")
    expect(markup).toContain('data-slot="portfolio-share-roi"')
    expect(markup).toContain("+105.76%")
    expect(
      elementForSlot(markup, "portfolio-share-allocation", "</section>"),
    ).toContain("%")
  })

  it("lets cost basis render independently from performance", () => {
    const markup = renderShare({
      ...financialProps,
      sections: sections({
        performance: false,
        costBasis: true,
      }),
    })

    expect(markup).not.toContain('data-slot="portfolio-share-pnl"')
    expect(markup).not.toContain('data-slot="portfolio-share-roi"')
    expect(markup).toContain('data-slot="portfolio-share-cost-basis"')
    expect(markup).toContain("140,000")
  })

  it("hides holding prices without affecting the portfolio value or performance", () => {
    const markup = renderShare({
      ...financialProps,
      sections: sections({ holdingPrices: false }),
    })

    expect(markup).toContain('data-slot="portfolio-share-value"')
    expect(markup).toContain("288,064")
    expect(markup).toContain('data-slot="portfolio-share-pnl"')
    expect(markup).toContain('data-slot="portfolio-share-cost-basis"')
    expect(markup).not.toContain('data-slot="portfolio-share-holding-price"')
    expect(markup).not.toContain("246,912")
    expect(markup).not.toContain("41,152")
  })

  it("hides aggregate and per-holding quantities together while keeping holdings", () => {
    const markup = renderShare({
      ...financialProps,
      sections: sections({ counts: false }),
    })

    expect(markup).toContain('data-slot="portfolio-share-gallery"')
    expect(markup).toContain('data-slot="portfolio-share-holding"')
    expect(markup).not.toContain('data-slot="portfolio-share-gallery-counts"')
    expect(markup).not.toContain('data-slot="portfolio-share-holding-count"')
    expect(markup).not.toContain('data-slot="portfolio-share-copy-count"')
    expect(markup).not.toContain('data-slot="portfolio-share-holding-quantity"')
  })

  it("keeps aggregate counts when holdings are hidden", () => {
    const markup = renderShare({
      ...financialProps,
      sections: sections({ holdings: false, counts: true }),
    })

    expect(markup).not.toContain('data-slot="portfolio-share-gallery"')
    expect(markup).not.toContain('data-slot="portfolio-share-holding"')
    expect(markup).not.toContain('data-slot="portfolio-share-holding-quantity"')
    expect(markup).toContain('data-slot="portfolio-share-holding-count"')
    expect(markup).toContain('data-slot="portfolio-share-copy-count"')
    expect(markup).toContain("2 holdings")
    expect(markup).toContain("3 cards")
  })

  it("toggles allocation and date independently from other content", () => {
    const markup = renderShare({
      ...financialProps,
      sections: sections({ allocation: false, date: false }),
    })

    expect(markup).not.toContain('data-slot="portfolio-share-allocation"')
    expect(markup).not.toContain('data-slot="portfolio-share-date"')
    expect(markup).toContain('data-slot="portfolio-share-value"')
    expect(markup).toContain('data-slot="portfolio-share-performance"')
    expect(markup).toContain('data-slot="portfolio-share-gallery"')
  })

  it("never lets sections override hidden-balance privacy", () => {
    const markup = renderShare({
      ...financialProps,
      sections: PORTFOLIO_SHARE_PRESETS.full,
      hideBalance: true,
    })

    expect(markup).toContain(MASKED)
    expect(markup).not.toContain("288,064")
    expect(markup).not.toContain("148,064")
    expect(markup).not.toContain("140,000")
    expect(markup).not.toContain("246,912")
    expect(markup).not.toContain("41,152")
    expect(markup).toContain("+105.76%")
    expect(
      elementForSlot(markup, "portfolio-share-allocation", "</section>"),
    ).toContain("%")
  })

  it("does not emit mask placeholders when monetary sections are intentionally off", () => {
    const markup = renderShare({
      ...financialProps,
      sections: PORTFOLIO_SHARE_PRESETS.percent,
      hideBalance: true,
    })

    expect(markup).not.toContain(MASKED)
    expect(markup).toContain("+105.76%")
    expect(markup).toContain('data-slot="portfolio-share-allocation"')
  })

  it("keeps partial-data guards above enabled sections", () => {
    const markup = renderShare({
      ...financialProps,
      sections: PORTFOLIO_SHARE_PRESETS.full,
      valuationComplete: false,
      performanceComplete: false,
      unrealizedPnl: null,
      unrealizedPnlPercent: null,
      valuedCopyCount: 2,
    })

    expect(markup).toContain("Estimated value")
    expect(markup).toContain("≈")
    expect(markup).not.toContain('data-slot="portfolio-share-performance"')
    expect(markup).not.toContain('data-slot="portfolio-share-pnl"')
    expect(markup).not.toContain('data-slot="portfolio-share-roi"')
    expect(markup).not.toContain('data-slot="portfolio-share-cost-basis"')
  })
})

describe("PortfolioShareCard visual contract", () => {
  it("renders the portfolio-snapshot artwork without banned visual effects", () => {
    const markup = renderShare()
    const root = openingTagForSlot(markup, "portfolio-share-card")

    expect(root).toContain('data-theme="portfolio-snapshot"')
    expect(markup.toLowerCase()).not.toContain("gradient")
    expect(markup.toLowerCase()).not.toContain("backdrop-blur")
  })

  it("shows at most four highest-value holdings with unique card ids", () => {
    const markup = renderShare({
      assets: [
        asset({
          itemId: 1,
          cardId: 101,
          nameEn: "Alpha primary",
          currentPrice: 1_000,
        }),
        asset({
          itemId: 2,
          cardId: 101,
          cardCode: "OP01-001_ALT",
          baseCode: "OP01-001_ALT",
          nameEn: "Alpha duplicate",
          currentPrice: 900,
        }),
        asset({
          itemId: 3,
          cardId: 102,
          cardCode: "OP01-002",
          baseCode: "OP01-002",
          nameEn: "Bravo",
          currentPrice: 800,
        }),
        asset({
          itemId: 4,
          cardId: 103,
          cardCode: "OP01-003",
          baseCode: "OP01-003",
          nameEn: "Charlie",
          currentPrice: 700,
        }),
        asset({
          itemId: 5,
          cardId: 104,
          cardCode: "OP01-004",
          baseCode: "OP01-004",
          nameEn: "Delta",
          currentPrice: 600,
        }),
        asset({
          itemId: 6,
          cardId: 105,
          cardCode: "OP01-005",
          baseCode: "OP01-005",
          nameEn: "Echo",
          currentPrice: 500,
        }),
      ],
      valuedCopyCount: 6,
      totalValueJpy: 4_500,
    })

    expect(countSlot(markup, "portfolio-share-holding")).toBe(4)
    expect(markup).toContain('data-card-id="101"')
    expect(markup).toContain('data-card-id="102"')
    expect(markup).toContain('data-card-id="103"')
    expect(markup).toContain('data-card-id="104"')
    expect(markup).not.toContain('data-card-id="105"')
    expect(markup).toContain("Alpha primary")
    expect(markup).not.toContain("Alpha duplicate")
    expect(markup).not.toContain("Echo")
  })

  it("proxies remote card art and always keeps a truthful fallback frame", () => {
    const remote =
      "https://cdn.example.test/cards/OP01-001.jpg?fit=cover&version=2"
    const markup = renderShare({
      assets: [
        asset({ imageUrl: remote }),
        asset({
          itemId: 2,
          cardId: 2,
          cardCode: "OP01-002",
          baseCode: "OP01-002",
          nameEn: "Fallback only",
          imageUrl: null,
        }),
      ],
      valuedCopyCount: 2,
      totalValueJpy: 2_000,
    }).replaceAll("&amp;", "&")
    const expectedProxy =
      `/_next/image?url=${encodeURIComponent(remote)}&w=640&q=75`

    expect(markup).toContain(`src="${expectedProxy}"`)
    expect(countSlot(markup, "portfolio-share-card-fallback")).toBe(2)

    const fallbackFrames = markup.match(
      /<div[^>]*data-slot="portfolio-share-card-fallback"[\s\S]*?<\/div>/gu,
    )
    expect(fallbackFrames).toHaveLength(2)
    for (const frame of fallbackFrames ?? []) {
      expect(frame).not.toMatch(/>\s*\?\s*</u)
      expect(frame).not.toContain('alt="?"')
    }
  })

  it("separates distinct holding count from total physical quantity", () => {
    const markup = renderShare({
      assets: [
        asset({ quantity: 2 }),
        asset({
          itemId: 2,
          cardId: 2,
          cardCode: "OP01-002",
          baseCode: "OP01-002",
          quantity: 5,
        }),
      ],
      valuedCopyCount: 7,
      totalValueJpy: 7_000,
    })
    const holdings = elementForSlot(
      markup,
      "portfolio-share-holding-count",
      "</span>",
    )
    const copies = elementForSlot(
      markup,
      "portfolio-share-copy-count",
      "</span>",
    )

    expect(holdings).toContain("2 holdings")
    expect(holdings).not.toContain("7 cards")
    expect(copies).toContain("7 cards")
    expect(copies).not.toContain("2 holdings")
  })

  it("shows an em dash instead of fabricating a zero price", () => {
    const markup = renderShare({
      totalValueJpy: 0,
      totalCostJpy: 0,
      unrealizedPnl: null,
      unrealizedPnlPercent: null,
      valuedCopyCount: 0,
      valuationComplete: false,
      performanceComplete: false,
      assets: [
        asset({
          currentPrice: null,
          currentPriceThb: null,
          recordedCostJpy: 0,
          costedCopyCount: 0,
          purchasePrice: null,
        }),
      ],
    })
    const holding = elementForSlot(
      markup,
      "portfolio-share-holding",
      "</figure>",
    )

    expect(holding).toContain("—")
    expect(holding).not.toContain("¥0")
  })

  it("renders zero P/L as neutral without gain or loss arrows", () => {
    const markup = renderShare({
      totalValueJpy: 1_000,
      totalCostJpy: 1_000,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      assets: [
        asset({
          recordedCostJpy: 1_000,
          purchasePrice: 1_000,
          currentPrice: 1_000,
        }),
      ],
    })

    expect(markup).toContain('data-trend="neutral"')
    expect(markup).not.toContain('data-trend="up"')
    expect(markup).not.toContain('data-trend="down"')
    expect(markup).not.toContain("▲")
    expect(markup).not.toContain("▼")
  })

  it("marks long portfolio names and values with deterministic fit modes", () => {
    const markup = renderShare({
      portfolioName:
        "A deliberately long collector portfolio name that must remain readable",
      totalValueJpy: Number.MAX_SAFE_INTEGER,
      valuedCopyCount: 1,
    })

    expect(openingTagForSlot(markup, "portfolio-share-name")).toContain(
      'data-fit="compact"',
    )
    expect(openingTagForSlot(markup, "portfolio-share-value")).toContain(
      'data-fit="tight"',
    )
  })
})

describe("PortfolioShareCard financial and privacy contract", () => {
  it("keeps partial value coverage but omits incomplete P/L and cost", () => {
    const markup = renderShare({
      valuationComplete: false,
      performanceComplete: false,
      unrealizedPnl: null,
      unrealizedPnlPercent: null,
      assets: [asset()],
    })

    expect(markup).toContain("Estimated value")
    expect(markup).toContain("≈")
    expect(markup).not.toContain('data-slot="portfolio-share-performance"')
    expect(markup).not.toContain("Unrealized P/L")
    expect(markup).not.toContain("Cost basis")
    expect(markup).not.toContain(">ROI<")
  })

  it("masks monetary values while preserving non-sensitive percentages", () => {
    const markup = renderShare({
      totalValueJpy: 123_456,
      totalCostJpy: 65_432,
      unrealizedPnl: 58_024,
      unrealizedPnlPercent: 88.68,
      assets: [
        asset({
          currentPrice: 123_456,
          recordedCostJpy: 65_432,
          purchasePrice: 65_432,
        }),
      ],
      hideBalance: true,
    })

    expect(markup).toContain(MASKED)
    expect(markup).not.toContain("123,456")
    expect(markup).not.toContain("65,432")
    expect(markup).not.toContain("58,024")
    expect(markup).toContain("+88.68%")
  })
})
