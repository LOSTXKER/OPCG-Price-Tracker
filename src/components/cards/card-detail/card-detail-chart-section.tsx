"use client"

import { MoveHorizontal } from "lucide-react"

import { AdSlot } from "@/components/ads/ad-slot"
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
import {
  SEGMENT_ACTIVE,
  SEGMENT_BTN,
  SEGMENT_IDLE,
  SEGMENT_TRACK,
} from "./market-feed-shared"

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
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label={t(lang, "priceHistory")}
              className={SEGMENT_TRACK}
            >
              {RANGES.map((rangeOption) => (
                <button
                  key={rangeOption}
                  type="button"
                  aria-pressed={rangeOption === range}
                  onClick={() => onRangeChange(rangeOption)}
                  className={cn(
                    SEGMENT_BTN,
                    "tnum min-h-11 min-w-11 sm:min-h-0 sm:min-w-0",
                    rangeOption === range ? SEGMENT_ACTIVE : SEGMENT_IDLE,
                  )}
                >
                  {rangeOption}
                </button>
              ))}
            </div>
          </div>
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
