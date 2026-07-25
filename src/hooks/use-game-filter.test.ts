import { describe, expect, it } from "vitest"

import { ALL_GAMES } from "@/lib/game/constants"

import { shouldResetGameFilter } from "./use-game-filter"

describe("shouldResetGameFilter", () => {
  it("keeps aggregate scope for every data shape", () => {
    expect(shouldResetGameFilter(ALL_GAMES, [])).toBe(false)
    expect(shouldResetGameFilter(ALL_GAMES, ["opcg"])).toBe(false)
  })

  it("keeps a valid single-game scope while its visible context remains", () => {
    expect(shouldResetGameFilter("opcg", ["opcg"])).toBe(false)
  })

  it("resets only scopes that are no longer available", () => {
    expect(shouldResetGameFilter("opcg", ["opcg", "pokemon"])).toBe(false)
    expect(shouldResetGameFilter("missing", ["opcg"])).toBe(true)
    expect(shouldResetGameFilter("missing", ["opcg", "pokemon"])).toBe(true)
  })
})
