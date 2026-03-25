import { prisma } from "@/lib/db"

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

export type ViewedCard = TrendingCard & { viewCount: number }

export async function getHomeData() {
  try {
    // Batch 1: card lists
    const [topGainers, topLosers, mostViewed, highestPriced] = await Promise.all([
      prisma.card.findMany({
        where: { priceChange24h: { not: null, gt: 0 } },
        orderBy: { priceChange24h: "desc" },
        take: 10,
        include: { set: { select: { code: true, name: true } } },
      }),
      prisma.card.findMany({
        where: { priceChange24h: { not: null, lt: 0 } },
        orderBy: { priceChange24h: "asc" },
        take: 10,
        include: { set: { select: { code: true, name: true } } },
      }),
      prisma.card.findMany({
        where: { viewCount: { gt: 0 } },
        orderBy: { viewCount: "desc" },
        take: 10,
        include: { set: { select: { code: true, name: true } } },
      }),
      prisma.card.findMany({
        where: { latestPriceJpy: { not: null, gt: 0 } },
        orderBy: { latestPriceJpy: "desc" },
        take: 10,
        include: { set: { select: { code: true, name: true } } },
      }),
    ])

    // Batch 2: aggregates + set info
    const [newestSet, totalCards, totalSets, totalValueAgg] = await Promise.all([
      prisma.cardSet.findFirst({
        orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
      }),
      prisma.card.count(),
      prisma.cardSet.count(),
      prisma.card.aggregate({
        _sum: { latestPriceJpy: true },
        where: { latestPriceJpy: { gt: 0 } },
      }),
    ])

    const latestSetCards = newestSet
      ? await prisma.card.findMany({
          where: { setId: newestSet.id },
          orderBy: { latestPriceJpy: "desc" },
          take: 20,
          include: { set: { select: { code: true } } },
        })
      : []

    const totalValue = totalValueAgg._sum.latestPriceJpy ?? 0

    return { topGainers, topLosers, mostViewed, newestSet, latestSetCards, totalCards, totalSets, highestPriced, totalValue }
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
