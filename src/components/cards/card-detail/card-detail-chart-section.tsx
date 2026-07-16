"use client"

import { MoveHorizontal } from "lucide-react"

import { AdSlot } from "@/components/ads/ad-slot"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Skeleton } from "@/components/ui/skeleton"
import { t, type Currency, type Language } from "@/lib/i18n"
import { formatDisplayValue } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"

import {
  RANGES,
  ScrubChart,
  type ChartRange,
  type ChartSeries,
} from "./card-chart"
import type { GradeDatum, GradeKey } from "./grades"

interface CardDetailChartSectionProps {
  lang: Language
  currency: Currency
  hydrated: boolean
  latestUpdatedAt?: string | null
  gradeLabel: string
  selectedGrade: GradeKey
  datum: GradeDatum
  range: ChartRange
  onRangeChange: (range: ChartRange) => void
  series: ChartSeries[]
  activeIndex: number | null
  onScrub: (index: number | null) => void
  activeValue: number | null
  shownDate: string | null
  windowLabel: string
}

/** Selected-grade chart, range controls, live announcement, and desktop ad rail. */
export function CardDetailChartSection({
  lang,
  currency,
  hydrated,
  latestUpdatedAt,
  gradeLabel,
  selectedGrade,
  datum,
  range,
  onRangeChange,
  series,
  activeIndex,
  onScrub,
  activeValue,
  shownDate,
  windowLabel,
}: CardDetailChartSectionProps) {
  const chartHeights = "h-[210px] sm:h-[280px] lg:h-[320px]"

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="min-w-0">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-eyebrow">
            {t(lang, "priceHistory")} · {gradeLabel}
          </p>
          <SegmentedControl<ChartRange>
            options={RANGES.map((rangeOption) => ({
              value: rangeOption,
              label: rangeOption,
            }))}
            value={range}
            onChange={onRangeChange}
            size="sm"
            variant="pill"
            ariaLabel={t(lang, "priceHistory")}
          />
        </div>

        {!datum.hasData ? (
          <div
            className={cn(
              "flex items-center justify-center rounded-xl bg-foreground/[0.025] p-5 text-center",
              chartHeights,
            )}
          >
            <div>
              <p className="text-h5 text-foreground">{t(lang, "noEditionPrice")}</p>
              <p className="text-meta mt-1 max-w-sm">
                {t(lang, "noEditionPriceDesc")}
              </p>
            </div>
          </div>
        ) : hydrated ? (
          <div key={`${selectedGrade}-${range}`} className="rise">
            <ScrubChart
              series={series}
              activeIndex={activeIndex}
              onScrub={onScrub}
              onScrubEnd={() => onScrub(null)}
              lang={lang}
              latestUpdatedAt={latestUpdatedAt}
              range={range}
            />
          </div>
        ) : (
          <Skeleton className={cn("rounded-xl", chartHeights)} />
        )}

        <div aria-live="polite" className="sr-only">
          {activeIndex != null && activeValue != null
            ? `${shownDate ?? windowLabel} · ${formatDisplayValue(activeValue, currency)}`
            : ""}
        </div>

        {datum.hasData && hydrated && (
          <p className="text-meta mt-2 flex items-center justify-center gap-1.5 sm:hidden">
            <MoveHorizontal className="size-3.5" aria-hidden />
            {t(lang, "dragChartHint")}
          </p>
        )}
      </div>

      <aside className="order-last hidden min-w-0 lg:order-none lg:block">
        <AdSlot
          placement="card-detail-chart-side"
          className="min-h-[320px] w-full lg:w-[320px] xl:w-[360px]"
        />
      </aside>
    </div>
  )
}
