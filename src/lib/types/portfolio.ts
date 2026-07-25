import type { PortfolioFinancialRollup } from "@/lib/portfolio/financials"

export type GameRef = {
  slug: string
  name: string
  nameEn: string | null
  logoUrl: string | null
}

export interface PortfolioStats extends PortfolioFinancialRollup {
  /** Compatibility aliases for existing portfolio detail consumers. */
  totalValueJpy: number
  totalCostJpy: number
  unrealizedPnl: number | null
  unrealizedPnlPercent: number | null
  bestPerformer: { name: string; pnl: number; pnlPercent: number | null } | null
  worstPerformer: { name: string; pnl: number; pnlPercent: number | null } | null
}

export type AllocationSlice = {
  name: string
  value: number
  percent: number
  imageUrl?: string | null
  cardCode?: string | null
}

export type PortfolioLotSource = "MANUAL" | "LEGACY_OPENING_BALANCE"

/**
 * One real acquisition event under a grouped holding. Costs are stored in JPY
 * per physical copy; `null` means unknown while `0` means acquired for free.
 */
export type PortfolioLot = {
  id: number
  quantity: number
  unitCostJpy: number | null
  acquiredAt: string | null
  note: string | null
  source: PortfolioLotSource
  createdAt: string
  updatedAt: string
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
  lots: PortfolioLot[]
  /** Number of separate acquisition events under this grouped holding. */
  lotCount: number
  /** Exact sum of costs from lots whose unit cost is known. */
  recordedCostJpy: number
  /** Number of physical copies whose lot cost is known. */
  costedCopyCount: number
  /** Rollout-only weighted average; lot-aware UI must not use this for totals. */
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

/**
 * Owner-only view model for the Overview list. A holding can produce multiple
 * rows — one for each acquisition lot — while `AssetRow` remains the grouped
 * holding contract used by Insights and public/share surfaces.
 */
export type PortfolioPurchaseRow = {
  rowKey: string
  itemId: number
  lotId: number | null
  /** One-based position within the holding's acquisition history. */
  lotIndex: number
  purchaseCount: number
  isCompatibilityRow: boolean
  source: PortfolioLotSource
  cardId: number
  cardCode: string
  baseCode: string | null
  nameJp: string
  nameEn: string | null
  rarity: string
  imageUrl: string | null
  quantity: number
  /** Cost in JPY per physical copy. `null` is unknown; `0` is free. */
  unitCostJpy: number | null
  acquiredAt: string | null
  /** Immutable-ish creation time used only as a deterministic sort fallback. */
  purchaseCreatedAt: string | null
  purchaseNote: string | null
  currentPrice: number | null
  currentPriceThb: number | null
  condition: string
  isPrivate?: boolean
  game: GameRef | null
}

/** Minimal card info for the hub's per-portfolio thumbnail strip. */
export type PortfolioPreviewItem = {
  cardCode: string
  imageUrl: string | null
  nameJp: string
  nameEn: string | null
}

export type PortfolioMeta = PortfolioFinancialRollup & {
  id: number
  name: string
  isPublic: boolean
  /** Compatibility aliases for existing manager/switcher consumers. */
  totalValue: number
  totalCost: number
  /** Number of distinct holding rows (card + condition). */
  itemCount: number
  /** Total physical copies across every holding row. */
  copyCount: number
  /** Distinct games represented by this portfolio. */
  games: GameRef[]
  /** Top holdings by value (desc), capped small — thumbnails on the hub's
   *  portfolio card, not a full listing. */
  previewItems: PortfolioPreviewItem[]
}

export type PortfolioQuota = {
  effectiveTier: string
  /** `null` means unlimited — JSON cannot represent `Infinity`. */
  portfolioCount: number | null
  /** `null` means unlimited — JSON cannot represent `Infinity`. */
  portfolioCards: number | null
}

/** Every portfolio mutation preserves the HTTP outcome for reliable UI feedback. */
export type PortfolioMutationResult<T = undefined> =
  | { ok: true; status: number; error: null; data: T }
  | { ok: false; status: number; error: string; data?: undefined }

export type PortfolioBatchResult = PortfolioMutationResult<{
  added: number
  updated: number
}> & {
  failed: number
  limitReached?: boolean
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
  /** Optional on legacy snapshots created before acquisition-lot coverage. */
  totalCopyCount?: number | null
  /** Optional on legacy snapshots created before acquisition-lot coverage. */
  costedCopyCount?: number | null
  isInflow: boolean
}

/**
 * Per-game roll-up for the aggregate hero + breakdown row. With a single game
 * (OPCG today) the UI collapses to one implicit group; when a second game lands
 * the same data drives the "All games" aggregate + per-game deep-links
 * (VISION §5.7). `game` is null only when no game is linked to the card's set.
 */
export type GameBreakdown = PortfolioFinancialRollup & {
  game: GameRef | null
  /** Compatibility aliases for existing game-breakdown consumers. */
  valueJpy: number
  costJpy: number
  pnl: number | null
  pnlPercent: number | null
  count: number
}
