import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { getActiveGameConfigs } from "@/lib/game-config"

import { GameSwitcher, getGameSwitcherState } from "./game-switcher"

vi.mock("next/navigation", () => ({
  usePathname: () => "/opcg/search",
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/stores/ui-store", () => ({
  useUIStore: (
    selector: (state: {
      language: "TH"
      currentGame: string
      setCurrentGame: () => void
      dismissedSwitcherHint: boolean
      dismissSwitcherHint: () => void
    }) => unknown,
  ) =>
    selector({
      language: "TH",
      currentGame: "opcg",
      setCurrentGame: vi.fn(),
      dismissedSwitcherHint: true,
      dismissSwitcherHint: vi.fn(),
    }),
}))

describe("GameSwitcher", () => {
  it("keeps the Header switcher rendered while only one catalog is live", () => {
    expect(getActiveGameConfigs()).toHaveLength(1)

    const markup = renderToStaticMarkup(<GameSwitcher />)

    expect(markup).not.toBe("")
    expect(markup).toContain('data-slot="dropdown-menu-trigger"')
    expect(markup).toContain('aria-label="เลือกเกม: One Piece Card Game"')
    expect(markup).toContain('data-slot="game-logo"')
    expect(markup).toContain('data-game="opcg"')
    expect(markup).toContain("%2Fgames%2Fone-piece-logo.png")
    expect(markup).toContain("surface-2")
    expect(markup).toContain("rounded-full")
    expect(markup).toContain("ring-hair")
    expect(markup).toContain("lucide-chevron-down")
    expect(markup).toContain("OPCG")
  })

  it("drops the standalone pill surface inside the compound catalog control", () => {
    const markup = renderToStaticMarkup(
      <GameSwitcher appearance="context" />,
    )

    expect(markup).toContain("rounded-lg")
    expect(markup).not.toContain("surface-2")
  })

  it("keeps a 44px crest-only fallback on the narrowest mobile width", () => {
    const markup = renderToStaticMarkup(<GameSwitcher compactOnNarrow />)

    expect(markup).toContain("size-11")
    expect(markup).toContain("min-[360px]:w-auto")
    expect(markup).toContain("hidden min-[360px]:inline")
    expect(markup).toContain("hidden min-[360px]:block")
    expect(markup).toContain("surface-2")
    expect(markup).toContain("rounded-full")
  })

  it("falls back from stale Pokémon state to OPCG and keeps Pokémon blocked", () => {
    const state = getGameSwitcherState("pokemon")

    expect(state.active?.slug).toBe("opcg")
    expect(state.active?.logoUrl).toBe("/games/one-piece-logo.png")
    expect(
      state.options.map(({ game, isActive, launchReady }) => ({
        slug: game.slug,
        logoUrl: game.logoUrl,
        isActive,
        launchReady,
      })),
    ).toEqual([
      {
        slug: "opcg",
        logoUrl: "/games/one-piece-logo.png",
        isActive: true,
        launchReady: true,
      },
      {
        slug: "pokemon",
        logoUrl: "/games/pokemon-logo.png",
        isActive: false,
        launchReady: false,
      },
    ])
  })
})
