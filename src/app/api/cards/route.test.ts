import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
  groupBy: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    card: {
      findMany: mocks.findMany,
      count: mocks.count,
      aggregate: mocks.aggregate,
      groupBy: mocks.groupBy,
    },
  },
}))

import { GET } from "./route"

describe("cards route grade lens", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findMany.mockResolvedValue([
      {
        id: 1,
        cardCode: "OP03-122",
        prices: [{ priceUsd: 100 }],
        set: { code: "OP03", name: "Pillars of Strength" },
      },
    ])
    mocks.count.mockResolvedValue(1)
    mocks.aggregate.mockResolvedValue({ _sum: { latestPriceJpy: 12_000 } })
    mocks.groupBy.mockResolvedValue([])
  })

  it("uses the PSA 10 anchor for modeled grades without applying hidden Raw constraints", async () => {
    const response = await GET(
      new NextRequest(
        "https://meecard.test/api/cards?grade=psa_9&sort=price_desc&minPrice=100&maxPrice=999",
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          prices: {
            some: {
              source: "SNKRDUNK",
              gradeCondition: "PSA 10",
              type: "SELL",
            },
          },
        }),
        // Prisma cannot order by the latest row of a to-many relation. The API
        // must not silently use Raw price order for a modeled grade.
        orderBy: { updatedAt: "desc" },
      }),
    )
    const call = mocks.findMany.mock.calls[0]?.[0]
    expect(call.where).not.toHaveProperty("latestPriceJpy")
    expect(body.cards[0]).toMatchObject({
      cardCode: "OP03-122",
      psa10PriceUsd: 100,
    })
    expect(body.cards[0]).not.toHaveProperty("prices")
  })

  it("rejects unknown grade keys before querying", async () => {
    const response = await GET(
      new NextRequest("https://meecard.test/api/cards?grade=psa_11"),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid grade" })
    expect(mocks.findMany).not.toHaveBeenCalled()
  })
})
