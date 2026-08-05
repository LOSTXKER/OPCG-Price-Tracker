"use client"

import { Fragment, type ReactNode } from "react"

import { SortableHeader } from "@/components/shared/sortable-header"
import { ToolbarSortDropdown } from "@/components/ui/toolbar"
import { MobileCardItem, MobileCardSkeleton } from "@/components/home/mobile-card-item"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import {
  periodForColumn,
  type CardRow,
  type ChangePeriod,
  type ColumnId,
} from "@/components/home/market-types"
import { isRawGrade, type GradeKey } from "@/lib/pricing/grade-tiers"

import { getMarketColumnLabel, type MarketColumn } from "./market-columns"
import {
  MarketTableLayout,
  marketTableHeaderClass,
} from "./market-table-layout"
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
  grade = "raw",
  changePeriod = "24h",
  sparklines,
  sortCol,
  sortDir,
  onColumnSort,
  isPending,
  skeletonRows,
  emptyText,
  surface = "card",
  showMobileSort = true,
  mobileSortAppearance = "soft",
  insetAfter,
  mobileInset,
  tableInset,
}: {
  cards: CardRow[]
  rankOffset: number
  columns: MarketColumn[]
  grade?: GradeKey
  /** Change window the mobile rows' % chip shows (home wires its period pill). */
  changePeriod?: ChangePeriod
  sparklines: Record<number, number[]>
  sortCol: ColumnId | null
  sortDir: "asc" | "desc"
  onColumnSort: (col: ColumnId) => void
  isPending: boolean
  skeletonRows: number
  emptyText: string
  /**
   * Surface the table sits on, so the sticky header blends with it.
   * `card` (default) — when a consumer intentionally owns a panel.
   * `canvas` — floating directly on the page background (Home and Search).
   */
  surface?: "card" | "canvas"
  /** Home composes sorting into its mobile toolbar; other consumers keep it here. */
  showMobileSort?: boolean
  /** Let a caller strengthen only its own mobile sort affordance. */
  mobileSortAppearance?: "soft" | "outline"
  /** Insert an optional full-width row after this many cards. */
  insetAfter?: number
  /** Mobile-list presentation. It must return null when not eligible. */
  mobileInset?: ReactNode
  /** Desktop presentation. It must resolve to a valid `<tr>` or null. */
  tableInset?: ReactNode
}) {
  const lang = useUIStore((s) => s.language)
  const showSkeleton = isPending && cards.length === 0
  const isEmpty = !isPending && cards.length === 0
  const rawGrade = isRawGrade(grade)

  const sparkFor = (card: CardRow) => (card.id != null ? sparklines[card.id] : undefined)

  // Sortable columns exposed to the mobile list (the <th> sort headers are
  // table-only, so <sm has no other way to re-sort). Same COLUMN_SORTS ids.
  const sortableCols = columns.filter(
    (column) =>
      column.sort &&
      (rawGrade ||
        (column.sort !== "price" && periodForColumn(column.sort) === null)),
  )

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
            appearance={mobileSortAppearance}
            onChange={(key) => onColumnSort(key)}
            fallbackLabel={t(lang, "sortBy")}
            align="start"
            stableMobileWidth
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
                  grade={grade}
                  changePeriod={changePeriod}
                />
                {insetAfter === i + 1 && mobileInset}
              </Fragment>
            ))}
        {isEmpty && <p className="py-12 text-center text-sm text-muted-foreground">{emptyText}</p>}
      </div>

      {/* Desktop table (≥sm) */}
      <MarketTableLayout
        columns={columns}
        surface={surface}
        bodyClassName={cn(isPending && "opacity-50 motion-base")}
        header={columns.map((col) => {
          const gradeSortable =
            col.sort &&
            (rawGrade ||
              (col.sort !== "price" && periodForColumn(col.sort) === null))
          if (gradeSortable && col.sort) {
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
          const label =
            col.key === "rank"
              ? "#"
              : col.key === "star"
                ? ""
                : getMarketColumnLabel(col, lang)
          return (
            <th key={col.key} className={marketTableHeaderClass(col)}>
              {label}
            </th>
          )
        })}
        footer={
          isEmpty ? (
            <p className="hidden py-12 text-center text-sm text-muted-foreground sm:block">
              {emptyText}
            </p>
          ) : undefined
        }
      >
        {showSkeleton
          ? Array.from({ length: skeletonRows }).map((_, i) => (
              <MarketTableRowSkeleton key={i} columns={columns} />
            ))
          : cards.map((card, i) => (
              <Fragment key={card.cardCode}>
                <MarketTableRow
                  card={card}
                  rank={rankOffset + i + 1}
                  columns={columns}
                  grade={grade}
                  sparkline={sparkFor(card)}
                />
                {insetAfter === i + 1 && tableInset}
              </Fragment>
            ))}
      </MarketTableLayout>
    </>
  )
}
