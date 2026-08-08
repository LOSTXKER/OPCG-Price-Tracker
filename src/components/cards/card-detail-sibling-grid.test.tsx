import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { SiblingGrid } from "./card-detail-sibling-grid"
import type { SiblingCard } from "./card-detail/types"

/**
 * "รุ่นอื่นของการ์ดใบนี้" on the card page. Every tile here is the same card
 * number, so this grid used to append the raw `_p1`/`_p2` printing suffix to
 * the set-code pill to tell them apart — publishing an internal database key
 * (owner ruling เบส 2026-08-08). The rarity badge and the artwork do that job.
 */
const siblings: SiblingCard[] = [
  {
    id: 1,
    cardCode: "OP09-001",
    nameJp: "シャンクス",
    nameEn: "Shanks",
    rarity: "L",
    isParallel: false,
    imageUrl: null,
    latestPriceJpy: 400,
    set: { code: "OP09" },
  },
  {
    id: 2,
    cardCode: "OP09-001_p1",
    nameJp: "シャンクス",
    nameEn: "Shanks",
    rarity: "P-L",
    isParallel: true,
    imageUrl: null,
    latestPriceJpy: 12_000,
    set: { code: "OP09" },
  },
  {
    id: 3,
    cardCode: "OP09-001_p2",
    nameJp: "シャンクス",
    nameEn: "Shanks",
    rarity: "P-L",
    isParallel: true,
    imageUrl: null,
    latestPriceJpy: 26_000,
    set: { code: "OP09" },
  },
]

function render() {
  return renderToStaticMarkup(
    <SiblingGrid siblings={siblings} lang="TH" cols={3} mainCardCode="OP09-001_p1" />,
  )
}

describe("SiblingGrid", () => {
  it("shows no `_p` printing suffix anywhere in the rendered text", () => {
    const text = render().replace(/<[^>]+>/g, " ")

    expect(text).not.toMatch(/_p\d/i)
    expect(text).not.toMatch(/_r\d/i)
  })

  it("still links each tile at its full card code — the URL is the real address", () => {
    const markup = render()

    expect(markup).toContain('href="/opcg/cards/OP09-001_p1"')
    expect(markup).toContain('href="/opcg/cards/OP09-001_p2"')
  })

  it("keeps the set code and the rarity, which are what separate the printings", () => {
    const text = render().replace(/<[^>]+>/g, " ")

    expect(text).toContain("OP09")
    expect(text).toContain("P-L")
  })

  it("marks the current printing so the visitor knows which tile they are on", () => {
    const markup = render()

    expect(markup).toContain('aria-current="page"')
  })
})
