import { CardType, Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  CHARACTER: "Character",
  EVENT: "Event",
  STAGE: "Stage",
  LEADER: "Leader",
  DON: "DON!!",
}

const VALID_CARD_TYPES = new Set<string>(Object.values(CardType))

export function one(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? ""
  return param ?? ""
}

export function csv(param: string | string[] | undefined): string[] {
  return one(param)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export type SearchParams = Record<string, string | string[] | undefined>

export function buildWhere(sp: SearchParams): Prisma.CardWhereInput {
  const search = one(sp.search).trim()
  const setCodes = csv(sp.set)
  const rarities = csv(sp.rarity)
  const types = csv(sp.type).filter((t) => VALID_CARD_TYPES.has(t)) as CardType[]
  const colors = csv(sp.color)
  const minPrice = parseInt(one(sp.minPrice), 10) || 0
  const maxPrice = parseInt(one(sp.maxPrice), 10) || 0

  const where: Prisma.CardWhereInput = {}

  if (search) {
    where.OR = [
      { nameJp: { contains: search, mode: "insensitive" } },
      { nameEn: { contains: search, mode: "insensitive" } },
      { cardCode: { contains: search, mode: "insensitive" } },
    ]
  }
  if (setCodes.length) where.set = { code: { in: setCodes } }
  if (rarities.length) where.rarity = { in: rarities }
  if (types.length) where.cardType = { in: types }
  if (colors.length) where.colorEn = { in: colors }
  if (minPrice > 0) {
    where.latestPriceJpy = {
      ...((where.latestPriceJpy as object) || {}),
      gte: minPrice,
    }
  }
  if (maxPrice > 0) {
    where.latestPriceJpy = {
      ...((where.latestPriceJpy as object) || {}),
      lte: maxPrice,
    }
  }
  return where
}

export function orderByFromSort(sortRaw: string): Prisma.CardOrderByWithRelationInput {
  switch (sortRaw) {
    case "price_asc":
      return { latestPriceJpy: "asc" }
    case "price_desc":
      return { latestPriceJpy: "desc" }
    case "change_desc":
      return { priceChange24h: "desc" }
    case "change_7d_desc":
      return { priceChange7d: "desc" }
    case "name":
      return { nameJp: "asc" }
    default:
      return { updatedAt: "desc" }
  }
}

export function validCardTypes(types: string[]): CardType[] {
  return types.filter((t) => VALID_CARD_TYPES.has(t)) as CardType[]
}

export async function getVariantInfo(baseCodes: string[]) {
  if (baseCodes.length === 0) return new Map<string, { count: number; minPrice: number | null; maxPrice: number | null }>()

  const groups = await prisma.card.groupBy({
    by: ["baseCode"],
    where: { baseCode: { in: baseCodes } },
    _count: true,
    _min: { latestPriceJpy: true },
    _max: { latestPriceJpy: true },
  })

  const map = new Map<string, { count: number; minPrice: number | null; maxPrice: number | null }>()
  for (const g of groups) {
    if (g.baseCode) {
      map.set(g.baseCode, {
        count: g._count,
        minPrice: g._min.latestPriceJpy,
        maxPrice: g._max.latestPriceJpy,
      })
    }
  }
  return map
}
