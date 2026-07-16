import { describe, expect, it } from "vitest"

import { CARD_COLORS, getColorOptions } from "./card-config"

describe("card color configuration", () => {
  it("keeps the multicolor indicator as the shared red-to-blue gradient", () => {
    const multicolor = CARD_COLORS.find((color) => color.value === "multi")

    expect(multicolor).toMatchObject({
      dotClass: "bg-gradient-to-r from-red-400 to-blue-400",
      bgClass: "bg-gradient-to-r from-red-400 to-blue-400",
    })
    expect(getColorOptions("TH").find((color) => color.value === "multi")?.dot)
      .toBe(multicolor?.dotClass)
  })
})
