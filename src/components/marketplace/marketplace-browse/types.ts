export type MarketplaceBrowseListing = {
  id: number
  priceJpy: number
  priceThb: number | null
  condition: string
  shipping: string[]
  location: string | null
  isFeatured: boolean
  card: {
    cardCode: string
    nameJp: string
    nameEn?: string | null
    rarity: string
    imageUrl: string | null
    latestPriceJpy: number | null
  }
  user: {
    displayName: string | null
    avatarUrl: string | null
    sellerRating: number | null
    sellerReviewCount: number
  }
}

export type BrowseResponse = {
  listings: MarketplaceBrowseListing[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type LockedSeller = {
  id: string
  handle: string | null
  displayName: string | null
} | null

export const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const
// Version facet — ปกติ / พาราเลล (regular | parallel). Rarity is BASE-only now
// (SEC/SR/R/UC/C/L/SP/TR/DON come from the game config); parallel is no longer a
// rarity chip. Selecting a version sends the `variant` param.
export const VARIANTS = ["regular", "parallel"] as const
export const SORT_OPTIONS = [
  { value: "newest", labelKey: "sortNewest" },
  { value: "price_jpy_asc", labelKey: "sortPriceAsc", currency: "JPY" },
  { value: "price_jpy_desc", labelKey: "sortPriceDesc", currency: "JPY" },
  { value: "price_thb_asc", labelKey: "sortPriceAsc", currency: "THB" },
  { value: "price_thb_desc", labelKey: "sortPriceDesc", currency: "THB" },
] as const
