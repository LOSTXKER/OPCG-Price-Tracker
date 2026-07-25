import type { GradeKey } from "@/lib/pricing/grade-tiers"

export type TabId = "all" | "popular" | "latest"

export interface Tab {
  id: TabId
  label: string
  defaultSort: SortKey
  extraParams?: Record<string, string>
}

export type SortKey =
  | "price_desc"
  | "price_asc"
  | "change_desc"
  | "change_asc"
  | "change_7d_desc"
  | "change_7d_asc"
  | "change_30d_desc"
  | "change_30d_asc"
  | "rarity_desc"
  | "rarity_asc"
  | "views_desc"
  | "newest"
  | "name"

/** @deprecated Use GradeKey and the `grade` prop/query parameter. */
export type PriceMode = GradeKey

export type ViewMode = "table" | "grid"

export type ChangePeriod = "24h" | "7d" | "30d"

export const CHANGE_PERIODS: ChangePeriod[] = ["24h", "7d", "30d"]

export type ColumnId = "price" | "rarity" | "change24h" | "change7d" | "change30d"

export interface CardRow {
  id?: number
  cardCode: string
  baseCode?: string | null
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
  rarity: string
  isParallel: boolean
  imageUrl?: string | null
  latestPriceJpy?: number | null
  psa10PriceUsd?: number | null
  priceChange24h?: number | null
  priceChange7d?: number | null
  priceChange30d?: number | null
  viewCount?: number
  setCode?: string
  set?: { code: string; name?: string; nameEn?: string | null }
}

export interface ApiResponse {
  cards: CardRow[]
  total: number
  page: number
  totalPages: number
}

export const COLUMN_SORTS: Record<ColumnId, { desc: SortKey; asc: SortKey }> = {
  price: { desc: "price_desc", asc: "price_asc" },
  rarity: { desc: "rarity_desc", asc: "rarity_asc" },
  change24h: { desc: "change_desc", asc: "change_asc" },
  change7d: { desc: "change_7d_desc", asc: "change_7d_asc" },
  change30d: { desc: "change_30d_desc", asc: "change_30d_asc" },
}

/** Display period → its sortable change column (mobile tap-sort + period pill). */
export const PERIOD_COLUMNS: Record<ChangePeriod, ColumnId> = {
  "24h": "change24h",
  "7d": "change7d",
  "30d": "change30d",
}

/** Inverse of PERIOD_COLUMNS — null for non-change columns (price/rarity). */
export function periodForColumn(col: ColumnId): ChangePeriod | null {
  for (const [period, c] of Object.entries(PERIOD_COLUMNS) as [ChangePeriod, ColumnId][]) {
    if (c === col) return period
  }
  return null
}

/**
 * When the display period changes, an active change sort follows it (same
 * direction, new period's column) so the order always matches the % window
 * being shown. Returns null when the sort should stay put (price/rarity/views
 * sorts, or already on the right column).
 */
export function retargetSortForPeriod(sort: SortKey, period: ChangePeriod): SortKey | null {
  const current = parseSortColumn(sort)
  const nextCol = PERIOD_COLUMNS[period]
  if (current.col === null || current.col === nextCol) return null
  if (periodForColumn(current.col) === null) return null
  return COLUMN_SORTS[nextCol][current.dir]
}

export function parseSortColumn(sort: SortKey): { col: ColumnId | null; dir: "asc" | "desc" } {
  for (const [col, keys] of Object.entries(COLUMN_SORTS) as [ColumnId, { desc: SortKey; asc: SortKey }][]) {
    if (sort === keys.desc) return { col, dir: "desc" }
    if (sort === keys.asc) return { col, dir: "asc" }
  }
  return { col: null, dir: "desc" }
}

export { CARDS_PAGE_SIZE as PAGE_SIZE } from "@/lib/constants/ui"
