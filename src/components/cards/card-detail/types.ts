import type { ReactNode } from "react"

import type { PriceHistorySummary } from "./price-history"

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

export interface SiblingCard {
  id: number
  cardCode: string
  nameJp: string
  nameEn: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
  set: { code: string }
}

export interface RelatedCard {
  id: number
  cardCode: string
  nameJp: string
  nameEn: string | null
  nameTh?: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
  set: { code: string }
}

export interface CardSourcePrice {
  source: string
  askPriceJpy: number | null
  askPriceThb: number | null
  askPriceUsd: number | null
  soldPriceJpy: number | null
  soldPriceThb: number | null
  soldPriceUsd: number | null
  updatedAt: string | null
}

export interface CardDetailProps {
  /**
   * Server-rendered SEO slots. They are React nodes built in the page's SERVER
   * component and handed to this client tree, so their markup is in the first
   * HTML response for every user agent (no hydration or fetch required).
   */
  introSlot?: ReactNode
  /**
   * Derived price history (server-computed, serialisable). Passed as DATA, not
   * as a prebuilt node, so the chart's range control can govern how many rows
   * the table shows. Every row still renders during SSR at the default range,
   * so the crawler sees the full set.
   */
  priceHistory?: PriceHistorySummary
  /** Per-card FAQ (also emits FAQPage JSON-LD). */
  faqSlot?: ReactNode
  card: {
    id: number
    cardCode: string
    baseCode: string | null
    nameJp: string
    nameEn?: string | null
    nameTh?: string | null
    cardType: string
    color: string
    colorEn?: string | null
    rarity: string
    isParallel: boolean
    cost?: number | null
    power?: number | null
    counter?: number | null
    life?: number | null
    attribute?: string | null
    trait?: string | null
    effectJp?: string | null
    effectEn?: string | null
    effectTh?: string | null
    viewCount: number
    imageUrl: string | null
    latestPriceJpy: number | null
    latestPriceThb: number | null
    priceChange24h: number | null
    priceChange7d: number | null
    priceChange30d: number | null
    set: { code: string; name: string; nameEn?: string | null; nameTh?: string | null }
    price: { priceJpy: number; priceThb: number | null; inStock: boolean } | null
    chartData: {
      scrapedAt: string
      priceJpy: number | null
      priceThb: number | null
      priceUsd: number | null
      source?: string
      gradeCondition?: string | null
      type?: string | null
    }[]
  }
  siblings: SiblingCard[]
  relatedCards?: RelatedCard[]
  snkrdunkPrices?: {
    minPriceUsd: number | null
    psa10AskUsd: number | null
    psa10SoldUsd: number | null
    lastSoldUsd: number | null
  } | null
  sourcePricesRaw?: CardSourcePrice[]
  sourcePricesPsa10?: CardSourcePrice[]
  /** ISO timestamp of the most recent price observation across all sources. */
  latestUpdatedAt?: string | null
  /**
   * Days since `latestUpdatedAt` — pre-computed on the server because the
   * React 19 purity rule forbids `Date.now()` during render.
   */
  daysSinceUpdate?: number | null
  /** Active marketplace listings for this card (passed from server). */
  listings?: CardListing[]
  /** Server-resolved marketplace flag — must match SSR for hydration-safe mock vs live. */
  marketplaceEnabled?: boolean
}
