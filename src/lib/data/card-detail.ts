import { cache } from "react"
import { prisma } from "@/lib/db"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export const getCardByCode = cache(async (rawCode: string) => {
  const code = decodeURIComponent(rawCode)

  const includeClause = {
    set: true,
    prices: {
      orderBy: { scrapedAt: "desc" as const },
      take: 60,
      select: {
        id: true,
        source: true,
        type: true,
        priceJpy: true,
        priceThb: true,
        priceUsd: true,
        priceEur: true,
        inStock: true,
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
  const yuyuteiPrice = card.prices.find((p) => p.source === "YUYUTEI")
  if (yuyuteiPrice && yuyuteiPrice.priceJpy != null) {
    return {
      priceJpy: yuyuteiPrice.priceJpy,
      priceThb: yuyuteiPrice.priceThb,
      inStock: yuyuteiPrice.inStock,
      source: "YUYUTEI" as const,
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
      source: "YUYUTEI" as const,
    }
  }
  return null
}

export function getAvailableSources(prices: { source: string }[]) {
  return [...new Set(prices.map((p) => p.source))]
}

export function buildChartData(
  prices: { scrapedAt: Date; priceJpy: number | null; priceThb: number | null; source: string }[]
) {
  return [...prices]
    .sort((a, b) => new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime())
    .map((p) => ({
      scrapedAt: p.scrapedAt.toISOString(),
      priceJpy: p.priceJpy,
      priceThb: p.priceThb,
      source: p.source,
    }))
}
