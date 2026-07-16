import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  findFirst: vi.fn(),
  getAuthUser: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock("next/headers", () => ({ cookies: mocks.cookies }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/lib/auth/get-auth-user", () => ({
  getAuthUser: mocks.getAuthUser,
}))
vi.mock("@/lib/db", () => ({
  prisma: { portfolio: { findFirst: mocks.findFirst } },
}))

import PortfolioPage from "./page"

const redirectError = new Error("NEXT_REDIRECT")

describe("portfolio gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => undefined) })
    mocks.getAuthUser.mockResolvedValue({ id: "user_1" })
    mocks.findFirst.mockResolvedValue(null)
    mocks.redirect.mockImplementation(() => {
      throw redirectError
    })
  })

  it("keeps guests on the auth preview without querying portfolios", async () => {
    mocks.getAuthUser.mockResolvedValue(null)

    const result = await PortfolioPage()

    expect(result.props.mode).toBe("guest")
    expect(mocks.findFirst).not.toHaveBeenCalled()
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it("redirects to a remembered portfolio only after validating ownership", async () => {
    mocks.cookies.mockResolvedValue({
      get: vi.fn(() => ({ value: "17" })),
    })
    mocks.findFirst.mockResolvedValueOnce({ id: 17 })

    await expect(PortfolioPage()).rejects.toBe(redirectError)

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { id: 17, userId: "user_1" },
      select: { id: true },
    })
    expect(mocks.findFirst).toHaveBeenCalledTimes(1)
    expect(mocks.redirect).toHaveBeenCalledWith("/portfolio/17")
  })

  it("falls back deterministically when the remembered id is stale", async () => {
    mocks.cookies.mockResolvedValue({
      get: vi.fn(() => ({ value: "17" })),
    })
    mocks.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 23 })

    await expect(PortfolioPage()).rejects.toBe(redirectError)

    expect(mocks.findFirst).toHaveBeenNthCalledWith(2, {
      where: { userId: "user_1" },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: { id: true },
    })
    expect(mocks.redirect).toHaveBeenCalledWith("/portfolio/23")
  })

  it("renders the create-only empty gateway when no portfolio exists", async () => {
    const result = await PortfolioPage()

    expect(result.props.mode).toBe("empty")
    expect(mocks.redirect).not.toHaveBeenCalled()
  })
})
