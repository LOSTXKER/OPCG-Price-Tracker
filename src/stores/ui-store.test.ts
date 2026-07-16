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
