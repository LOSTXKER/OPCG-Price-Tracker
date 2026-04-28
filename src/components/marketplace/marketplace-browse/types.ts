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
export const RARITIES = ["L", "SEC", "SR", "R", "UC", "C", "P", "SP"] as const
export const SORT_OPTIONS = [
  { value: "newest", label: "ใหม่ล่าสุด" },
  { value: "price_jpy_asc", label: "ราคาต่ำ → สูง" },
  { value: "price_jpy_desc", label: "ราคาสูง → ต่ำ" },
  { value: "price_thb_asc", label: "ราคา ฿ ต่ำ → สูง" },
  { value: "price_thb_desc", label: "ราคา ฿ สูง → ต่ำ" },
] as const
