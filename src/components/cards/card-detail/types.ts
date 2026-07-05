export type CardListing = {
  id: string | number
  priceJpy: number
  priceThb: number | null
  condition: string
  /** ISO timestamp — listing created date (UTC formatting on client). */
  listedAtIso?: string
  user: {
    displayName: string | null
    avatarUrl: string | null
    sellerRating: number | null
    sellerReviewCount: number
  } | null
}
