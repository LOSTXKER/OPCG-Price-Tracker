import { describe, expect, it, vi } from "vitest"

import { selectPersistedUIState, useUIStore } from "./ui-store"

describe("portfolio balance privacy preference", () => {
  it("updates through the shared store and is included in persisted preferences", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    useUIStore.getState().setPortfolioBalanceHidden(true)

    expect(useUIStore.getState().portfolioBalanceHidden).toBe(true)

    const persisted = selectPersistedUIState(useUIStore.getState())

    expect(persisted.portfolioBalanceHidden).toBe(true)
    useUIStore.getState().setPortfolioBalanceHidden(false)
    consoleError.mockRestore()
  })
})

describe("current game preference", () => {
  it("rejects roadmap and unknown games at the shared store boundary", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    useUIStore.getState().setCurrentGame("pokemon")
    expect(useUIStore.getState().currentGame).toBe("opcg")

    useUIStore.getState().setCurrentGame("missing")
    expect(useUIStore.getState().currentGame).toBe("opcg")

    consoleError.mockRestore()
  })
})
