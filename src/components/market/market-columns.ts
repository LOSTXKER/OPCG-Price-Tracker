import { Shield, type LucideIcon } from "lucide-react"

import type { TranslationKey } from "@/lib/i18n"
import type { ColumnId, PriceMode } from "@/components/home/market-types"

/**
 * Column model for the shared market table. The home and /search pages render
 * the SAME table; their only structural difference (home's "popular" tab swaps
 * the 7d column for a Views count) is expressed here as data, not as a branch in
 * the row. Both the `<colgroup>` and the row cells iterate this list so widths +
 * responsive visibility can never drift apart.
 *
 * Responsive policy (AGENTS.md): nothing critical below `sm` (the whole table is
 * replaced by the mobile list `<sm`); `md:` adds Set + 7d/Views; `lg:` adds the
 * sparkline (the "optional polish" column — momentum still lives in the 24h/7d
 * pills, so the trend line is never the only signal).
 */
export type MarketColumnKey =
  | "star"
  | "rank"
  | "card"
  | "set"
  | "rarity"
  | "price"
  | "change24h"
  | "change7d"
  | "change30d"
  | "views"
  | "sparkline"

export interface MarketColumn {
  key: MarketColumnKey
  /** class for the <col> in <colgroup> (width + responsive table-column) */
  col: string
  /** class for the <td>/<th> (responsive table-cell visibility) */
  cell: string
  align?: "left" | "right"
  /** sortable column id → SortableHeader + COLUMN_SORTS */
  sort?: ColumnId
  /** i18n key for the header label (literal "24h"/"7d" handled in the table) */
  labelKey?: TranslationKey
}

export function buildMarketColumns({ showViews }: { showViews: boolean }): MarketColumn[] {
  const cols: MarketColumn[] = [
    { key: "star", col: "w-8", cell: "" },
    { key: "rank", col: "w-10", cell: "" },
    { key: "card", col: "", cell: "", align: "left", labelKey: "card" },
    { key: "set", col: "hidden w-[72px] md:table-column", cell: "hidden md:table-cell", labelKey: "set" },
    { key: "rarity", col: "hidden w-[88px] sm:table-column", cell: "hidden sm:table-cell", sort: "rarity", labelKey: "rarity" },
    { key: "price", col: "w-[110px]", cell: "", align: "right", sort: "price", labelKey: "price" },
    { key: "change24h", col: "w-[84px]", cell: "", align: "right", sort: "change24h" },
  ]

  if (showViews) {
    cols.push({ key: "views", col: "hidden w-[80px] md:table-column", cell: "hidden md:table-cell", align: "right", labelKey: "visits" })
  } else {
    cols.push(
      { key: "change7d", col: "hidden w-[84px] md:table-column", cell: "hidden md:table-cell", align: "right", sort: "change7d" },
      { key: "change30d", col: "hidden w-[84px] lg:table-column", cell: "hidden lg:table-cell", align: "right", sort: "change30d" },
    )
  }

  // 7-day trend chart — last column (CMC/Coinbase). Shares `lg:` with 30d; both
  // fit the wide desktop container.
  cols.push({ key: "sparkline", col: "hidden w-[96px] lg:table-column", cell: "hidden lg:table-cell", align: "right" })
  return cols
}

/**
 * Extensible grade/price tiers for the price-mode control. Design-first: only
 * `real: true` tiers (the scraped data — Raw = Yuyutei JPY, PSA 10 = SNKRDUNK
 * USD) surface today. PSA 9 / PSA 8 / BGS are MODELED estimates (see
 * card-detail/grades.ts) and must NOT appear as plain numbers in a scannable
 * table — when a real per-grade series lands, add them here with `real: false`
 * and the row will mark them "est" and blank their deltas (the gate is `real`).
 */
export interface MarketGradeTier {
  key: string
  label: string
  mode: PriceMode
  real: boolean
  icon?: LucideIcon
}

export const MARKET_GRADE_TIERS: MarketGradeTier[] = [
  { key: "raw", label: "Raw", mode: "raw", real: true },
  { key: "psa_10", label: "PSA 10", mode: "psa10", real: true, icon: Shield },
  // Future (modeled — gate behind `real` + an "est" marker before surfacing):
  // { key: "psa_9",  label: "PSA 9",   mode: "psa10", real: false },
  // { key: "psa_8",  label: "PSA 8",   mode: "psa10", real: false },
  // { key: "bgs_95", label: "BGS 9.5", mode: "psa10", real: false },
]
