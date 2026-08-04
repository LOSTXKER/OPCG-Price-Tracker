import { cache } from "react"
import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import { PRICE_SOURCE } from "@/lib/constants/prices"

/**
 * Resolve a card by code with the standard fallback chain:
 *   1. exact `cardCode` match (URL-decoded)
 *   2. uppercase `cardCode` match
 *   3. `baseCode` match for the non-parallel printing
 *
 * Pass either `select` or `include` to pick the projection. The return
 * type is generic so callers see only the fields they asked for.
 *
 * Single source of truth for `cards/[code]` page, `api/cards/[code]/prices`
 * route, and any other code-based lookup. New callers should NOT re-implement
 * the fallback chain; extend this helper instead.
 */
export async function findCardByCode<
  TArgs extends { select?: Prisma.CardSelect; include?: Prisma.CardInclude },
>(
  rawCode: string,
  args?: TArgs,
): Promise<Prisma.CardGetPayload<TArgs> | null> {
  const code = decodeURIComponent(rawCode)
  const upper = code.toUpperCase()
  const projection = (args ?? {}) as TArgs

  const exact = (await prisma.card.findUnique({
    where: { cardCode: code },
    ...projection,
  })) as Prisma.CardGetPayload<TArgs> | null
  if (exact) return exact

  if (code !== upper) {
    const upperHit = (await prisma.card.findUnique({
      where: { cardCode: upper },
      ...projection,
    })) as Prisma.CardGetPayload<TArgs> | null
    if (upperHit) return upperHit
  }

  return (await prisma.card.findFirst({
    where: { baseCode: upper, isParallel: false },
    ...projection,
  })) as Prisma.CardGetPayload<TArgs> | null
}

const cardDetailInclude = {
  set: true,
  prices: {
    orderBy: { scrapedAt: "desc" as const },
    take: 120,
    select: {
      id: true,
      source: true,
      type: true,
      priceJpy: true,
      priceThb: true,
      priceUsd: true,
      priceEur: true,
      inStock: true,
      gradeCondition: true,
      scrapedAt: true,
    },
  },
} satisfies Prisma.CardInclude

export const getCardByCode = cache(async (rawCode: string) => {
  return findCardByCode(rawCode, { include: cardDetailInclude })
})

export const getSiblingVariants = cache(async (baseCode: string | null, excludeId: number) => {
  if (!baseCode) return []
  return prisma.card.findMany({
    where: { baseCode, id: { not: excludeId } },
    select: {
      id: true,
      cardCode: true,
      nameJp: true,
      nameEn: true,
      rarity: true,
      isParallel: true,
      imageUrl: true,
      latestPriceJpy: true,
      set: { select: { code: true } },
    },
    orderBy: [
      { set: { code: "asc" } },
      { parallelIndex: { sort: "asc", nulls: "first" } },
    ],
  })
})

export const getRelatedFromSameSet = cache(async (setId: number, excludeId: number) => {
  const withPrice = await prisma.card.findMany({
    where: {
      setId,
      id: { not: excludeId },
      latestPriceJpy: { not: null },
      isParallel: false,
    },
    orderBy: { latestPriceJpy: "desc" },
    take: 12,
    select: {
      id: true,
      cardCode: true,
      nameJp: true,
      nameEn: true,
      nameTh: true,
      rarity: true,
      isParallel: true,
      imageUrl: true,
      latestPriceJpy: true,
      set: { select: { code: true } },
    },
  })
  if (withPrice.length >= 6) return withPrice

  const ids = withPrice.map((c) => c.id)
  const rest = await prisma.card.findMany({
    where: {
      setId,
      id: { notIn: [excludeId, ...ids] },
      isParallel: false,
    },
    orderBy: { cardCode: "asc" },
    take: 12 - withPrice.length,
    select: {
      id: true,
      cardCode: true,
      nameJp: true,
      nameEn: true,
      nameTh: true,
      rarity: true,
      isParallel: true,
      imageUrl: true,
      latestPriceJpy: true,
      set: { select: { code: true } },
    },
  })
  return [...withPrice, ...rest]
})

/**
 * Settled-sale rows for the "ประวัติการซื้อขายล่าสุด" feed. The scraper has been
 * writing these all along (`type = SOLD`, one row per grade per scrape); the
 * page just never read them back and showed generated rows instead. Ordered
 * newest-first; `deriveSoldFeed` collapses the repeats.
 */
export const getSoldPricesForCard = cache(async (cardId: number) => {
  return prisma.cardPrice.findMany({
    where: { cardId, type: "SOLD" },
    orderBy: { scrapedAt: "desc" },
    take: 200,
    select: {
      source: true,
      gradeCondition: true,
      priceJpy: true,
      priceUsd: true,
      scrapedAt: true,
    },
  })
})

export const getListingsForCard = cache(async (cardId: number) => {
  return prisma.listing.findMany({
    where: { cardId, status: "ACTIVE" },
    orderBy: { priceJpy: "asc" },
    take: 24,
    include: {
      user: {
        select: {
          displayName: true,
          avatarUrl: true,
          sellerRating: true,
          sellerReviewCount: true,
        },
      },
    },
  })
})

