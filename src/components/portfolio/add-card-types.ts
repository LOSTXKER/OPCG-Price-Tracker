import type { CardSearchResult } from "@/hooks/use-card-search"

export type CardWithSet = CardSearchResult & {
  set?: { code: string; name: string; nameEn?: string | null } | null
}

export type ApiResponse = {
  cards: CardWithSet[]
  total: number
}

export type SetInfo = {
  code: string
  name: string
  nameEn: string | null
  type: string
  _count: { cards: number }
}

export type CartItem = {
  card: CardWithSet
  quantity: number
  purchasePrice: number | null
}

export const SET_TYPE_LABELS: Record<string, string> = {
  BOOSTER: "Booster",
  EXTRA_BOOSTER: "Extra Booster",
  STARTER: "Starter Deck",
  PROMO: "Promo",
  OTHER: "Other",
}

export const SET_TYPE_ORDER = ["BOOSTER", "EXTRA_BOOSTER", "STARTER", "PROMO", "OTHER"]
