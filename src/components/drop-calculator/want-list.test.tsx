import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { WantList } from "./want-list"

const card = {
  id: 1,
  cardCode: "OP01-120",
  nameJp: "Shanks",
  nameEn: "Shanks",
  nameTh: "แชงคูส",
  rarity: "P-SEC",
  isParallel: true,
  imageUrl: null,
  latestPriceJpy: 2800,
}

describe("WantList result hierarchy", () => {
  it("shows the combined chance before the selected-card details", () => {
    const markup = renderToStaticMarkup(
      <WantList
        wantCards={[card]}
        wantResults={[{ card, chance: 0.026 }]}
        allChance={0.026}
        totalWantValue={2800}
        purchaseCost={5280}
        unit="box"
        quantity={1}
        onRemove={() => {}}
        onClearAll={() => {}}
      />,
    )

    expect(markup.indexOf('data-testid="drop-chance-summary"')).toBeGreaterThan(-1)
    expect(markup.indexOf('data-testid="drop-want-list"')).toBeGreaterThan(
      markup.indexOf('data-testid="drop-chance-summary"'),
    )
    expect(markup).toContain("2.6%")
  })
})
