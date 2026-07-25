import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import Loading from "./loading"

describe("market overview loading state", () => {
  it("mirrors the responsive ranked-card layout without a tablet density jump", () => {
    const markup = renderToStaticMarkup(<Loading />)

    expect(markup).toContain('data-slot="market-top-cards-loading-rail"')
    expect(markup).toContain("md:px-6 lg:hidden")
    expect(markup).toContain('data-slot="market-top-cards-loading-grid"')
    expect(markup).toContain("hidden grid-cols-6 gap-2 lg:grid")
    expect(markup).not.toContain("grid-cols-3 gap-2 lg:grid-cols-6")
  })

  it("matches the live section hierarchy and prevents lower panels from stretching", () => {
    const markup = renderToStaticMarkup(<Loading />)

    const snapshot = markup.indexOf('data-slot="market-snapshot-loading"')
    const topCards = markup.indexOf('data-slot="market-top-cards-loading"')
    const rarity = markup.indexOf('data-slot="market-rarity-loading"')
    const topSets = markup.indexOf('data-slot="market-top-sets-loading"')

    expect(snapshot).toBeLessThan(topCards)
    expect(topCards).toBeLessThan(rarity)
    expect(rarity).toBeLessThan(topSets)
    expect(markup).toContain("grid items-start gap-8 lg:grid-cols-2")
    expect(markup).toContain("surface-1 hairline rounded-lg")
  })
})
