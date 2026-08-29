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
 * Every segment shares one geometry so the capsule keeps an even rhythm.
 *
 * The insets are tight on purpose: this row shares 360px with the grade lens
 * (Raw / PSA 10 / …), which scrolls sideways when squeezed — every pixel spent
 * here is a pixel of grade label someone has to swipe for. Measured on a 360px
 * phone: the capsule lands at ~203px, a little narrower than the two separate
 * controls it replaced (207px), so folding price in cost the grades nothing.
 */
const SEGMENT = "ease-chrome inline-flex min-h-11 items-center hover:bg-muted"

/**
 * The phone list's sort control: price, change, and the change window, all in
 * ONE segmented capsule.
 *
 * Two rounds of folding got it here. First the period pill gave up its own
 * 44px band (owner selection 2026-08-29, from /proto/mobile-home) — the phone
 * was spending three stacked rows on controls before the first price, and the
 * period is really a modifier of the % column, so it joined "เปลี่ยนแปลง".
 * Then price joined them too (owner, 2026-08-30): it was the only control left
 * outside, and one loose label beside a bordered capsule reads as leftovers
 * rather than as the other half of the same choice.
 *
 * What the three segments do differs, and that is the point of the dividers:
 * the first two SORT (only one can be active), the last CYCLES 24h → 7d → 30d
 * and re-aims the middle one (CoinMarketCap's mobile grammar).
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
        "flex items-center overflow-hidden rounded-full border border-hair text-muted-foreground",
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
          className={cn(SEGMENT, "gap-1 pe-1.5 ps-2.5 aria-pressed:text-foreground")}
        />
      ) : (
        <span className={cn(SEGMENT, "text-eyebrow pe-1.5 ps-2.5 text-foreground")}>
          {t(lang, "price")}
        </span>
      )}

      <span aria-hidden className="h-3 w-px shrink-0 bg-hair" />

      {sortEnabled ? (
        <SortableHeader<ColumnId>
          as="button"
          label={t(lang, "change")}
          column={PERIOD_COLUMNS[period]}
          activeCol={sortCol}
          dir={sortDir}
          onClick={onSort}
          className={cn(SEGMENT, "gap-1 px-1.5 aria-pressed:text-foreground")}
        />
      ) : (
        <span className={cn(SEGMENT, "text-eyebrow px-1.5")}>
          {t(lang, "change")}
        </span>
      )}

      <span aria-hidden className="h-3 w-px shrink-0 bg-hair" />

      <button
        type="button"
        onClick={cyclePeriod}
        aria-label={`${t(lang, "pricePeriod")} ${period}`}
        className={cn(SEGMENT, "gap-1 pe-2.5 ps-1.5 text-xs font-medium text-foreground")}
      >
        <TrendingUpDown className="size-3 text-muted-foreground" aria-hidden />
        {period}
      </button>
    </div>
  )
}
