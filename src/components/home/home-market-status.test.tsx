import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it } from "vitest"

import { useUIStore } from "@/stores/ui-store"
import { HomeMarketStatus } from "./home-market-status"

const card = {
  cardCode: "OP05-119_p7",
  nameJp: "モンキー・D・ルフィ",
  nameEn: "Monkey.D.Luffy",
  nameTh: null,
  rarity: "P-SEC",
  imageUrl: null,
  latestPriceJpy: 1_000_000,
  set: { code: "OP05" },
}

describe("home market status", () => {
  beforeEach(() => {
    useUIStore.setState({ language: "TH", currency: "THB" })
  })

  it("groups the highest-value card ahead of the three market metrics", () => {
    const markup = renderToStaticMarkup(
      <HomeMarketStatus
        card={card}
        totalCards={3_838}
        totalValue={12_803_362}
        exchangeRate={0.296}
      />,
    )

    const featured = markup.indexOf("มูลค่าสูงสุด")
    const totalValue = markup.indexOf('data-slot="total-value"')
    const totalCards = markup.indexOf('data-slot="total-cards"')
    const exchangeRate = markup.indexOf('data-slot="exchange-rate"')

    expect(markup).toContain('data-slot="home-market-status"')
    expect(markup).toContain('data-slot="home-market-metrics"')
    expect(markup).toContain("lg:grid-cols-2")
    expect(markup).toContain('data-slot="highest-value-card"')
    expect(featured).toBeGreaterThan(-1)
    expect(totalValue).toBeGreaterThan(featured)
    expect(totalCards).toBeGreaterThan(totalValue)
    expect(exchangeRate).toBeGreaterThan(totalCards)
    expect(markup).toContain("3,838")
    expect(markup).toContain("2,688,706 ฿")
    expect(markup).toContain("0.296")
  })

  it("keeps aggregate value neutral and links it to the market overview", () => {
    const markup = renderToStaticMarkup(
      <HomeMarketStatus
        card={card}
        totalCards={3_838}
        totalValue={12_803_362}
        exchangeRate={0.296}
      />,
    )

    expect(markup).toContain('href="/opcg/market-overview"')
    expect(markup).not.toContain("text-price-up")
    expect(markup).not.toContain("text-price-down")
  })

  it("keeps the market metrics visible when no priced card is available", () => {
    const markup = renderToStaticMarkup(
      <HomeMarketStatus
        card={null}
        totalCards={3_838}
        totalValue={12_803_362}
        exchangeRate={0.296}
      />,
    )

    expect(markup).toContain('data-slot="highest-value-unavailable"')
    expect(markup).toContain('data-slot="home-market-metrics"')
    expect(markup).toContain("3,838")
    expect(markup).toContain("2,688,706 ฿")
    expect(markup).toContain("0.296")
  })
})
