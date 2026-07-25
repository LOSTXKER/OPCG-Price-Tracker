import { describe, expect, it } from "vitest"

import { getInitialPickerGame } from "./card-picker-form"

describe("getInitialPickerGame", () => {
  it("keeps a live preferred game", () => {
    expect(getInitialPickerGame("opcg")).toBe("opcg")
  })

  it("falls back from a coming-soon or unknown preference", () => {
    expect(getInitialPickerGame("pokemon")).toBe("opcg")
    expect(getInitialPickerGame("missing")).toBe("opcg")
  })
})
