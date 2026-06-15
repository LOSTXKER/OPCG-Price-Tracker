"use client"

import { useState } from "react"
import { Layers } from "lucide-react"

import { getLocale, t, type Language } from "@/lib/i18n"
import { jpyToDisplayValue, usdToDisplayValue, formatDisplayValue } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

import { GRADE_TIERS, type GradeDatum, type GradeKey } from "./grades"
import { MiniAreaChart } from "./mini-chart"
import { mockGradeSeries } from "./mock"

const RANGES = ["1M", "3M", "1Y", "All"] as const
const SPAN_DAYS: Record<string, number> = { "1M": 30, "3M": 90, "1Y": 365, All: 730 }

/** Less-common grades kept out of the always-on compare overlay. */
const SECONDARY_GRADES = new Set<GradeKey>(["raw_b", "raw_c", "bgs_95"])

/** Price chart panel — the visual focal point of the right column. The selected
 *  grade (picked via the dropdown above the price) is the bold hero line; the
 *  range toggle is the time axis; "Compare" overlays the other grades as a
 *  ghost ladder on one shared display-currency scale. */
export function CardChart({
  gradeData,
  selectedGrade,
  latestUpdatedAt,
  lang,
}: {
  gradeData: Record<GradeKey, GradeDatum>
  selectedGrade: GradeKey
  latestUpdatedAt?: string | null
  lang: Language
}) {
  const currency = useUIStore((s) => s.currency)
  const [range, setRange] = useState<(typeof RANGES)[number]>("3M")
  const [compare, setCompare] = useState(false)

  // overlay set: primary grades + whatever's selected (no 7-line clutter)
  const visibleTiers = GRADE_TIERS.filter(
    (gt) => !SECONDARY_GRADES.has(gt.key) || gt.key === selectedGrade,
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
      {/* chart controls — grade identity + price live in the dropdown/header above */}
      <div className="flex items-center justify-end gap-3">
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-pressed={compare}
            onClick={() => setCompare((v) => !v)}
            title={t(lang, "compareGrades")}
            className={cn(
              "ease-chrome inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              compare
                ? "bg-foreground/10 text-foreground ring-1 ring-foreground/15"
                : "surface-1 hairline text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{t(lang, "compareGrades")}</span>
          </button>
          <div className="surface-1 hairline inline-flex shrink-0 gap-0.5 rounded-full p-0.5">
            {RANGES.map((rg) => (
              <button
                key={rg}
                type="button"
                aria-pressed={rg === range}
                onClick={() => setRange(rg)}
                className={cn(
                  "ease-chrome rounded-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  rg === range ? "surface-2 text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {rg}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <MiniAreaChart
          series={compare ? chartSeries : chartSeries.filter((s) => s.isHero)}
          height={300}
          currency={currency}
          labelAt={dateAt}
        />
      </div>
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
