"use client"

import { type PointerEvent } from "react"

import { getLocale, t, type Language } from "@/lib/i18n"
import { compactDisplayValue, formatDisplayValue } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

export const RANGES = ["1M", "3M", "1Y", "All"] as const
export type ChartRange = (typeof RANGES)[number]
const SPAN_DAYS: Record<(typeof RANGES)[number], number> = { "1M": 30, "3M": 90, "1Y": 365, All: 730 }

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
/** Rebase a price series so the first point = 100, so series of very different
 *  magnitudes (e.g. Raw ฿9K vs PSA10 ฿42K) compare on one % axis. Pure (tested). */
export function rebaseToIndex(points: number[]): number[] {
  const base = points[0]
  return base && base !== 0 ? points.map((p) => (p / base) * 100) : points
}

export function ScrubChart({
  series,
  activeIndex,
  onScrub,
  onScrubEnd,
  lang,
  latestUpdatedAt,
  range,
  indexed,
}: {
  series: ChartSeries[]
  activeIndex: number | null
  onScrub: (index: number) => void
  onScrubEnd: () => void
  lang: Language
  latestUpdatedAt?: string | null
  range: (typeof RANGES)[number]
  /** Index every series to 100 at window start (% axis) — for cross-magnitude compare. */
  indexed?: boolean
}) {
  const currency = useUIStore((s) => s.currency)
  const rawDrawn = series.filter((s) => s.points.length >= 2)
  const drawn = indexed ? rawDrawn.map((s) => ({ ...s, points: rebaseToIndex(s.points) })) : rawDrawn
  const fmtIndex = (v: number) => `${v >= 100 ? "+" : "−"}${Math.abs(v - 100).toFixed(0)}%`
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
  const gridVals = [0, 0.33, 0.66, 1].map((n) => yMax - (yMax - yMin) * n)
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
            <text x={width - padRight + 10} y={gy + 4} fill="var(--muted-foreground)" opacity="0.7" fontSize="20">
              {indexed ? fmtIndex(v) : compactDisplayValue(v, currency)}
            </text>
          </g>
        )
      })}
      {/* dated x-ticks — a real time reference frame under the plot */}
      {[0, 1 / 3, 2 / 3, 1].map((f, idx) => {
        const i = Math.round(f * (len - 1))
        const label = dateAtIndex({ i, len, range, latestUpdatedAt, lang })
        if (!label) return null
        return (
          <text
            key={`xtick-${idx}`}
            x={padLeft + plotW * f}
            y={height - padBottom + 20}
            textAnchor={idx === 0 ? "start" : f === 1 ? "end" : "middle"}
            fill="var(--muted-foreground)"
            opacity="0.7"
            fontSize="18"
          >
            {label}
          </text>
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
                  {indexed ? fmtIndex(s.points[active]) : formatDisplayValue(s.points[active], currency)}
                </text>
              </g>
            ))}
          </g>
        </>
      )}
    </svg>
  )
}
