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
    expect(markup).toContain("OPCG")
  })

  it("falls back from stale Pokémon state to OPCG and keeps Pokémon blocked", () => {
    const state = getGameSwitcherState("pokemon")

    expect(state.active?.slug).toBe("opcg")
    expect(
      state.options.map(({ game, isActive, launchReady }) => ({
        slug: game.slug,
        isActive,
        launchReady,
      })),
    ).toEqual([
      { slug: "opcg", isActive: true, launchReady: true },
      { slug: "pokemon", isActive: false, launchReady: false },
    ])
  })
})
