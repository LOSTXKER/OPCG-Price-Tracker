import { t, type Language, type TranslationKey } from "@/lib/i18n"
import type { ColumnId } from "@/components/home/market-types"

/**
 * Column model for the shared market table. The home and /search pages render
 * the SAME table; their only structural difference (home's "popular" tab swaps
 * the 7d column for a Views count) is expressed here as data, not as a branch in
 * the row. Both the `<colgroup>` and the row cells iterate this list so widths +
 * responsive visibility can never drift apart.
 *
 * Responsive policy (AGENTS.md): nothing critical below `sm` (the whole table is
 * replaced by the mobile list `<sm`); `md:` adds Set + 7d/Views; `lg:` adds the
 * 30-day sparkline (the "optional polish" column — momentum still lives in the
 * 24h/7d pills, so the trend line is never the only signal).
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

/** One label contract for Home, Search and market-like tables such as Watchlist. */
export function getMarketColumnLabel(
  column: { key: string; labelKey?: TranslationKey },
  lang: Language,
) {
  return column.key === "change24h"
    ? "24h"
    : column.key === "change7d"
      ? "7d"
      : column.key === "change30d"
        ? "30d"
        : column.labelKey
          ? t(lang, column.labelKey)
          : column.key
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

  // Raw 30-day trend chart — last column (CMC/Coinbase). Shares `lg:` with the
  // 30d delta; both fit the wide desktop container.
  cols.push({ key: "sparkline", col: "hidden w-[96px] lg:table-column", cell: "hidden lg:table-cell", align: "right", labelKey: "sparkline30d" })
  return cols
}

/** @deprecated Import the shared registry from `@/lib/pricing/grade-tiers`. */
export { GRADE_TIERS as MARKET_GRADE_TIERS } from "@/lib/pricing/grade-tiers"
/** @deprecated Import `GradeTier` from `@/lib/pricing/grade-tiers`. */
export type { GradeTier as MarketGradeTier } from "@/lib/pricing/grade-tiers"
