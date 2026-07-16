import { describe, expect, it } from "vitest"

import {
  getPortfolioIdAfterDelete,
  parsePortfolioRouteId,
} from "./portfolio-navigation"

describe("portfolio route id", () => {
  it("accepts only positive safe integers", () => {
    expect(parsePortfolioRouteId("42")).toBe(42)
    expect(parsePortfolioRouteId("foo")).toBeNull()
    expect(parsePortfolioRouteId("0")).toBeNull()
    expect(parsePortfolioRouteId("-1")).toBeNull()
    expect(parsePortfolioRouteId("1.5")).toBeNull()
    expect(parsePortfolioRouteId("9007199254740992")).toBeNull()
  })
})

describe("portfolio delete navigation", () => {
  it("prefers the next portfolio, then the previous one", () => {
    expect(getPortfolioIdAfterDelete([10, 20, 30], 20)).toBe(30)
    expect(getPortfolioIdAfterDelete([10, 20, 30], 30)).toBe(20)
  })

  it("returns null after deleting the final portfolio", () => {
    expect(getPortfolioIdAfterDelete([10], 10)).toBeNull()
  })

  it("recovers deterministically if a stale id is requested", () => {
    expect(getPortfolioIdAfterDelete([10, 20], 99)).toBe(10)
  })
})
