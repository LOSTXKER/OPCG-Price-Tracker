import { prisma } from "@/lib/db"
import { createLog } from "@/lib/logger"

const log = createLog("data:most-expensive")

export const MOST_EXPENSIVE_LIMIT = 50

export type MostExpensiveCard = {
  cardCode: string
  nameJp: string
  nameEn: string | null
  nameTh: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  priceJpy: number
  priceChange30d: number | null
  set: { code: string; name: string; nameEn: string | null }
}

export type MostExpensiveData = {
  cards: MostExpensiveCard[]
  /** How many cards in the catalogue currently carry a price at all. */
  pricedCardCount: number
  totalCardCount: number
  setCount: number
  /** Freshest price scrape backing this ranking. */
  lastUpdated: string | null
  /** Highest-priced card per rarity tier — unique data no competitor publishes. */
  topByRarity: { rarity: string; card: MostExpensiveCard }[]
}

const cardSelect = {
  cardCode: true,
  nameJp: true,
  nameEn: true,
  nameTh: true,
  rarity: true,
  isParallel: true,
  imageUrl: true,
  latestPriceJpy: true,
  priceChange30d: true,
  set: { select: { code: true, name: true, nameEn: true } },
} as const

type CardRow = {
  cardCode: string
  nameJp: string
  nameEn: string | null
  nameTh: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
  priceChange30d: number | null
  set: { code: string; name: string; nameEn: string | null }
}

function toCard(row: CardRow): MostExpensiveCard {
  return {
    cardCode: row.cardCode,
    nameJp: row.nameJp,
    nameEn: row.nameEn,
    nameTh: row.nameTh,
    rarity: row.rarity,
    isParallel: row.isParallel,
    imageUrl: row.imageUrl,
    priceJpy: row.latestPriceJpy ?? 0,
    priceChange30d: row.priceChange30d,
    set: row.set,
  }
}

/**
 * The live "most expensive cards" ranking. The Thai SERP for this query is owned
 * by frozen news listicles, so the ranking's value is that it is regenerated
 * from the current catalogue on every revalidation.
 */
export async function getMostExpensiveData(): Promise<MostExpensiveData> {
  try {
    const [rows, pricedCardCount, totalCardCount, setCount, latestPrice] = await Promise.all([
      prisma.card.findMany({
        where: { latestPriceJpy: { not: null, gt: 0 } },
        orderBy: { latestPriceJpy: "desc" },
        take: MOST_EXPENSIVE_LIMIT,
        select: cardSelect,
      }),
      prisma.card.count({ where: { latestPriceJpy: { not: null, gt: 0 } } }),
      prisma.card.count(),
      prisma.cardSet.count(),
      prisma.cardPrice.findFirst({
        orderBy: { scrapedAt: "desc" },
        select: { scrapedAt: true },
      }),
    ])

    const cards = rows.map(toCard)

    // One representative per rarity, cheapest possible: reuse the ranked rows
    // first, then fill the tiers that no top-50 card covers.
    const seen = new Set<string>()
    const topByRarity: { rarity: string; card: MostExpensiveCard }[] = []
    for (const card of cards) {
      if (seen.has(card.rarity)) continue
      seen.add(card.rarity)
      topByRarity.push({ rarity: card.rarity, card })
    }

    return {
      cards,
      pricedCardCount,
      totalCardCount,
      setCount,
      lastUpdated: latestPrice?.scrapedAt ? latestPrice.scrapedAt.toISOString() : null,
      topByRarity: topByRarity.slice(0, 8),
    }
  } catch (error) {
    log.error("Failed to load most-expensive ranking", error)
    return {
      cards: [],
      pricedCardCount: 0,
      totalCardCount: 0,
      setCount: 0,
      lastUpdated: null,
      topByRarity: [],
    }
  }
}
