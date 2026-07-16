import { describe, expect, it, vi } from "vitest"

vi.mock("./portfolio-detail-client", () => ({
  default: () => null,
}))

import PortfolioDetailPage from "./page"

describe("portfolio detail route", () => {
  it("opens the add-card flow only for the explicit add=1 handoff", async () => {
    const result = await PortfolioDetailPage({
      params: Promise.resolve({ id: "42" }),
      searchParams: Promise.resolve({ add: "1" }),
    })

    expect(result.props).toMatchObject({
      portfolioId: 42,
      openAddOnLoad: true,
    })
  })

  it("keeps ordinary and ambiguous detail links closed", async () => {
    const ordinary = await PortfolioDetailPage({
      params: Promise.resolve({ id: "42" }),
      searchParams: Promise.resolve({}),
    })
    const repeated = await PortfolioDetailPage({
      params: Promise.resolve({ id: "42" }),
      searchParams: Promise.resolve({ add: ["1", "0"] }),
    })

    expect(ordinary.props.openAddOnLoad).toBe(false)
    expect(repeated.props.openAddOnLoad).toBe(false)
  })

  it("renders a malformed portfolio id as not found", async () => {
    await expect(
      PortfolioDetailPage({
        params: Promise.resolve({ id: "foo" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" })
  })
})
