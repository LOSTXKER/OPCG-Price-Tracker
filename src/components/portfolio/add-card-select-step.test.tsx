import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const gameConfigHarness = vi.hoisted(() => ({
  activeGames: [
    {
      slug: "opcg",
      filterName: "One Piece",
      shortName: "OPCG",
      nameEn: "One Piece",
    },
  ],
}))

const selectHarness = vi.hoisted(() => ({
  onGameValueChange: null as null | ((value: string) => void),
}))

vi.mock("@/lib/game-config", async () => {
  const actual = await vi.importActual<typeof import("@/lib/game-config")>(
    "@/lib/game-config",
  )

  return {
    ...actual,
    getActiveGameConfigs: () => gameConfigHarness.activeGames,
  }
})

vi.mock("@/components/ui/select", async () => {
  const React = await import("react")

  return {
    Select: ({
      children,
      value,
      onValueChange,
    }: {
      children?: React.ReactNode
      value?: string
      onValueChange?: (value: string) => void
    }) => {
      if (value === "opcg") {
        selectHarness.onGameValueChange = onValueChange ?? null
      }

      return React.createElement(
        "div",
        {
          "data-slot": "mock-select",
          "data-value": value,
        },
        children,
      )
    },
    SelectTrigger: ({
      children,
      className,
      "aria-label": ariaLabel,
    }: {
      children?: React.ReactNode
      className?: string
      "aria-label"?: string
    }) =>
      React.createElement(
        "button",
        { type: "button", className, "aria-label": ariaLabel },
        children,
      ),
    SelectContent: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children),
    SelectItem: ({
      children,
      value,
    }: {
      children?: React.ReactNode
      value: string
    }) =>
      React.createElement("div", { "data-value": value }, children),
  }
})

vi.mock("@/components/shared/filter-modal", async () => {
  const React = await import("react")

  return {
    FilterModal: ({ blurBackdrop }: { blurBackdrop?: boolean }) =>
      React.createElement("div", {
        "data-picker-filter-blur": String(Boolean(blurBackdrop)),
      }),
  }
})

vi.mock("@/components/ui/dialog", async () => {
  const React = await import("react")

  return {
    DialogHeader: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children),
    DialogTitle: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("h2", null, children),
    DialogDescription: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("p", null, children),
  }
})

import { SelectStep } from "./add-card-select-step"

const noop = () => undefined

const baseProps = {
  query: "",
  setQuery: noop,
  displayCards: [],
  showEmpty: false,
  isFiltered: false,
  activeGame: "opcg",
  onGameChange: noop,
  sets: [],
  activeSet: null,
  selectSetCode: noop,
  activeRarity: null,
  setActiveRarity: noop,
  activeColor: null,
  setActiveColor: noop,
  activeCardType: null,
  setActiveCardType: noop,
  activeVariant: null,
  setActiveVariant: noop,
  showFilters: false,
  setShowFilters: noop,
  activeFilterCount: 0,
  clearAllFilters: noop,
  onSelectCard: noop,
}

describe("SelectStep filter layering", () => {
  beforeEach(() => {
    gameConfigHarness.activeGames = [
      {
        slug: "opcg",
        filterName: "One Piece",
        shortName: "OPCG",
        nameEn: "One Piece",
      },
    ]
    selectHarness.onGameValueChange = null
  })

  it("requests a blurred backdrop for its nested filter dialog", () => {
    const markup = renderToStaticMarkup(
      <SelectStep
        {...baseProps}
        loading={false}
        showFilters
      />,
    )

    expect(markup).toContain('data-picker-filter-blur="true"')
    expect(markup).toContain('data-slot="card-picker-game-static"')
    expect(markup).toContain("One Piece")
    expect(markup).not.toContain("Pokémon")
    expect(markup).not.toContain("เร็ว ๆ นี้")

    expect(markup).toContain('data-slot="card-picker-context-controls"')
    const gameControl = markup.indexOf('data-slot="card-picker-game-control"')
    const setControl = markup.indexOf('data-slot="card-picker-set-control"')
    const searchControl = markup.indexOf('data-slot="card-picker-search-control"')
    expect(gameControl).toBeGreaterThan(-1)
    expect(setControl).toBeGreaterThan(gameControl)
    expect(searchControl).toBeGreaterThan(setControl)
    expect(markup).not.toMatch(/>\s*[123]\s*<\/span>/)
  })

  it("announces the initial loading skeleton instead of showing a blank list", () => {
    const markup = renderToStaticMarkup(
      <SelectStep {...baseProps} loading />,
    )

    expect(markup).toContain('role="status"')
    expect(markup).toContain("กำลังโหลด")
    expect(markup).not.toContain('role="alert"')
  })

  it("separates load failure from an empty search and exposes retry", () => {
    const markup = renderToStaticMarkup(
      <SelectStep
        {...baseProps}
        loading={false}
        loadError
        onRetry={noop}
      />,
    )

    expect(markup).toContain('role="alert"')
    expect(markup).toContain("โหลดข้อมูลไม่สำเร็จ")
    expect(markup).toContain("ลองใหม่")
    expect(markup).not.toContain("ไม่พบการ์ด")
  })

  it("makes the whole result row expose its selected state", () => {
    const markup = renderToStaticMarkup(
      <SelectStep
        {...baseProps}
        loading={false}
        displayCards={[
          {
            id: 118,
            cardCode: "OP13-118_p3",
            nameJp: "モンキー・D・ルフィ",
            nameEn: "Monkey.D.Luffy",
            rarity: "P-SEC",
            imageUrl: null,
            latestPriceJpy: 1000,
          },
        ]}
        isSelected={() => true}
      />,
    )

    expect(markup).toContain('data-slot="card-picker-results-list"')
    expect(markup).toContain('aria-pressed="true"')
    expect(markup).toContain("Monkey.D.Luffy")
  })

  it("renders a game selector and forwards the choice when 2 games are live", () => {
    gameConfigHarness.activeGames = [
      {
        slug: "opcg",
        filterName: "One Piece",
        shortName: "OPCG",
        nameEn: "One Piece",
      },
      {
        slug: "pokemon",
        filterName: "Pokémon",
        shortName: "Pokémon",
        nameEn: "Pokémon",
      },
    ]
    const onGameChange = vi.fn()

    const markup = renderToStaticMarkup(
      <SelectStep
        {...baseProps}
        loading={false}
        onGameChange={onGameChange}
      />,
    )

    expect(markup).not.toContain('data-slot="card-picker-game-static"')
    expect(markup).toContain('aria-label="เลือกเกม"')
    expect(markup).toContain("One Piece")
    expect(markup).toContain("Pokémon")

    expect(selectHarness.onGameValueChange).not.toBeNull()
    selectHarness.onGameValueChange?.("pokemon")
    expect(onGameChange).toHaveBeenCalledWith("pokemon")
  })
})
