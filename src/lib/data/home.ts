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
    const [topGainers, topLosers, highestPriced, latestPrice] = await Promise.all([
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
      // Freshest scrape overall — feeds the "อัปเดตล่าสุด" meta row above the
      // market table (SEO round 2, E-E-A-T). Same shape as
      // getMostExpensiveData()'s `lastUpdated`.
      prisma.cardPrice.findFirst({
        orderBy: { scrapedAt: "desc" },
        select: { scrapedAt: true },
      }),
    ])

    const [
      totalCards,
      totalValueAgg,
      latestExchangeRate,
      initialTableCards,
      initialTableTotal,
      sets,
      rarityRows,
    ] = await Promise.all([
      prisma.card.count(),
      prisma.card.aggregate({
        _sum: { latestPriceJpy: true },
        where: { latestPriceJpy: { gt: 0 } },
      }),
      prisma.exchangeRate.findFirst({
        orderBy: { fetchedAt: "desc" },
        select: { rate: true },
      }),
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
          id: true,
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

    const recentSets = pickRecentSets(sets)

    return {
      topGainers,
      topLosers,
      highestPriced,
      totalCards,
      totalValue: totalValueAgg._sum.latestPriceJpy ?? 0,
      // Preserve the legacy header/API fallback so this layout-only move does
      // not change the value visitors see while the rate table is empty.
      exchangeRate: latestExchangeRate?.rate ?? 0.296,
      initialTableCards,
      initialTableTotal,
      initialTableTotalPages: Math.ceil(initialTableTotal / TABLE_PAGE_SIZE),
      // Freshest price scrape backing the whole page — null only on an empty DB.
      lastUpdated: latestPrice?.scrapedAt ? latestPrice.scrapedAt.toISOString() : null,
      sets,
      // Newest sets first — feeds the home page's crawlable set strip so the
      // set cluster gets internal links from the pillar page (SEO plan §3.1).
      // Derived from `sets` (already fetched) instead of a second query.
      recentSets: await withSetCovers(recentSets, sets),
      rarityRows,
    }
  } catch (error) {
    log.error("Failed to fetch home data", error)
    throw error
  }
}

export type HomeSetLink = { code: string; name: string; coverUrl?: string | null }

/**
 * Gives each strip entry a cover picture — the set's real packaging art.
 *
 * `don` (DON!! Card Collection) is not a boxed retail product, so Bandai
 * publishes no packaging for it; that one falls back to the set's priciest card
 * with artwork, the same substitute the set pages make. Only the sets that
 * actually need it pay for the card query.
 *
 * A failure here costs the thumbnails only: the strip's job is the crawlable
 * links, so it still renders without them rather than taking the home page down.
 */
async function withSetCovers(
  links: HomeSetLink[],
  sets: { id: number; code: string; boxImageUrl: string | null }[]
): Promise<HomeSetLink[]> {
  const setByCode = new Map(sets.map((s) => [s.code, s]))
  const needCard = links
    .map((l) => setByCode.get(l.code))
    .filter((s) => s != null && !s.boxImageUrl)
    .map((s) => s!.id)

  const cardBySet = new Map<number, string>()

  if (needCard.length > 0) {
    try {
      const covers = await prisma.card.findMany({
        where: { setId: { in: needCard }, imageUrl: { not: null }, latestPriceJpy: { not: null } },
        select: { setId: true, imageUrl: true },
        orderBy: { latestPriceJpy: "desc" },
      })

      for (const card of covers) {
        if (card.setId != null && card.imageUrl && !cardBySet.has(card.setId)) {
          cardBySet.set(card.setId, card.imageUrl)
        }
      }
    } catch (error) {
      log.error("Failed to fetch stand-in set covers for the home strip", error)
    }
  }

  return links.map((l) => {
    const set = setByCode.get(l.code)
    if (!set) return { ...l, coverUrl: null }
    return { ...l, coverUrl: set.boxImageUrl ?? cardBySet.get(set.id) ?? null }
  })
}

/** How many sets the home page links to directly. */
export const HOME_RECENT_SETS_LIMIT = 12

/**
 * Which product line leads the strip when release dates can't decide it.
 * Boosters are the line collectors track prices for; starter decks are the
 * long tail. Unlisted types sort last.
 */
const SET_TYPE_RANK: Record<string, number> = {
  BOOSTER: 0,
  EXTRA_BOOSTER: 1,
  PROMO: 2,
  STARTER: 3,
  OTHER: 4,
}

/**
 * Newest sets first. Returns the latin set name — `CardSet.nameTh` is empty for
 * every set in the database, so Thai context has to come from the surrounding
 * copy.
 *
 * `releaseDate` is NULL for all 51 rows today, so date ordering never fires and
 * everything falls to the tiebreak. Sorting on code alone made that tiebreak
 * reverse-alphabetical, which handed all 12 slots to st29…st18 — a section
 * titled "ชุดการ์ดวันพีชล่าสุด" that showed twelve starter decks and could
 * never show a booster. Product line now breaks the tie before the code does,
 * so the strip leads with op15, op14, … Date ordering still wins outright once
 * the column gets populated.
 */
export function pickRecentSets(
  sets: {
    code: string
    name: string
    nameEn?: string | null
    type?: string | null
    releaseDate?: Date | null
  }[],
  limit = HOME_RECENT_SETS_LIMIT
): HomeSetLink[] {
  return [...sets]
    .sort((a, b) => {
      const at = a.releaseDate ? a.releaseDate.getTime() : -Infinity
      const bt = b.releaseDate ? b.releaseDate.getTime() : -Infinity
      if (at !== bt) return bt - at
      const ar = SET_TYPE_RANK[a.type ?? ""] ?? 5
      const br = SET_TYPE_RANK[b.type ?? ""] ?? 5
      if (ar !== br) return ar - br
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
