"use client"

import { MoveHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { t, type Currency, type Language } from "@/lib/i18n"
import { formatDisplayValue } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import { PriceRangeControl } from "./price-range-control"

import {
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
  loading: boolean
  error: boolean
  onRetry: () => void
  activeIndex: number | null
  onScrub: (index: number | null) => void
  activeValue: number | null
  shownDate: string | null
  windowLabel: string
}


/** Selected-grade chart, range controls, and live announcement. */
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
  loading,
  error,
  onRetry,
  activeIndex,
  onScrub,
  activeValue,
  shownDate,
  windowLabel,
}: CardDetailChartSectionProps) {
  const chartHeights = "h-[210px] sm:h-[280px] lg:h-[320px]"

  return (
    <section
      id="sources"
      aria-labelledby="price-history-chart-heading"
      className="mt-6 scroll-mt-[calc(var(--chrome-h)_+_4.25rem)]"
    >
      <div className="min-w-0">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="price-history-chart-heading" className="text-eyebrow">
            {t(lang, "priceHistory")} · {gradeLabel}
          </h2>
          <PriceRangeControl lang={lang} range={range} onRangeChange={onRangeChange} />
        </div>

        {loading ? (
          <Skeleton className={cn("rounded-xl", chartHeights)} />
        ) : error ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl bg-foreground/[0.025] p-5 text-center",
              chartHeights,
            )}
          >
            <p className="text-h5 text-foreground">{t(lang, "loadFailed")}</p>
            <p className="text-meta mt-1">{t(lang, "loadCardsFailedDesc")}</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              {t(lang, "retry")}
            </Button>
          </div>
        ) : !datum.hasData && series.length === 0 ? (
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

        {(series[0]?.points.length ?? 0) >= 2 && hydrated && (
          <p className="text-meta mt-2 flex items-center justify-center gap-1.5 sm:hidden">
            <MoveHorizontal className="size-3.5" aria-hidden />
            {t(lang, "dragChartHint")}
          </p>
        )}
      </div>

    </section>
  )
}
