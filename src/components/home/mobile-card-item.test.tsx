import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { CardRow } from "./market-types"
import { MobileCardItem } from "./mobile-card-item"

const CARD: CardRow = {
  id: 1,
  cardCode: "TST-001",
  nameJp: "Test Card",
  rarity: "C",
  isParallel: false,
  latestPriceJpy: 268_800,
  priceChange24h: 26.8,
  psa10PriceUsd: 1_200,
}

describe("MobileCardItem price hierarchy", () => {
  it("stacks the price above its change instead of flowing them inline", () => {
    const markup = renderToStaticMarkup(
      <MobileCardItem
        card={CARD}
        rank={1}
        changePeriod="24h"
        sparkline={[100, 104, 102, 110]}
      />,
    )

    expect(markup).toContain('data-slot="mobile-price-stack"')
    expect(markup).toContain(
      'class="flex shrink-0 flex-col items-end gap-1 text-right"',
    )
    expect(markup).toContain(
      'class="font-price flex items-baseline justify-end gap-1 text-sm font-semibold"',
    )
    expect(markup).not.toContain(
      'class="font-price inline-flex items-baseline justify-end gap-1 text-sm font-semibold"',
    )
    expect(markup).toContain("<svg")
    expect(markup).toContain("+26.8%")
  })

  it("keeps the reserved history line inside the same stack for graded prices", () => {
    const markup = renderToStaticMarkup(
      <MobileCardItem card={CARD} rank={1} grade="psa_10" />,
    )

    expect(markup).toContain('data-slot="mobile-price-stack"')
    expect(markup).toContain("flex-col")
    expect(markup).toContain("min-h-4")
    expect(markup).not.toContain("+26.8%")
  })
})