export function deriveLatestPrice(card: {
  prices: { priceJpy: number | null; priceThb: number | null; inStock: boolean; source: string }[]
  latestPriceJpy: number | null
  latestPriceThb: number | null
}) {
  const yuyuteiPrice = card.prices.find((p) => p.source === PRICE_SOURCE.YUYUTEI)
  if (yuyuteiPrice && yuyuteiPrice.priceJpy != null) {
    return {
      priceJpy: yuyuteiPrice.priceJpy,
      priceThb: yuyuteiPrice.priceThb,
      inStock: yuyuteiPrice.inStock,
      source: PRICE_SOURCE.YUYUTEI,
    }
  }
  const anyPrice = card.prices[0]
  if (anyPrice && anyPrice.priceJpy != null) {
    return {
      priceJpy: anyPrice.priceJpy,
      priceThb: anyPrice.priceThb,
      inStock: anyPrice.inStock,
      source: anyPrice.source as string,
    }
  }
  if (card.latestPriceJpy != null) {
    return {
      priceJpy: card.latestPriceJpy,
      priceThb: card.latestPriceThb,
      inStock: true,
      source: PRICE_SOURCE.YUYUTEI,
    }
  }
  return null
}

export function getAvailableSources(prices: { source: string }[]) {
  return [...new Set(prices.map((p) => p.source))]
}

export function deriveSnkrdunkPrices(
  prices: { source: string; type: string; priceUsd: number | null; gradeCondition: string | null; scrapedAt: Date | string }[]
) {
  const snk = prices
    .filter((p) => p.source === PRICE_SOURCE.SNKRDUNK && p.priceUsd != null)
    .sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime())

  const sellRaw = snk.find((p) => p.type === "SELL" && !p.gradeCondition)
  const sellPsa10 = snk.find((p) => p.type === "SELL" && p.gradeCondition === PRICE_SOURCE.PSA_10)
  const soldPsa10 = snk.find((p) => p.type === "SOLD" && p.gradeCondition === PRICE_SOURCE.PSA_10)
  const soldAny = snk.find((p) => p.type === "SOLD" && !p.gradeCondition)

  if (!sellRaw && !sellPsa10 && !soldPsa10 && !soldAny) return null

  return {
    minPriceUsd: sellRaw?.priceUsd ?? null,
    psa10AskUsd: sellPsa10?.priceUsd ?? null,
    psa10SoldUsd: soldPsa10?.priceUsd ?? null,
    lastSoldUsd: soldAny?.priceUsd ?? null,
  }
}

export type SourcePriceRow = {
  source: string
  askPriceJpy: number | null
  askPriceThb: number | null
  askPriceUsd: number | null
  soldPriceJpy: number | null
  soldPriceThb: number | null
  soldPriceUsd: number | null
  updatedAt: string | null
}

/**
 * Group prices by source and return the latest ask/sold per source.
 * `grade` controls filtering: "raw" = no gradeCondition, "psa10" = gradeCondition === "PSA 10".
 */
export function deriveSourcePrices(
  prices: {
    source: string
    type: string
    priceJpy: number | null
    priceThb: number | null
    priceUsd: number | null
    gradeCondition: string | null
    scrapedAt: Date | string
  }[],
  grade: "raw" | "psa10",
): SourcePriceRow[] {
  const gradeFilter = grade === "psa10" ? PRICE_SOURCE.PSA_10 : null

  const filtered = prices.filter((p) =>
    gradeFilter ? p.gradeCondition === gradeFilter : !p.gradeCondition,
  )

  const bySource = new Map<string, typeof filtered>()
  for (const p of filtered) {
    const arr = bySource.get(p.source) ?? []
    arr.push(p)
    bySource.set(p.source, arr)
  }

  const rows: SourcePriceRow[] = []
  for (const [source, group] of bySource) {
    const sorted = [...group].sort(
      (a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime(),
    )
    const latestSell = sorted.find((p) => p.type === "SELL")
    const latestSold = sorted.find((p) => p.type === "SOLD")

    if (!latestSell && !latestSold) continue

    const latest = sorted[0]
    rows.push({
      source,
      askPriceJpy: latestSell?.priceJpy ?? null,
      askPriceThb: latestSell?.priceThb ?? null,
      askPriceUsd: latestSell?.priceUsd ?? null,
      soldPriceJpy: latestSold?.priceJpy ?? null,
      soldPriceThb: latestSold?.priceThb ?? null,
      soldPriceUsd: latestSold?.priceUsd ?? null,
      updatedAt: latest
        ? typeof latest.scrapedAt === "string"
          ? latest.scrapedAt
          : latest.scrapedAt.toISOString()
        : null,
    })
  }

  rows.sort((a, b) => {
    const aPrice = a.askPriceUsd ?? a.askPriceJpy ?? Infinity
    const bPrice = b.askPriceUsd ?? b.askPriceJpy ?? Infinity
    return aPrice - bPrice
  })

  return rows
}

export function buildChartData(
  prices: { scrapedAt: Date; priceJpy: number | null; priceThb: number | null; priceUsd: number | null; source: string; gradeCondition: string | null; type?: string | null }[]
) {
  return [...prices]
    .sort((a, b) => new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime())
    .map((p) => ({
      scrapedAt: p.scrapedAt.toISOString(),
      priceJpy: p.priceJpy,
      priceThb: p.priceThb,
      priceUsd: p.priceUsd,
      source: p.source,
      gradeCondition: p.gradeCondition ?? null,
      // SELL = listing/ask, SOLD = settled sale — carried so the UI never labels
      // an ask as a sale (VISION §5.1 honesty rule).
      type: p.type ?? null,
    }))
}
