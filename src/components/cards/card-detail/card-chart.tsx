"use client"

import { Fragment, useState } from "react"
import { ChevronDown, Layers } from "lucide-react"

import { getLocale, t, type Language } from "@/lib/i18n"
import { jpyToDisplayValue, usdToDisplayValue, formatDisplayValue } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

import { GRADE_TIERS, type GradeDatum, type GradeKey } from "./grades"
import { Delta } from "./grade-value"
import { GradeLogo } from "./grade-logo"
import { MiniAreaChart } from "./mini-chart"
import { mockGradeSeries } from "./mock"

const RANGES = ["1M", "3M", "1Y", "All"] as const
const SPAN_DAYS: Record<string, number> = { "1M": 30, "3M": 90, "1Y": 365, All: 730 }

/** Less-common grades, collapsed behind a "more grades" toggle. */
const SECONDARY_GRADES = new Set<GradeKey>(["raw_b", "raw_c", "bgs_95"])

/** Price chart panel — the visual focal point of the right column. Every visible
 *  grade is overlaid on ONE shared display-currency scale (a ghost ladder); the
 *  selected grade is the bold hero line and drives the page price. The grade
 *  selector lives here (the series axis); the range toggle is the time axis. */
export function CardChart({
  gradeData,
  selectedGrade,
  onSelectGrade,
  latestUpdatedAt,
  lang,
}: {
  gradeData: Record<GradeKey, GradeDatum>
  selectedGrade: GradeKey
  onSelectGrade: (key: GradeKey) => void
  latestUpdatedAt?: string | null
  lang: Language
}) {
  const currency = useUIStore((s) => s.currency)
  const [range, setRange] = useState<(typeof RANGES)[number]>("3M")
  const [showAllGrades, setShowAllGrades] = useState(false)
  const [compare, setCompare] = useState(false)

  const datum = gradeData[selectedGrade]
  const visibleTiers = GRADE_TIERS.filter(
    (gt) => !SECONDARY_GRADES.has(gt.key) || showAllGrades || gt.key === selectedGrade,
  )

  // Every visible has-data grade, valued in the active display currency so the
  // series share one honest scale (graded sits above raw — a real grade ladder).
  const chartGrades = visibleTiers
    .map((gt) => gradeData[gt.key])
    .filter((d) => d.hasData)
    .map((d) => {
      const base =
        d.value.usd != null
          ? usdToDisplayValue(d.value.usd, currency)
          : d.value.jpy != null
            ? jpyToDisplayValue(d.value.jpy, currency)
            : null
      return { key: d.tier.key, short: d.tier.short, base, up: (d.delta30d?.pct ?? 0) >= 0 }
    })
    .filter((g) => g.base != null)

  const seriesMap = mockGradeSeries(chartGrades, range)
  const chartSeries = chartGrades.map((g) => ({
    key: g.key,
    points: seriesMap[g.key] ?? [],
    isHero: g.key === selectedGrade,
    up: g.up,
    label: g.short,
  }))

  const heroPts = seriesMap[selectedGrade] ?? []
  const hi = heroPts.length ? Math.max(...heroPts) : null
  const lo = heroPts.length ? Math.min(...heroPts) : null
  const avg = heroPts.length ? Math.round(heroPts.reduce((a, b) => a + b, 0) / heroPts.length) : null

  // Date for a given series index — same anchor + span math as the x-axis labels.
  const dateAt = (i: number) => {
    const refTime = latestUpdatedAt ? new Date(latestUpdatedAt).getTime() : null
    if (refTime == null || Number.isNaN(refTime) || heroPts.length < 2) return ""
    const span = SPAN_DAYS[range] ?? 90
    const fmt: Intl.DateTimeFormatOptions =
      range === "1M" ? { day: "numeric", month: "short" } : { day: "numeric", month: "short" }
    const days = (span * (heroPts.length - 1 - i)) / (heroPts.length - 1)
    return new Date(refTime - days * 86_400_000).toLocaleDateString(getLocale(lang), fmt)
  }

  return (
    <div className="px-1">
      {/* instrument header — the chart's own headline + time axis */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground">{datum.tier.label}</span>
            {datum.delta30d && (
              <span className="inline-flex items-baseline gap-1">
                <Delta pct={datum.delta30d.pct} lang={lang} size="md" />
                <span className="text-meta">{t(lang, "days30")}</span>
              </span>
            )}
          </div>
        </div>
        <div className="surface-1 hairline inline-flex shrink-0 gap-0.5 rounded-full p-0.5">
          {RANGES.map((rg) => (
            <button
              key={rg}
              type="button"
              aria-pressed={rg === range}
              onClick={() => setRange(rg)}
              className={cn(
                "ease-chrome rounded-full px-3 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                rg === range ? "surface-2 text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {rg}
            </button>
          ))}
        </div>
      </div>

      {/* grade selector — the series axis; chips double as the chart legend */}
      <div className="no-sb mt-3 mb-2 flex min-w-0 items-center gap-2 overflow-x-auto py-0.5" role="group" aria-label={t(lang, "chooseGrade")}>
        {visibleTiers.map((gt, i) => {
          const prev = visibleTiers[i - 1]
          const groupBreak = prev && prev.family === "raw" && gt.family !== "raw"
          const d = gradeData[gt.key]
          const active = gt.key === selectedGrade
          const disabled = !d.hasData && !active
          const isGraded = gt.family !== "raw"
          // graded chips read "[company logo] number"; the logo replaces the
          // family word (PSA/BGS), falling back to the company text until a real
          // logo file lands in /public/grades/.
          const num = isGraded ? gt.short.replace(/^(PSA|BGS|CGC)\s*/i, "") : gt.short
          return (
            <Fragment key={gt.key}>
              {groupBreak && <span aria-hidden className="h-5 w-px shrink-0 bg-[var(--p-hair)]" />}
              <button
                type="button"
                aria-pressed={active}
                aria-label={gt.short}
                disabled={disabled}
                onClick={() => onSelectGrade(gt.key)}
                className={cn(
                  "ease-chrome inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                  active
                    ? "bg-foreground/10 text-foreground ring-1 ring-foreground/15"
                    : "surface-1 hairline text-muted-foreground hover:text-foreground",
                  disabled && "cursor-not-allowed opacity-40",
                )}
              >
                {isGraded && <GradeLogo family={gt.family} />}
                {num}
              </button>
            </Fragment>
          )
        })}

        <button
          type="button"
          aria-expanded={showAllGrades}
          onClick={() => setShowAllGrades((v) => !v)}
          className="ease-chrome flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          {t(lang, "moreGrades")}
          <ChevronDown className={cn("ease-chrome size-3.5 transition-transform", showAllGrades && "rotate-180")} aria-hidden />
        </button>

        <button
          type="button"
          aria-pressed={compare}
          onClick={() => setCompare((v) => !v)}
          className={cn(
            "ease-chrome inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
            compare
              ? "bg-foreground/10 text-foreground ring-1 ring-foreground/15"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Layers className="size-3.5" aria-hidden />
          {t(lang, "compareGrades")}
        </button>
      </div>

      <MiniAreaChart
        series={compare ? chartSeries : chartSeries.filter((s) => s.isHero)}
        height={300}
        currency={currency}
        labelAt={dateAt}
      />
      <div className="hairline-t mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2.5">
        {[
          { l: t(lang, "high"), v: hi },
          { l: t(lang, "avg"), v: avg },
          { l: t(lang, "low"), v: lo },
        ].map((s) => (
          <span key={s.l} className="text-meta inline-flex items-center gap-1">
            {s.l}
            <span className="tnum text-xs text-foreground/70">
              {s.v == null ? "—" : formatDisplayValue(s.v, currency)}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
