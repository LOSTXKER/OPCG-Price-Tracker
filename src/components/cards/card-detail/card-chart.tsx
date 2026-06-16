"use client"

import { useMemo, useState, useSyncExternalStore, type PointerEvent } from "react"
import { Info, MoveHorizontal } from "lucide-react"

import { getLocale, t, type Language } from "@/lib/i18n"
import {
  compactDisplayValue,
  formatDisplayValue,
  jpyToDisplayValue,
  type Currency,
  usdToDisplayValue,
} from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

import { Delta } from "./grade-value"
import { type GradeDatum, type GradeKey, type Stat } from "./grades"
import { mockSeries } from "./mock"

export const RANGES = ["1M", "3M", "1Y", "All"] as const
export type ChartRange = (typeof RANGES)[number]
const SPAN_DAYS: Record<(typeof RANGES)[number], number> = { "1M": 30, "3M": 90, "1Y": 365, All: 730 }

function statToDisplayValue(stat: Stat, currency: Currency) {
  if (stat.usd != null) return usdToDisplayValue(stat.usd, currency)
  if (stat.jpy != null) return jpyToDisplayValue(stat.jpy, currency)
  return null
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

function rangeLabel(range: (typeof RANGES)[number], lang: Language) {
  if (range === "1M") return lang === "EN" ? "1 month" : lang === "JP" ? "1か月" : "1 เดือน"
  if (range === "3M") return lang === "EN" ? "3 months" : lang === "JP" ? "3か月" : "3 เดือน"
  if (range === "1Y") return lang === "EN" ? "1 year" : lang === "JP" ? "1年" : "1 ปี"
  return lang === "EN" ? "all time" : lang === "JP" ? "全期間" : "ทั้งหมด"
}

function relativeDaysLabel(days: number | null | undefined, lang: Language) {
  if (days == null) return "—"
  if (days <= 0) return lang === "EN" ? "today" : lang === "JP" ? "今日" : "วันนี้"
  if (lang === "EN") return `${days}d ago`
  if (lang === "JP") return `${days}日前`
  return `${days} วันที่แล้ว`
}

export function dateAtIndex({
  i,
  len,
  range,
  latestUpdatedAt,
  lang,
}: {
  i: number
  len: number
  range: (typeof RANGES)[number]
  latestUpdatedAt?: string | null
  lang: Language
}) {
  const refTime = latestUpdatedAt ? new Date(latestUpdatedAt).getTime() : null
  if (refTime == null || Number.isNaN(refTime) || len < 2) return ""
  const days = (SPAN_DAYS[range] * (len - 1 - i)) / (len - 1)
  return new Date(refTime - days * 86_400_000).toLocaleDateString(getLocale(lang), {
    day: "numeric",
    month: "short",
  })
}

export type ChartSeries = {
  key: string
  label: string
  points: number[]
  color: string
  /** modeled estimate → rendered as a dashed line (honesty signal). */
  isEst: boolean
}

/** Multi-series price chart. series[0] is the primary (area + bold line); the
 *  rest overlay as compare lines. Estimate series render dashed. Pointer scrub
 *  drives a shared crosshair + a multi-row tooltip (one value per series). */
export function ScrubChart({
  series,
  activeIndex,
  onScrub,
  onScrubEnd,
  lang,
  latestUpdatedAt,
  range,
}: {
  series: ChartSeries[]
  activeIndex: number | null
  onScrub: (index: number) => void
  onScrubEnd: () => void
  lang: Language
  latestUpdatedAt?: string | null
  range: (typeof RANGES)[number]
}) {
  const currency = useUIStore((s) => s.currency)
  const drawn = series.filter((s) => s.points.length >= 2)
  const primary = drawn[0]
  if (!primary) {
    return (
      <div className="flex h-[210px] items-center justify-center rounded-xl bg-muted/10 text-meta sm:h-[280px] lg:h-[320px]">
        {t(lang, "noPriceHistory")}
      </div>
    )
  }

  const width = 1000
  const height = 320
  const padTop = 16
  const padRight = 84
  const padBottom = 28
  const padLeft = 12
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom
  const len = primary.points.length
  const allPoints = drawn.flatMap((s) => s.points)
  const min = Math.min(...allPoints)
  const max = Math.max(...allPoints)
  const span = Math.max(1, max - min)
  const yMin = min - span * 0.08
  const yMax = max + span * 0.08

  const x = (i: number) => padLeft + (plotW * i) / (len - 1)
  const y = (v: number) => padTop + ((yMax - v) / Math.max(1, yMax - yMin)) * plotH
  const pathOf = (pts: number[]) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(p).toFixed(2)}`).join(" ")
  const gridVals = [0, 0.5, 1].map((n) => yMax - (yMax - yMin) * n)
  const active = activeIndex != null ? Math.min(len - 1, Math.max(0, activeIndex)) : len - 1
  const latestIndex = len - 1
  const primaryLine = pathOf(primary.points)
  const primaryArea = `${primaryLine} L${x(latestIndex).toFixed(2)} ${height - padBottom} L${padLeft} ${height - padBottom} Z`

  const scrubAt = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    onScrub(Math.round(ratio * (len - 1)))
  }

  const ttW = 188
  const ttH = 24 + drawn.length * 19
  const ttX = Math.min(width - ttW - 16, Math.max(16, x(active) - ttW / 2))
  const ttY = Math.max(16, y(primary.points[active]) - ttH - 14)

  return (
    <svg
      role="img"
      aria-label={t(lang, "priceHistory")}
      viewBox={`0 0 ${width} ${height}`}
      className="block h-[210px] w-full touch-pan-y select-none sm:h-[280px] lg:h-[320px]"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        scrubAt(event)
      }}
      onPointerMove={(event) => {
        if (event.buttons === 1 || activeIndex != null) scrubAt(event)
      }}
      onPointerUp={onScrubEnd}
      onPointerCancel={onScrubEnd}
      onPointerLeave={onScrubEnd}
    >
      <defs>
        <linearGradient id="card-price-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={primary.color} stopOpacity="0.28" />
          <stop offset="62%" stopColor={primary.color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={primary.color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridVals.map((v) => {
        const gy = y(v)
        return (
          <g key={v}>
            <line x1={padLeft} x2={width - padRight} y1={gy} y2={gy} stroke="var(--border)" strokeDasharray="2 7" strokeOpacity="0.18" />
            <text x={width - padRight + 10} y={gy + 4} fill="var(--muted-foreground)" opacity="0.5" fontSize="20">
              {compactDisplayValue(v, currency)}
            </text>
          </g>
        )
      })}
      <path d={primaryArea} fill="url(#card-price-area)" />
      {/* compare lines under, primary on top */}
      {drawn.slice(1).map((s) => (
        <path
          key={s.key}
          d={pathOf(s.points)}
          fill="none"
          stroke={s.color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={s.isEst ? "6 5" : undefined}
          opacity="0.9"
        />
      ))}
      <path
        d={primaryLine}
        fill="none"
        stroke={primary.color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={primary.isEst ? "7 5" : undefined}
      />
      <line
        x1={x(active)}
        x2={x(active)}
        y1={padTop}
        y2={height - padBottom}
        stroke="var(--muted-foreground)"
        strokeDasharray="3 5"
        strokeOpacity={activeIndex == null ? "0" : "0.42"}
      />
      {drawn.map((s) => (
        <circle
          key={s.key}
          cx={x(latestIndex)}
          cy={y(s.points[latestIndex])}
          r={s.key === primary.key ? 5 : 3.5}
          fill={s.color}
          stroke="var(--background)"
          strokeWidth={s.key === primary.key ? 3 : 2}
        />
      ))}
      <g transform={`translate(${width - padRight - 84} ${Math.min(height - padBottom - 28, Math.max(padTop + 2, y(primary.points[latestIndex]) - 14))})`} aria-hidden>
        <rect width="78" height="28" rx="8" fill={primary.color} opacity="0.95" />
        <text x="39" y="18" textAnchor="middle" fill="var(--primary-foreground)" fontSize="16" fontWeight="800">
          {compactDisplayValue(primary.points[latestIndex], currency)}
        </text>
      </g>
      {activeIndex != null && (
        <>
          {drawn.map((s) => (
            <circle key={s.key} cx={x(active)} cy={y(s.points[active])} r="5" fill={s.color} stroke="var(--background)" strokeWidth="2.5" />
          ))}
          <g transform={`translate(${ttX} ${ttY})`}>
            <rect width={ttW} height={ttH} rx="10" fill="var(--p-s2)" stroke="var(--p-hair)" />
            <text x="12" y="17" fill="var(--muted-foreground)" fontSize="15">
              {dateAtIndex({ i: active, len, range, latestUpdatedAt, lang })}
            </text>
            {drawn.map((s, idx) => (
              <g key={s.key} transform={`translate(12 ${32 + idx * 19})`}>
                <circle cx="4" cy="-4" r="4" fill={s.color} />
                <text x="15" y="0" fill="var(--muted-foreground)" fontSize="14">{s.label}</text>
                <text x={ttW - 24} y="0" textAnchor="end" fill="var(--foreground)" fontSize="15" fontWeight="700">
                  {formatDisplayValue(s.points[active], currency)}
                </text>
              </g>
            ))}
          </g>
        </>
      )}
    </svg>
  )
}

export type ReferencePrice = {
  value: Stat
  sourceLabel: string | null
  kindLabel: string
  conditionLabel: string
  editionLabel: string
  deltaPct: number | null
  help: string
  hasData: boolean
}

function legacyReferencePrice(
  gradeData: Record<GradeKey, GradeDatum> | undefined,
  selectedGrade: GradeKey | undefined,
  lang: Language,
): ReferencePrice {
  const datum = selectedGrade ? gradeData?.[selectedGrade] : null
  if (!datum) {
    return {
      value: { jpy: null, usd: null, isEst: false },
      sourceLabel: null,
      kindLabel: t(lang, "askListPrice"),
      conditionLabel: t(lang, "rawCondition"),
      editionLabel: t(lang, "jpEdition"),
      deltaPct: null,
      help: t(lang, "noEditionPriceDesc"),
      hasData: false,
    }
  }

  return {
    value: datum.value,
    sourceLabel: datum.lastSaleSource ?? (datum.tier.family === "raw" ? "Yuyu-tei" : "SNKRDUNK"),
    kindLabel: t(lang, "askListPrice"),
    conditionLabel: datum.tier.label,
    editionLabel: t(lang, "jpEdition"),
    deltaPct: datum.delta30d?.pct ?? null,
    help: datum.tier.family === "raw" ? t(lang, "marketPriceHelp") : t(lang, "gradedMarketPriceHelp"),
    hasData: datum.hasData,
  }
}

/** Price instrument — one reference price first, then a quiet chart. */
export function CardChart({
  referencePrice: referencePriceProp,
  gradeData,
  selectedGrade,
  latestUpdatedAt,
  daysSinceUpdate,
  lang,
}: {
  referencePrice?: ReferencePrice
  gradeData?: Record<GradeKey, GradeDatum>
  selectedGrade?: GradeKey
  latestUpdatedAt?: string | null
  daysSinceUpdate?: number | null
  lang: Language
}) {
  const currency = useUIStore((s) => s.currency)
  const mounted = useMounted()
  const [range, setRange] = useState<(typeof RANGES)[number]>("1M")
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const referencePrice = referencePriceProp ?? legacyReferencePrice(gradeData, selectedGrade, lang)
  const latest = statToDisplayValue(referencePrice.value, currency)
  const lineUp = (referencePrice.deltaPct ?? 0) >= 0

  const series = useMemo(() => {
    if (!mounted || latest == null || !referencePrice.hasData) return []
    return mockSeries(latest, lineUp, range)
  }, [latest, lineUp, mounted, range, referencePrice.hasData])

  const activeValue = activeIndex != null && series[activeIndex] != null ? series[activeIndex] : latest
  const open = series[0] ?? null
  const shownDelta =
    activeIndex != null && open != null && activeValue != null
      ? ((activeValue - open) / open) * 100
      : referencePrice.deltaPct
  const shownDate =
    activeIndex != null
      ? dateAtIndex({ i: activeIndex, len: series.length, range, latestUpdatedAt, lang })
      : t(lang, "referencePrice")

  return (
    <section className="surface-1 overflow-hidden rounded-2xl ring-1 ring-[var(--p-hair)] lg:rounded-[1.5rem]">
      <div className="space-y-2.5 p-4 sm:space-y-3 sm:p-5 lg:p-6">
        <div>
          <p className="text-eyebrow">{shownDate}</p>
          <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="tnum text-display text-foreground">
              {activeValue == null ? "—" : formatDisplayValue(activeValue, currency)}
            </span>
            {shownDelta != null && (
              <span className="flex items-center pb-1">
                <Delta pct={shownDelta} lang={lang} size="lg" />
                <span className="ml-1.5 text-meta text-foreground/60">
                  {activeIndex != null ? t(lang, "fromRangeOpen") : rangeLabel(range, lang)}
                </span>
              </span>
            )}
          </div>
          <p className="text-meta mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{referencePrice.sourceLabel ?? t(lang, "noEditionPrice")}</span>
            <span className="text-muted-foreground/45">·</span>
            <span>{referencePrice.kindLabel}</span>
            <span className="text-muted-foreground/45">·</span>
            <span>{referencePrice.editionLabel} · {referencePrice.conditionLabel}</span>
            <span className="text-muted-foreground/45">·</span>
            <span>{relativeDaysLabel(daysSinceUpdate, lang)}</span>
            <span
              title={referencePrice.help}
              aria-label={referencePrice.help}
              className="inline-flex cursor-help text-muted-foreground/70"
            >
              <Info className="size-3.5" aria-hidden />
            </span>
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 lg:px-6">
        <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-eyebrow">{t(lang, "priceHistory")} · {referencePrice.conditionLabel}</p>
          <div className="inline-flex shrink-0 gap-0.5 rounded-full bg-foreground/[0.045] p-0.5 ring-1 ring-[var(--p-hair)]">
            {RANGES.map((rg) => (
              <button
                key={rg}
                type="button"
                aria-pressed={rg === range}
                onClick={() => {
                  setActiveIndex(null)
                  setRange(rg)
                }}
                className={cn(
                  "ease-chrome rounded-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  rg === range ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {rg}
              </button>
            ))}
          </div>
        </div>

        {!referencePrice.hasData ? (
          <div className="flex h-[210px] items-center justify-center rounded-xl bg-foreground/[0.025] p-5 text-center sm:h-[280px] lg:h-[320px]">
            <div>
              <p className="text-sm font-semibold text-foreground">{t(lang, "noEditionPrice")}</p>
              <p className="text-meta mt-1 max-w-sm">{t(lang, "noEditionPriceDesc")}</p>
            </div>
          </div>
        ) : mounted ? (
          <>
            <ScrubChart
              series={[{ key: "primary", label: referencePrice.conditionLabel, points: series, color: lineUp ? "var(--price-up)" : "var(--price-down)", isEst: false }]}
              activeIndex={activeIndex}
              onScrub={setActiveIndex}
              onScrubEnd={() => setActiveIndex(null)}
              lang={lang}
              latestUpdatedAt={latestUpdatedAt}
              range={range}
            />
            <p className="text-meta mt-2 hidden items-center justify-center gap-1.5 sm:flex">
              <MoveHorizontal className="size-3.5" aria-hidden /> {t(lang, "dragChartHint")}
            </p>
          </>
        ) : (
          <div className="h-[320px] rounded-xl bg-muted/10" aria-hidden />
        )}
      </div>
    </section>
  )
}
