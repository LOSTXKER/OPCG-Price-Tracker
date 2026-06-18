"use client"

import { type PointerEvent } from "react"

import { getLocale, t, type Language } from "@/lib/i18n"
import { compactDisplayValue, formatDisplayValue } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

// 1D is intentionally omitted: the scrape pipeline yields ~one price/day/source, so a
// 1D (intraday) line would be fabricated motion with no path to real data. Gated behind
// this flag until an intraday source exists. 7D is the shortest HONEST window (~7 real
// daily points). If 1D is ever enabled, also add an hour-label branch to dateAtIndex.
export const INTRADAY_ENABLED = false
export const RANGES = ["7D", "1M", "3M", "1Y", "All"] as const
export type ChartRange = (typeof RANGES)[number]
const SPAN_DAYS: Record<ChartRange, number> = { "7D": 7, "1M": 30, "3M": 90, "1Y": 365, All: 730 }

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

/** "Nice number" axis ticks — a round step (1/2/5 × 10ⁿ) covering [lo, hi], so the
 *  y-axis reads 50K/100K/150K (฿) or +0/+20/+40% (indexed) instead of arbitrary
 *  fractions of the data range. Unit-agnostic (works on currency OR rebased index
 *  values) and pure → safe for SSR. 2.5 is intentionally excluded: compactDisplayValue
 *  rounds K to integers, so a 2.5K step would mislabel as "3K". Tested. */
export function niceTicks(lo: number, hi: number, count = 5): number[] {
  const span = Math.max(1e-9, hi - lo)
  const raw = span / Math.max(1, count)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
  const start = Math.ceil(lo / step) * step
  const out: number[] = []
  for (let v = start; v <= hi + step * 1e-9; v += step) out.push(Math.round(v / step) * step)
  return out.length ? out : [lo]
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
  const padRight = 18
  const padBottom = 28
  const padLeft = 64
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom
  // Named font sizes (SVG <text> takes user-space units, not the .text-* px tokens) —
  // axis labels + the last-price tag share AXIS_FONT so they read as one scale.
  const AXIS_FONT = 18
  const TOOLTIP_FONT = 15
  const TOOLTIP_LABEL_FONT = 14
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
  // Round ticks from the REAL data domain (min/max) — already in index units when
  // indexed (drawn is rebased above), so % labels fall out round too. Filter to the
  // padded band so a tick never renders off-plot.
  const gridVals = niceTicks(min, max, 5).filter((v) => v >= yMin && v <= yMax)
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
        // Mouse/pen → inspect on plain hover (standard). Touch → only while a finger
        // is down (buttons===1 via setPointerCapture), so a vertical swipe still
        // scrolls the page. The activeIndex fallback keeps old engines (pointerType="") working.
        if (event.pointerType !== "touch" || event.buttons === 1 || activeIndex != null) scrubAt(event)
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
            fontSize={AXIS_FONT}
          >
            {label}
          </text>
        )
      })}
      <path d={primaryArea} fill="url(#card-price-area)" />
      {/* round-tick gridlines — drawn OVER the area fill (so the fill never dims them)
          but UNDER the data lines; muted-foreground at low alpha is traceable edge-to-
          edge in both themes (--border carries its own 0.12 alpha, too faint to scale). */}
      {gridVals.map((v) => {
        const gy = y(v)
        return (
          <g key={v}>
            <line x1={padLeft} x2={width - padRight} y1={gy} y2={gy} stroke="var(--muted-foreground)" strokeOpacity="0.22" strokeWidth="1.25" shapeRendering="crispEdges" />
            <text x={padLeft - 10} y={gy + 4} textAnchor="end" fill="var(--muted-foreground)" opacity="0.8" fontSize={AXIS_FONT}>
              {indexed ? fmtIndex(v) : compactDisplayValue(v, currency)}
            </text>
          </g>
        )
      })}
      {/* compare lines under, primary on top */}
      {drawn.slice(1).map((s) => (
        <path
          key={s.key}
          d={pathOf(s.points)}
          fill="none"
          stroke={s.color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={s.isEst ? "6 5" : undefined}
          opacity="0.9"
        />
      ))}
      {/* primary line — ONE colour by the period's overall direction (price-up/down),
          the trading-chart standard (Robinhood/CMC/Google). Per-segment up/down colouring
          is for candlesticks, not lines — looks off + choppy on a price line. */}
      <path
        d={primaryLine}
        fill="none"
        stroke={primary.color}
        strokeWidth="2.25"
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
      {/* last-price tag — pins the current value to the axis at the latest point so
          it reads at rest (Google Finance / Robinhood). Solo ฿ only: in indexed mode
          the primary rebases to 100 → "+0%", which is meaningless. */}
      {!indexed && (() => {
        const lv = primary.points[latestIndex]
        const tagW = 56
        const tagY = Math.min(height - padBottom - 11, Math.max(padTop + 11, y(lv)))
        // left gutter now (axis moved left) — CMC highlights the current price ON the axis.
        return (
          <g transform={`translate(${padLeft - tagW - 4} ${tagY})`}>
            <rect x="0" y="-11" width={tagW} height="22" rx="6" fill={primary.color} opacity={primary.isEst ? 0.85 : 1} />
            <text x={tagW / 2} y="5" textAnchor="middle" fill="var(--background)" fontSize={AXIS_FONT} fontWeight="700">
              {compactDisplayValue(lv, currency)}
            </text>
          </g>
        )
      })()}
      {activeIndex != null && (
        <>
          {drawn.map((s) => (
            <circle key={s.key} cx={x(active)} cy={y(s.points[active])} r="5" fill={s.color} stroke="var(--background)" strokeWidth="2.5" />
          ))}
          <g transform={`translate(${ttX} ${ttY})`}>
            <rect width={ttW} height={ttH} rx="10" fill="var(--p-s2)" stroke="var(--p-hair)" />
            <text x="12" y="17" fill="var(--muted-foreground)" fontSize={TOOLTIP_FONT}>
              {dateAtIndex({ i: active, len, range, latestUpdatedAt, lang })}
            </text>
            {drawn.map((s, idx) => (
              <g key={s.key} transform={`translate(12 ${32 + idx * 19})`}>
                <circle cx="4" cy="-4" r="4" fill={s.color} />
                <text x="15" y="0" fill="var(--muted-foreground)" fontSize={TOOLTIP_LABEL_FONT}>{s.label}</text>
                <text x={ttW - 24} y="0" textAnchor="end" fill="var(--foreground)" fontSize={TOOLTIP_FONT} fontWeight="700">
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
