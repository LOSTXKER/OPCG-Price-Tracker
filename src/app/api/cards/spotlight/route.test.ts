import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    card: {
      findMany: mocks.findMany,
    },
  },
}))

import { GET } from "./route"

const card = (cardCode: string, priceChange24h: number | null = null) => ({
  cardCode,
  nameJp: "ロロノア・ゾロ",
  nameEn: "Roronoa Zoro",
  nameTh: null,
  rarity: "SR",
  imageUrl: `https://img.test/${cardCode}.webp`,
  latestPriceJpy: 4200,
  latestPriceThb: 1050,
  priceChange24h,
  set: { code: "OP01" },
})

describe("cards spotlight route (search palette empty state)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findMany
      .mockResolvedValueOnce([card("OP01-025")])
      .mockResolvedValueOnce([card("OP09-001_p1", 12.4)])
  })

  it("returns most-viewed cards and 24h movers as two keyed lists", async () => {
    const response = await GET(new NextRequest("https://meecard.test/api/cards/spotlight"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.popular).toHaveLength(1)
    expect(body.popular[0].cardCode).toBe("OP01-025")
    expect(body.movers[0]).toMatchObject({
      cardCode: "OP09-001_p1",
      priceChange24h: 12.4,
      set: { code: "OP01" },
    })

    // Popular = viewCount desc with a real price; movers ride the
    // priceChange24h index above the same junk floor the ticker uses, so a
    // ¥120 common's quantised "-20.0%" can't lead the list.
    expect(mocks.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { viewCount: { gt: 0 }, latestPriceJpy: { gt: 0 } },
        orderBy: { viewCount: "desc" },
      }),
    )
    expect(mocks.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          latestPriceJpy: { gte: 500 },
          priceChange24h: { not: null },
        },
        orderBy: { priceChange24h: "desc" },
      }),
    )
  })

  it("keeps the payload small: image + names + price fields only, capped per section", async () => {
    await GET(new NextRequest("https://meecard.test/api/cards/spotlight"))

    for (const call of mocks.findMany.mock.calls) {
      const args = call[0]
      expect(args.take).toBe(6)
      // The palette paints a thumb, a localized name, a price and a delta —
      // no relations beyond the set code, no facet scaffolding.
      expect(Object.keys(args.select)).toEqual([
        "cardCode",
        "nameJp",
        "nameEn",
        "nameTh",
        "rarity",
        "imageUrl",
        "latestPriceJpy",
        "latestPriceThb",
        "priceChange24h",
        "set",
      ])
    }
  })
})
