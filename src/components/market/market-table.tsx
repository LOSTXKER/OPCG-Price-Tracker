"use client"

import { Fragment, type ReactNode } from "react"

import { SortableHeader } from "@/components/shared/sortable-header"
import { MobileCardItem, MobileCardSkeleton } from "@/components/home/mobile-card-item"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import type { CardRow, ColumnId, PriceMode } from "@/components/home/market-types"

import type { MarketColumn } from "./market-columns"
import { MarketTableRow, MarketTableRowSkeleton } from "./market-table-row"

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
}) {
  const lang = useUIStore((s) => s.language)
  const showSkeleton = isPending && cards.length === 0
  const isEmpty = !isPending && cards.length === 0

  const sparkFor = (card: CardRow) => (card.id != null ? sparklines[card.id] : undefined)

  return (
    <>
      {/* Mobile list fallback (<sm) */}
      <div className={cn("divide-y divide-[var(--p-hair)] sm:hidden", isPending && "opacity-50 transition-opacity")}>
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
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-[var(--p-hair)] text-eyebrow text-muted-foreground">
              {columns.map((col) => {
                if (col.sort) {
                  const label =
                    col.key === "change24h"
                      ? "24h"
                      : col.key === "change7d"
                        ? "7d"
                        : col.key === "change30d"
                          ? "30d"
                          : col.labelKey
                            ? t(lang, col.labelKey)
                            : ""
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
          <tbody className={cn(isPending && "opacity-50 transition-opacity")}>
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
