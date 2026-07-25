import { describe, expect, it } from "vitest"

import { ALL_GAMES } from "@/lib/game/constants"

import { getPortfolioComposition } from "./portfolio-insights"

describe("portfolio insights composition", () => {
  it("shows one composition dimension at a time", () => {
    expect(
      getPortfolioComposition({
        gameFilter: ALL_GAMES,
        gameCount: 2,
        valuationComplete: true,
        allocationCount: 4,
      }),
    ).toBe("game")

    expect(
      getPortfolioComposition({
        gameFilter: "opcg",
        gameCount: 2,
        valuationComplete: true,
        allocationCount: 4,
      }),
    ).toBe("card")

    expect(
      getPortfolioComposition({
        gameFilter: ALL_GAMES,
        gameCount: 1,
        valuationComplete: true,
        allocationCount: 4,
      }),
    ).toBe("card")
  })

  it("omits allocation when its valuation is incomplete", () => {
    expect(
      getPortfolioComposition({
        gameFilter: "opcg",
        gameCount: 1,
        valuationComplete: false,
        allocationCount: 4,
      }),
    ).toBeNull()
  })
})
