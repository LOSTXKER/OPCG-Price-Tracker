import { cache } from "react"
import { prisma } from "@/lib/db"
import { PRICE_SOURCE } from "@/lib/constants/prices"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export const getCardByCode = cache(async (rawCode: string) => {
  const code = decodeURIComponent(rawCode)

  const includeClause = {
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
  }

  const card = await prisma.card.findUnique({
    where: { cardCode: code },
    include: includeClause,
  })

  if (card) return card

  return prisma.card.findFirst({
    where: { baseCode: code.toUpperCase(), isParallel: false },
    include: includeClause,
  })
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

export const getCommunityPrice = cache(async (cardId: number) => {
  const result = await prisma.communityPrice.aggregate({
    where: {
      cardId,
      createdAt: { gte: new Date(Date.now() - THIRTY_DAYS_MS) },
    },
    _avg: { priceThb: true },
    _count: true,
  })
  return {
    avgThb: result._avg.priceThb ? Math.round(result._avg.priceThb) : null,
    reportCount: result._count,
  }
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

export type ChartSourceOption = {
  id: string
  label: string
  source?: string
  grade?: string
  currency: "JPY" | "USD"
}

export function getChartSources(
  prices: { source: string; gradeCondition: string | null; priceUsd: number | null }[]
): ChartSourceOption[] {
  const sources: ChartSourceOption[] = [
    { id: PRICE_SOURCE.YUYUTEI, label: "Yuyu-tei", source: PRICE_SOURCE.YUYUTEI, currency: "JPY" },
  ]

  const hasSnkrRaw = prices.some(
    (p) => p.source === PRICE_SOURCE.SNKRDUNK && !p.gradeCondition && p.priceUsd != null,
  )
  const hasSnkrPsa10 = prices.some(
    (p) => p.source === PRICE_SOURCE.SNKRDUNK && p.gradeCondition === PRICE_SOURCE.PSA_10 && p.priceUsd != null,
  )

  if (hasSnkrRaw) {
    sources.push({ id: "SNKRDUNK_RAW", label: PRICE_SOURCE.SNKRDUNK, source: PRICE_SOURCE.SNKRDUNK, grade: "raw", currency: "USD" })
  }
  if (hasSnkrPsa10) {
    sources.push({ id: "SNKRDUNK_PSA10", label: PRICE_SOURCE.PSA_10, source: PRICE_SOURCE.SNKRDUNK, grade: PRICE_SOURCE.PSA_10, currency: "USD" })
  }

  return sources
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
  prices: { scrapedAt: Date; priceJpy: number | null; priceThb: number | null; priceUsd: number | null; source: string; gradeCondition: string | null }[]
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
    }))
}
