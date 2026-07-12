"use client"

import { Fragment, type ReactNode } from "react"

import { SortableHeader } from "@/components/shared/sortable-header"
import { ToolbarSortDropdown } from "@/components/ui/toolbar"
import { MobileCardItem, MobileCardSkeleton } from "@/components/home/mobile-card-item"
import { t, type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import type { CardRow, ColumnId, PriceMode } from "@/components/home/market-types"

import type { MarketColumn } from "./market-columns"
import { MarketTableRow, MarketTableRowSkeleton } from "./market-table-row"

/** Shared label for desktop sort headers and compact mobile sort controls. */
export function getMarketColumnLabel(col: MarketColumn, lang: Language) {
  return col.key === "change24h"
    ? "24h"
    : col.key === "change7d"
      ? "7d"
      : col.key === "change30d"
        ? "30d"
        : col.labelKey
          ? t(lang, col.labelKey)
          : col.key
}

/**
 * Shared market table (the "table" view body) used by BOTH the homepage and
 * /search. Purely presentational — it never calls a data hook; each page feeds
 * it `cards` + sort state + `sparklines` from its own hook (`useMarketCards` vs
 * `useSearch`). Renders the desktop `<table>` (≥sm) and the mobile list fallback
 * (<sm) from one `columns` model so widths/visibility stay in sync.
 */
export function MarketTable({
  cards,
  rankOffset,
  columns,
  priceMode = "raw",
  sparklines,
  sortCol,
  sortDir,
  onColumnSort,
  isPending,
  skeletonRows,
  emptyText,
  inFeedAd,
  surface = "card",
  showMobileSort = true,
}: {
  cards: CardRow[]
  rankOffset: number
  columns: MarketColumn[]
  priceMode?: PriceMode
  sparklines: Record<number, number[]>
  sortCol: ColumnId | null
  sortDir: "asc" | "desc"
  onColumnSort: (col: ColumnId) => void
  isPending: boolean
  skeletonRows: number
  emptyText: string
  /** Optional slot rendered after row `index` in the mobile list (home in-feed ad). */
  inFeedAd?: (index: number) => ReactNode
  /**
   * Surface the table sits on, so the sticky header blends with it.
   * `card` (default) — inside a `<Surface panel>` (e.g. /search).
   * `canvas` — floating directly on the page background (e.g. home market).
   */
  surface?: "card" | "canvas"
  /** Home composes sorting into its mobile toolbar; other consumers keep it here. */
  showMobileSort?: boolean
}) {
  const lang = useUIStore((s) => s.language)
  const showSkeleton = isPending && cards.length === 0
  const isEmpty = !isPending && cards.length === 0

  const sparkFor = (card: CardRow) => (card.id != null ? sparklines[card.id] : undefined)

  // Sortable columns exposed to the mobile list (the <th> sort headers are
  // table-only, so <sm has no other way to re-sort). Same COLUMN_SORTS ids.
  const sortableCols = columns.filter((c) => c.sort)

  return (
    <>
      {/* Mobile sort control (<sm) — the sortable <th> headers live in the
          desktop table only; on mobile expose sort via the sort dropdown. */}
      {showMobileSort && sortableCols.length > 0 && !isEmpty && (
        <div className="flex items-center gap-2 pb-2 sm:hidden">
          <span className="text-meta shrink-0">{t(lang, "sortBy")}</span>
          <ToolbarSortDropdown
            options={sortableCols.map((c) => ({
              key: c.sort as ColumnId,
              label: getMarketColumnLabel(c, lang),
            }))}
            activeKey={(sortCol ?? "") as ColumnId}
            activeDir={sortDir}
            onChange={(key) => onColumnSort(key)}
            fallbackLabel={t(lang, "sortBy")}
            align="start"
          />
        </div>
      )}

      {/* Mobile list fallback (<sm) */}
      <div className={cn("divide-y divide-hair sm:hidden", isPending && "opacity-50 motion-base")}>
        {showSkeleton
          ? Array.from({ length: 6 }).map((_, i) => <MobileCardSkeleton key={i} />)
          : cards.map((card, i) => (
              <Fragment key={card.cardCode}>
                <MobileCardItem
                  card={card}
                  rank={rankOffset + i + 1}
                  priceMode={priceMode}
                  sparkline={sparkFor(card)}
                />
                {inFeedAd?.(i)}
              </Fragment>
            ))}
        {isEmpty && <p className="py-12 text-center text-sm text-muted-foreground">{emptyText}</p>}
      </div>

      {/* Desktop table (≥sm) */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} className={col.col || undefined} />
            ))}
          </colgroup>
          <thead className={cn("sticky top-0 z-10", surface === "canvas" ? "bg-background" : "bg-card")}>
            <tr className="border-b border-hair text-eyebrow text-muted-foreground">
              {columns.map((col) => {
                if (col.sort) {
                  const label = getMarketColumnLabel(col, lang)
                  return (
                    <SortableHeader
                      key={col.key}
                      label={label}
                      column={col.sort}
                      activeCol={sortCol}
                      dir={sortDir}
                      onClick={onColumnSort}
                      align={col.align === "right" ? "right" : "left"}
                      className={col.cell || undefined}
                    />
                  )
                }
                const label = col.key === "rank" ? "#" : col.labelKey ? t(lang, col.labelKey) : ""
                return (
                  <th
                    key={col.key}
                    className={cn(
                      "whitespace-nowrap py-2.5 font-medium",
                      col.key === "star" ? "pl-3 pr-0" : col.key === "rank" ? "px-1" : "pr-3 pl-2",
                      col.cell,
                      col.align === "right" && "text-right",
                    )}
                  >
                    {label}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className={cn(isPending && "opacity-50 motion-base")}>
            {showSkeleton
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <MarketTableRowSkeleton key={i} columns={columns} />
                ))
              : cards.map((card, i) => (
                  <MarketTableRow
                    key={card.cardCode}
                    card={card}
                    rank={rankOffset + i + 1}
                    columns={columns}
                    priceMode={priceMode}
                    sparkline={sparkFor(card)}
                  />
                ))}
          </tbody>
        </table>
        {isEmpty && (
          <p className="hidden py-12 text-center text-sm text-muted-foreground sm:block">{emptyText}</p>
        )}
      </div>
    </>
  )
}
