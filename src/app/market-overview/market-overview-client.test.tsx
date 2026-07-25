import { beforeEach, describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import { useUIStore } from "@/stores/ui-store"

import { MarketOverviewClient } from "./market-overview-client"

const data = {
  totalCards: 1_240,
  totalValue: 9_800_000,
  avgPrice: 7_903,
  setCount: 24,
  rarityBreakdown: [
    { rarity: "SEC", count: 20, totalValue: 2_400_000 },
    { rarity: "L", count: 40, totalValue: 1_900_000 },
    { rarity: "SP", count: 45, totalValue: 1_600_000 },
    { rarity: "SR", count: 220, totalValue: 1_300_000 },
    { rarity: "R", count: 310, totalValue: 1_000_000 },
    { rarity: "UC", count: 300, totalValue: 900_000 },
    { rarity: "C", count: 305, totalValue: 700_000 },
  ],
  topSetsByValue: Array.from({ length: 8 }, (_, index) => ({
    code: `OP0${index + 1}`,
    name: `A deliberately long set name number ${index + 1}`,
    boxImageUrl: null,
    cardCount: 120 - index,
    totalValue: 1_000_000 - index * 50_000,
    change7d: index % 2 === 0 ? 2.4 : -1.2,
  })),
  topCards: Array.from({ length: 6 }, (_, index) => ({
    cardCode: `OP01-00${index + 1}`,
    nameJp: `カード ${index + 1}`,
    nameEn: `Card ${index + 1}`,
    nameTh: `การ์ด ${index + 1}`,
    rarity: index === 0 ? "SEC" : "SR",
    imageUrl: null,
    latestPriceJpy: 120_000 - index * 5_000,
    priceChange7d: index % 2 === 0 ? 3.1 : -2.1,
    setCode: "OP01",
  })),
  movers: { up: 410, down: 260, flat: 570 },
  weightedDelta7d: 1.82,
  lastUpdatedAt: "2026-07-24T06:00:00.000Z",
}

describe("MarketOverviewClient", () => {
  beforeEach(() => {
    useUIStore.setState({ language: "TH", currency: "THB" })
  })

  it("presents the market as a decision-first document in the intended order", () => {
    const markup = renderToStaticMarkup(<MarketOverviewClient data={data} />)

    const snapshot = markup.indexOf('data-slot="market-snapshot"')
    const topCards = markup.indexOf('data-slot="market-top-cards"')
    const rarity = markup.indexOf('data-slot="market-rarity"')
    const topSets = markup.indexOf('data-slot="market-top-sets"')

    expect(markup).toContain("สรุปมูลค่าและสถิติของตลาดการ์ด One Piece TCG")
    expect(snapshot).toBeGreaterThan(-1)
    expect(snapshot).toBeLessThan(topCards)
    expect(topCards).toBeLessThan(rarity)
    expect(rarity).toBeLessThan(topSets)
    expect(markup).toContain(">Raw<")
    expect(markup).toContain(">7d<")
  })

  it("keeps the ranked cards compact through tablet widths and fixes the stale CTA", () => {
    const markup = renderToStaticMarkup(<MarketOverviewClient data={data} />)

    expect(markup).toContain('data-slot="market-top-cards-rail"')
    expect(markup).toContain("md:px-6 lg:hidden")
    expect(markup).toContain('data-slot="market-top-cards-grid"')
    expect(markup).toContain("hidden grid-cols-6 gap-2 lg:grid")
    expect(markup).not.toContain("grid-cols-3 gap-2 sm:grid")
    expect(markup).toContain('href="/"')
    expect(markup).not.toContain("?sort=price_desc")
  })

  it("uses six non-overlapping mobile rows and keeps the complete sets destination", () => {
    const markup = renderToStaticMarkup(<MarketOverviewClient data={data} />)
    const mobileRows =
      markup.match(/data-slot="market-top-set-mobile-row"/g) ?? []
    const desktopRows = markup.match(/data-slot="market-top-set-row"/g) ?? []

    expect(mobileRows).toHaveLength(6)
    expect(desktopRows).toHaveLength(6)
    expect(markup).toContain("min-h-14")
    expect(markup).toContain("min-w-0 truncate")
    expect(markup).toContain('href="/opcg/sets"')
    expect(markup).not.toContain("OP07")
    expect(markup).not.toContain("OP08")
  })

  it("exposes the rarity disclosure state and reachable small controls", () => {
    const markup = renderToStaticMarkup(<MarketOverviewClient data={data} />)

    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain('aria-controls="market-rarity-rows"')
    expect(markup).toContain("tap-safe")
    expect(markup).toContain("min-h-11")
  })
})
