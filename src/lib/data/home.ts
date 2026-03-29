import { prisma } from "@/lib/db"
import { CARDS_PAGE_SIZE } from "@/lib/constants/ui"

export type TrendingCard = {
  cardCode: string
  baseCode: string | null
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
  rarity: string
  imageUrl: string | null
  priceJpy: number | null
  priceChange24h: number | null
  set?: { code: string; name?: string }
}

const TABLE_PAGE_SIZE = CARDS_PAGE_SIZE

const cardSetSelect = { code: true, name: true, nameEn: true } as const

export async function getHomeData() {
  try {
    const [topGainers, topLosers, highestPriced] = await Promise.all([
      prisma.card.findMany({
        where: { priceChange24h: { not: null, gt: 0 } },
        orderBy: { priceChange24h: "desc" },
        take: 5,
        include: { set: { select: { code: true, name: true } } },
      }),
      prisma.card.findMany({
        where: { priceChange24h: { not: null, lt: 0 } },
        orderBy: { priceChange24h: "asc" },
        take: 5,
        include: { set: { select: { code: true, name: true } } },
      }),
      prisma.card.findMany({
        where: { latestPriceJpy: { not: null, gt: 0 } },
        orderBy: { latestPriceJpy: "desc" },
        take: 1,
        include: { set: { select: { code: true, name: true } } },
      }),
    ])

    const [
      newestSet,
      totalCards,
      totalValueAgg,
      initialTableCards,
      initialTableTotal,
      sets,
      rarityRows,
    ] = await Promise.all([
      prisma.cardSet.findFirst({
        orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
      }),
      prisma.card.count(),
      prisma.card.aggregate({
        _sum: { latestPriceJpy: true },
        where: { latestPriceJpy: { gt: 0 } },
      }),
      prisma.card.findMany({
        orderBy: { latestPriceJpy: { sort: "desc", nulls: "last" } },
        take: TABLE_PAGE_SIZE,
        include: {
          set: { select: cardSetSelect },
          prices: {
            where: {
              source: "SNKRDUNK",
              gradeCondition: "PSA 10",
              type: "SELL",
            },
            orderBy: { scrapedAt: "desc" },
            take: 1,
            select: { priceUsd: true },
          },
        },
      }),
      prisma.card.count(),
      prisma.cardSet.findMany({
        select: { code: true, name: true, nameEn: true },
        orderBy: { code: "asc" },
      }),
      prisma.card.findMany({
        distinct: ["rarity"],
        select: { rarity: true },
        orderBy: { rarity: "asc" },
      }),
    ])

    const totalValue = totalValueAgg._sum.latestPriceJpy ?? 0

    return {
      topGainers,
      topLosers,
      highestPriced,
      newestSet,
      totalCards,
      totalValue,
      initialTableCards,
      initialTableTotal,
      initialTableTotalPages: Math.ceil(initialTableTotal / TABLE_PAGE_SIZE),
      sets,
      rarityRows,
    }
  } catch (error) {
    console.error("Failed to fetch home data:", error)
    throw error
  }
}

export function mapCardToTrending(c: {
  cardCode: string
  baseCode: string | null
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
  rarity: string
  imageUrl: string | null
  latestPriceJpy: number | null
  priceChange24h: number | null
  set: { code: string; name: string }
}): TrendingCard {
  return {
    cardCode: c.cardCode,
    baseCode: c.baseCode,
    nameJp: c.nameJp,
    nameEn: c.nameEn,
    nameTh: c.nameTh,
    rarity: c.rarity,
    imageUrl: c.imageUrl,
    priceJpy: c.latestPriceJpy,
    priceChange24h: c.priceChange24h,
    set: c.set,
  }
}
