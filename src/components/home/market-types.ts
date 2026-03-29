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
  | "views_desc"
  | "newest"
  | "name"

export type PriceMode = "raw" | "psa10"

export type ViewMode = "table" | "grid"

export type ChangePeriod = "24h" | "7d" | "30d"

export const CHANGE_PERIODS: ChangePeriod[] = ["24h", "7d", "30d"]

export type ColumnId = "price" | "change24h" | "change7d" | "change30d"

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
  change24h: { desc: "change_desc", asc: "change_asc" },
  change7d: { desc: "change_7d_desc", asc: "change_7d_asc" },
  change30d: { desc: "change_30d_desc", asc: "change_30d_asc" },
}

export function parseSortColumn(sort: SortKey): { col: ColumnId | null; dir: "asc" | "desc" } {
  for (const [col, keys] of Object.entries(COLUMN_SORTS) as [ColumnId, { desc: SortKey; asc: SortKey }][]) {
    if (sort === keys.desc) return { col, dir: "desc" }
    if (sort === keys.asc) return { col, dir: "asc" }
  }
  return { col: null, dir: "desc" }
}

export { CARDS_PAGE_SIZE as PAGE_SIZE } from "@/lib/constants/ui"
