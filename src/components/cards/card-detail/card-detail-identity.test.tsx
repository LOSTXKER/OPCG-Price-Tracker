import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/stores/ui-store", () => ({
  useUIStore: (selector: (state: { language: "TH" }) => unknown) =>
    selector({ language: "TH" }),
}))

vi.mock("@/stores/watchlist-store", () => ({
  useWatchlistStore: (
    selector: (state: {
      loaded: boolean
      ids: Set<number>
      limitHit: boolean
      load: () => Promise<void>
      toggle: () => Promise<void>
    }) => unknown,
  ) =>
    selector({
      loaded: true,
      ids: new Set<number>(),
      limitHit: false,
      load: async () => {},
      toggle: async () => {},
    }),
}))

vi.mock("@/components/shared/upgrade-dialog", () => ({
  useUpgradeDialog: () => ({ openUpgradeDialog: vi.fn() }),
}))

import { CardDetailIdentity } from "./card-detail-identity"
import type { CardDetailProps } from "./types"

const card: CardDetailProps["card"] = {
  id: 1,
  cardCode: "OP01-003_p1",
  baseCode: "OP01-003",
  nameJp: "モンキー・D・ルフィ",
  nameEn: "Monkey.D.Luffy",
  nameTh: "มังกี้ ดี. ลูฟี่",
  cardType: "LEADER",
  color: "แดง",
  colorEn: "Red",
  rarity: "SR",
  isParallel: true,
  viewCount: 1234,
  imageUrl: null,
  latestPriceJpy: 2_100,
  latestPriceThb: null,
  priceChange24h: null,
  priceChange7d: null,
  priceChange30d: 12.5,
  set: { code: "OP01", name: "Romance Dawn", nameEn: "Romance Dawn", nameTh: null },
  price: null,
  chartData: [],
}

function renderIdentity() {
  return renderToStaticMarkup(
    <CardDetailIdentity
      card={card}
      displayName="มังกี้ ดี. ลูฟี่"
      lang="TH"
      onAlert={() => {}}
      onShare={() => {}}
    />,
  )
}

describe("CardDetailIdentity H1", () => {
  it("keeps the visible heading text as the card name only — no visual change", () => {
    const markup = renderIdentity()
    const h1Match = markup.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
    expect(h1Match).not.toBeNull()
    const h1Inner = h1Match![1]!

    // Visible text nodes only: strip the sr-only spans' markup and check the
    // remaining text is exactly the card name — the owner's "name only, no
    // code" visual decision is unchanged.
    const visibleText = h1Inner.replace(/<span class="sr-only">.*?<\/span>/g, "").trim()
    expect(visibleText).toBe("มังกี้ ดี. ลูฟี่")
  })

  it("carries \"ราคา\" + the card code in the H1's accessible/crawlable text, screen-reader only", () => {
    const markup = renderIdentity()
    const h1Match = markup.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
    const h1Inner = h1Match![1]!
    // Text content a crawler/AT reads includes the sr-only spans.
    const accessibleText = h1Inner.replace(/<[^>]+>/g, "")

    expect(accessibleText).toContain("ราคา")
    expect(accessibleText).toContain("มังกี้ ดี. ลูฟี่")
    // The reader-facing code (no `_p1` printing suffix — baseCardCode).
    expect(accessibleText).toContain("OP01-003")
    expect(accessibleText).not.toContain("OP01-003_p1")

    // sr-only text is visually hidden (not a duplicate visible heading).
    expect(h1Inner).toContain('<span class="sr-only">')
  })

  it("renders exactly one H1 on the identity block", () => {
    const markup = renderIdentity()
    expect(markup.match(/<h1[^>]*>/g)).toHaveLength(1)
  })

  it("still shows the code and rarity in the meta line below the heading, outside the H1", () => {
    const markup = renderIdentity()
    const afterH1 = markup.slice(markup.indexOf("</h1>"))

    expect(afterH1).toContain("OP01-003")
    expect(afterH1).toContain("SR")
  })
})
