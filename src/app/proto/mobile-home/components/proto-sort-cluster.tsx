"use client"

import { TrendingUpDown } from "lucide-react"

import { SortableHeader } from "@/components/shared/sortable-header"
import { CHANGE_PERIODS, type ChangePeriod } from "@/components/home/market-types"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

export type ProtoSortCol = "price" | "change"
export type ProtoSortDir = "asc" | "desc"

/**
 * Variant A's merged sort control — the piece that lets the sticky row absorb
 * the old period-pill row. "ราคา" tap-sorts as today; "เปลี่ยนแปลง" and the
 * period chip share one joined pill: the label sorts by the CURRENT period's %
 * column, the chip cycles 24h → 7d → 30d (CMC mobile grammar — the period is a
 * modifier of the % column, not a page-level mode). Isolated in its own file so
 * it can be promoted verbatim if A wins; the specced fallback is a single
 * "เรียงตาม ⌄" menu chip, one-file swap here.
 */
export function ProtoSortCluster({
  period,
  onPeriodChange,
  sortCol,
  sortDir,
  onSort,
  sortEnabled,
  className,
}: {
  period: ChangePeriod
  onPeriodChange: (p: ChangePeriod) => void
  sortCol: ProtoSortCol
  sortDir: ProtoSortDir
  onSort: (col: ProtoSortCol) => void
  /** Graded lenses keep the geometry but drop tap-sort (deltas aren't real). */
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
        <SortableHeader<ProtoSortCol>
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
          <SortableHeader<ProtoSortCol>
            as="button"
            label={t(lang, "change")}
            column="change"
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
          aria-label={`ช่วงเวลา ${period} — แตะเพื่อสลับ 24h / 7d / 30d`}
          className="ease-chrome inline-flex min-h-11 items-center gap-1 rounded-e-full pe-2.5 ps-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          <TrendingUpDown
            className="size-3 text-muted-foreground"
            aria-hidden
          />
          {period}
        </button>
      </div>
    </div>
  )
}
