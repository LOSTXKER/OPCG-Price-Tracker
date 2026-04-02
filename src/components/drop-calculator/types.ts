export interface SetListItem {
  id: number
  code: string
  name: string
  nameEn: string | null
  nameTh: string | null
  type: string
  releaseDate: string | null
  imageUrl: string | null
}

export interface DropRate {
  rarity: string
  avgPerBox: number | null
  ratePerPack: number | null
}

export interface CardItem {
  id: number
  cardCode: string
  nameJp: string
  nameEn: string | null
  nameTh: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
}

export interface RarityCount {
  rarity: string
  normal: number
  parallel: number
}

export interface SetDetail {
  set: {
    code: string
    name: string
    nameEn: string | null
    nameTh: string | null
    type: string
    packsPerBox: number | null
    cardsPerPack: number | null
    msrpJpy: number | null
    boxImageUrl: string | null
    cardCount: number
    releaseDate: string | null
  }
  dropRates: DropRate[]
  cards: CardItem[]
  rarityCounts: RarityCount[]
}

export type { Unit } from "@/lib/constants/ui"
export { UNIT_I18N_KEYS, PULL_UNITS } from "@/lib/constants/ui"

export const TIER_ORDER = [
  "L", "C", "UC", "R", "SR", "SEC", "SP", "SP CARD",
  "P-L", "P-C", "P-UC", "P-R", "P-SR", "P-SEC", "DON",
]

export function tierSort(a: string, b: string) {
  const ai = TIER_ORDER.indexOf(a)
  const bi = TIER_ORDER.indexOf(b)
  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
}
