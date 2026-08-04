import { prisma } from "@/lib/db"
import { CARDS_PAGE_SIZE } from "@/lib/constants/ui"
import { PRICE_SOURCE } from "@/lib/constants/prices"
import { createLog } from "@/lib/logger"

const log = createLog("data:home")

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
      totalCards,
      initialTableCards,
      initialTableTotal,
      sets,
      rarityRows,
    ] = await Promise.all([
      prisma.card.count(),
      prisma.card.findMany({
        orderBy: { latestPriceJpy: { sort: "desc", nulls: "last" } },
        take: TABLE_PAGE_SIZE,
        include: {
          set: { select: cardSetSelect },
          prices: {
            where: {
              source: PRICE_SOURCE.SNKRDUNK,
              gradeCondition: PRICE_SOURCE.PSA_10,
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
        select: {
          code: true,
          name: true,
          nameEn: true,
          nameTh: true,
          type: true,
          boxImageUrl: true,
          releaseDate: true,
        },
        orderBy: { code: "asc" },
      }),
      prisma.card.findMany({
        distinct: ["rarity"],
        select: { rarity: true },
        orderBy: { rarity: "asc" },
      }),
    ])

    return {
      topGainers,
      topLosers,
      highestPriced,
      totalCards,
      initialTableCards,
      initialTableTotal,
      initialTableTotalPages: Math.ceil(initialTableTotal / TABLE_PAGE_SIZE),
      sets,
      // Newest sets first — feeds the home page's crawlable set strip so the
      // set cluster gets internal links from the pillar page (SEO plan §3.1).
      // Derived from `sets` (already fetched) instead of a second query.
      recentSets: pickRecentSets(sets),
      rarityRows,
    }
  } catch (error) {
    log.error("Failed to fetch home data", error)
    throw error
  }
}

export type HomeSetLink = { code: string; name: string }

/** How many sets the home page links to directly. */
export const HOME_RECENT_SETS_LIMIT = 12

/**
 * Newest sets first (undated sets last, then by code descending as a stable
 * tiebreak). Returns the latin set name — `CardSet.nameTh` is empty for every
 * set in the database, so Thai context has to come from the surrounding copy.
 */
export function pickRecentSets(
  sets: {
    code: string
    name: string
    nameEn?: string | null
    releaseDate?: Date | null
  }[],
  limit = HOME_RECENT_SETS_LIMIT
): HomeSetLink[] {
  return [...sets]
    .sort((a, b) => {
      const at = a.releaseDate ? a.releaseDate.getTime() : -Infinity
      const bt = b.releaseDate ? b.releaseDate.getTime() : -Infinity
      if (at !== bt) return bt - at
      return b.code.localeCompare(a.code)
    })
    .slice(0, limit)
    .map((s) => ({ code: s.code, name: s.nameEn?.trim() || s.name }))
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
