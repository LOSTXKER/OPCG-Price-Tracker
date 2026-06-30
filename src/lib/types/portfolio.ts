export type GameRef = {
  slug: string
  name: string
  nameEn: string | null
  logoUrl: string | null
}

export interface PortfolioStats {
  totalValueJpy: number
  totalCostJpy: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  bestPerformer: { name: string; pnl: number; pnlPercent: number } | null
  worstPerformer: { name: string; pnl: number; pnlPercent: number } | null
}

export type AllocationSlice = {
  name: string
  value: number
  percent: number
  imageUrl?: string | null
  cardCode?: string | null
}

export type AssetRow = {
  itemId: number
  cardId: number
  cardCode: string
  baseCode: string | null
  nameJp: string
  nameEn: string | null
  rarity: string
  imageUrl: string | null
  quantity: number
  purchasePrice: number | null
  currentPrice: number | null
  /** Card's own THB price when scraped — preferred over JPY→THB estimate. */
  currentPriceThb: number | null
  priceChange24h: number | null
  priceChange7d: number | null
  condition: string
  isPrivate?: boolean
  notes: string | null
  /** Owning game (via the card's set). Null when no game is linked yet. */
  game: GameRef | null
}

export type PortfolioMeta = {
  id: number
  name: string
  isPublic: boolean
  totalValue: number
  totalCost: number
  itemCount: number
}

export type TransactionRow = {
  id: number
  type: string
  quantity: number
  pricePerUnit: number | null
  note: string | null
  createdAt: string
  card: {
    cardCode: string
    nameJp: string
    nameEn: string | null
    imageUrl: string | null
    rarity: string
  }
}

/**
 * One point on the portfolio value timeline. Superset of the legacy
 * `{ label, value }` shape so existing consumers keep working. `value` and
 * `cost`/`netInvested` are raw JPY (the chart converts to display currency).
 * `netInvested` falls back to `cost` for pre-migration snapshots. `isInflow`
 * marks a snapshot where the invested baseline stepped up (cards added) — drawn
 * as a honey notch so an inflow never reads as a gain (VISION §5.3 honesty).
 */
export type HistoryPoint = {
  label: string
  date: string
  value: number
  cost: number
  netInvested: number
  cardCount: number
  isInflow: boolean
}

/**
 * Per-game roll-up for the aggregate hero + breakdown row. With a single game
 * (OPCG today) the UI collapses to one implicit group; when a second game lands
 * the same data drives the "All games" aggregate + per-game deep-links
 * (VISION §5.7). `game` is null only when no game is linked to the card's set.
 */
export type GameBreakdown = {
  game: GameRef | null
  valueJpy: number
  costJpy: number
  pnl: number
  pnlPercent: number
  count: number
}
