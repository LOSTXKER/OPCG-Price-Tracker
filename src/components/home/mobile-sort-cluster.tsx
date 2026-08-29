"use client"

import { TrendingUpDown } from "lucide-react"

import { SortableHeader } from "@/components/shared/sortable-header"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

import {
  CHANGE_PERIODS,
  PERIOD_COLUMNS,
  type ChangePeriod,
  type ColumnId,
} from "./market-types"

/**
 * The phone list's sort control, with the change window folded into it.
 *
 * Before (owner selection 2026-08-29, from /proto/mobile-home): the period
 * pill owned a whole 44px band of its own, so the phone spent three stacked
 * rows on controls before the first price. Here the period is what it actually
 * is — a modifier of the % column — so it rides the "เปลี่ยนแปลง" label as one
 * joined pill: the label sorts by the current period's column, the chip cycles
 * 24h → 7d → 30d (CoinMarketCap's mobile grammar).
 *
 * Graded lenses keep the geometry but drop the tap-sort, because their
 * historical deltas are modeled rather than real.
 */
export function MobileSortCluster({
  period,
  onPeriodChange,
  sortCol,
  sortDir,
  onSort,
  sortEnabled,
  className,
}: {
  period: ChangePeriod
  onPeriodChange: (period: ChangePeriod) => void
  sortCol: ColumnId | null
  sortDir: "asc" | "desc"
  onSort: (col: ColumnId) => void
  sortEnabled: boolean
  className?: string
}) {
  const lang = useUIStore((s) => s.language)

  const cyclePeriod = () => {
    const i = CHANGE_PERIODS.indexOf(period)
    onPeriodChange(CHANGE_PERIODS[(i + 1) % CHANGE_PERIODS.length])
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-muted-foreground min-[360px]:gap-2",
        className,
      )}
    >
      {sortEnabled ? (
        <SortableHeader<ColumnId>
          as="button"
          label={t(lang, "price")}
          column="price"
          activeCol={sortCol}
          dir={sortDir}
          onClick={onSort}
          className="aria-pressed:text-foreground"
        />
      ) : (
        <span className="text-eyebrow text-foreground">{t(lang, "price")}</span>
      )}

      <span aria-hidden className="h-3 w-px bg-hair" />

      <div className="flex items-center rounded-full border border-hair">
        {sortEnabled ? (
          <SortableHeader<ColumnId>
            as="button"
            label={t(lang, "change")}
            column={PERIOD_COLUMNS[period]}
            activeCol={sortCol}
            dir={sortDir}
            onClick={onSort}
            className="pe-1.5 ps-2.5 aria-pressed:text-foreground"
          />
        ) : (
          <span className="text-eyebrow flex min-h-11 items-center pe-1.5 ps-2.5">
            {t(lang, "change")}
          </span>
        )}
        <span aria-hidden className="h-3 w-px bg-hair" />
        <button
          type="button"
          onClick={cyclePeriod}
          aria-label={`${t(lang, "pricePeriod")} ${period}`}
          className="ease-chrome inline-flex min-h-11 items-center gap-1 rounded-e-full pe-2.5 ps-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          <TrendingUpDown className="size-3 text-muted-foreground" aria-hidden />
          {period}
        </button>
      </div>
    </div>
  )
}
