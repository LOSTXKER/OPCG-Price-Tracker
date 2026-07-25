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
  nameTh?: string | null
  type: string
  imageUrl?: string | null
  releaseDate?: string | null
  _count: { cards: number }
}

export type CartItem = {
  card: CardWithSet
  quantity: number
  /** Cost per copy, normalized to JPY before this item reaches the API hook. */
  purchasePrice: number
  /** Calendar date for the acquisition lot, formatted as YYYY-MM-DD. */
  acquiredAt: string
  /** Note attached to this purchase lot, not the parent holding. */
  lotNote: string | null
}

export const SET_TYPE_LABELS: Record<string, string> = {
  BOOSTER: "Booster",
  EXTRA_BOOSTER: "Extra Booster",
  STARTER: "Starter Deck",
  PROMO: "Promo",
  OTHER: "Other",
}

export const SET_TYPE_ORDER = ["BOOSTER", "EXTRA_BOOSTER", "STARTER", "PROMO", "OTHER"]
