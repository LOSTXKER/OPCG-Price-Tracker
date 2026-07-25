import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/shared/filter-modal", async () => {
  const React = await import("react")

  return {
    FilterModal: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", { "data-drop-filter": true }, children),
  }
})

import { useUIStore } from "@/stores/ui-store"

import { CardPicker } from "./card-picker"

const noop = () => undefined

beforeEach(() => {
  useUIStore.setState({ language: "TH" })
})

describe("CardPicker", () => {
  it("keeps set selection in the responsive controls and matches the set-page card wall", () => {
    const markup = renderToStaticMarkup(
      <CardPicker
        sets={[
          {
            id: 2,
            code: "OP02",
            name: "Paramount War",
            nameEn: "Paramount War",
            nameTh: "สงครามมารีนฟอร์ด",
            type: "BOOSTER",
            releaseDate: null,
            imageUrl: null,
          },
        ]}
        selectedCode="OP02"
        setsLoading={false}
        cards={[
          {
            id: 20,
            cardCode: "OP02-001",
            nameJp: "ウタ",
            nameEn: "Uta",
            nameTh: "อูตะ",
            rarity: "SEC",
            isParallel: false,
            imageUrl: null,
            latestPriceJpy: 1200,
          },
        ]}
        uniqueRarities={["SEC"]}
        wantSet={new Set([20])}
        wantCount={1}
        cardSearch=""
        rarityFilter={["SEC"]}
        variantFilter="regular"
        onToggleWant={noop}
        onSearchChange={noop}
        onRarityChange={noop}
        onVariantChange={noop}
        onSetChange={noop}
      />,
    )

    expect(markup.indexOf("OP02")).toBeLessThan(markup.indexOf("ค้นหาชื่อหรือรหัส"))
    expect(markup).toContain("grid-cols-3")
    expect(markup).toContain("sm:grid-cols-4")
    expect(markup).toContain("lg:grid-cols-5")
    expect(markup).toContain("xl:grid-cols-6")
    expect(markup).toContain("hidden w-52 shrink-0 lg:block")
    expect(markup).toContain("surface-1")
    expect(markup).toContain("group-lift")
    expect(markup).toContain('aria-pressed="true"')
    expect(markup).toContain("min-h-11")
    expect(markup).toContain('data-drop-filter="true"')
    expect(markup).toContain("อูตะ")
  })
})
