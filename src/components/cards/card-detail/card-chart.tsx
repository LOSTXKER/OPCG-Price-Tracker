"use client"

import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react"

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
const DAY_MS = 86_400_000
// Long ranges (1Y/All) span more than one calendar year, so a bare "5 เม.ย." is
// ambiguous — add a 2-digit year there. Short ranges keep day+month.
const isLongRange = (range: ChartRange) => range === "1Y" || range === "All"

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
  return new Date(refTime - days * DAY_MS).toLocaleDateString(
    getLocale(lang),
    isLongRange(range) ? { day: "numeric", month: "short", year: "2-digit" } : { day: "numeric", month: "short" },
  )
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

/** Axis-tick date label — drops the day and adds a 2-digit year on long ranges
 *  (where day+month is ambiguous across years); day+month on short ranges. */
function fmtAxisDate(ms: number, range: ChartRange, lang: Language): string {
  return new Date(ms).toLocaleDateString(
    getLocale(lang),
    isLongRange(range) ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" },
  )
}

/** Calendar-snapped x-axis ticks — evenly spaced, anchored to round dates
 *  (day / week / 1st-of-month / quarter) per range, thinned by an even stride to
 *  fit the real plot width, with the latest point ("today") pinned at the right
 *  edge without colliding into the last calendar label. Returns left→right
 *  {frac (0..1 across the window), label}. Pure & SSR-safe (derives from refMs). */
export function xAxisTicks(
  refMs: number,
  range: ChartRange,
  lang: Language,
  plotW: number,
): { frac: number; label: string }[] {
  const spanMs = SPAN_DAYS[range] * DAY_MS
  const startMs = refMs - spanMs
  const anchors: number[] = []
  const pushMonthly = (stepMonths: number, quarter = false) => {
    const d = new Date(startMs)
    d.setHours(0, 0, 0, 0)
    d.setDate(1)
    while (d.getTime() < startMs || (quarter && d.getMonth() % 3 !== 0)) d.setMonth(d.getMonth() + 1)
    for (; d.getTime() <= refMs; d.setMonth(d.getMonth() + stepMonths)) anchors.push(d.getTime())
  }
  if (range === "7D") {
    const d = new Date(startMs)
    d.setHours(0, 0, 0, 0)
    for (let tms = d.getTime(); tms <= refMs; tms += DAY_MS) anchors.push(tms)
  } else if (range === "1M") {
    for (let tms = refMs; tms >= startMs; tms -= 7 * DAY_MS) anchors.push(tms)
    anchors.reverse()
  } else if (range === "3M") {
    pushMonthly(1)
  } else if (range === "1Y") {
    pushMonthly(2)
  } else {
    pushMonthly(3, true)
  }
  // → evenly-spaced {frac,label}, left→right, clamped to the window
  let ticks = anchors
    .map((ms) => ({ frac: (ms - startMs) / spanMs, label: fmtAxisDate(ms, range, lang) }))
    .filter((t) => t.frac >= -1e-9 && t.frac <= 1 + 1e-9)
    .map((t) => ({ frac: Math.min(1, Math.max(0, t.frac)), label: t.label }))

  // Thin to fit the plot (≈1 label / 92px) by an EVEN integer stride — uniform gaps.
  // (Distributing N→cap with Math.round drops an interior tick unevenly, which read
  // as a double-gap on 1M: 8·15·29·5 instead of 8·22·5.) Always keeps the first tick.
  const maxTicks = Math.max(3, Math.min(8, Math.floor(plotW / 92)))
  if (ticks.length > maxTicks) {
    const stride = Math.ceil((ticks.length - 1) / (maxTicks - 1))
    ticks = ticks.filter((_, i) => i % stride === 0)
  }

  // "Today" is the right edge (frac 1). Append it — but if the last calendar tick
  // already hugs the edge (closer than ~one label width), REPLACE it so the two
  // labels never overlap (the 1-Apr / 5-Apr collision seen on 3M).
  const minGap = Math.min(0.5, 80 / Math.max(1, plotW))
  const today = { frac: 1, label: fmtAxisDate(refMs, range, lang) }
  const last = ticks[ticks.length - 1]
  if (last && 1 - last.frac < minGap) ticks[ticks.length - 1] = today
  else ticks.push(today)

  return ticks
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
  // Fluid size — render at REAL pixels (1 unit = 1px) instead of a fixed 1000×320 viewBox
  // CSS-stretched to fit (which forced oversized fonts + two hard-coded x-tick groups).
  // Measured via ResizeObserver; the default covers first paint / SSR. Hooks stay above the
  // early returns below so call order is stable.
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 720, h: 280 })
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (r && r.width > 0 && r.height > 0) setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Keep series with >=1 point: an empty series → "no history"; a single real point →
  // an honest single-dot state (below), not the same as "no data" (low-volume cards
  // genuinely have one price). >=2 is required only for an actual line.
  const rawDrawn = series.filter((s) => s.points.length >= 1)
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
  // Single real observation — a distinct, honest state (one dot + value), NOT the empty
  // message. Returns early so the line math below (which divides by len-1) never sees len<2.
  if (primary.points.length < 2) {
    return (
      <div className="flex h-[210px] flex-col items-center justify-center gap-2 rounded-xl bg-foreground/[0.025] sm:h-[280px] lg:h-[320px]">
        <span className="size-2.5 rounded-full" style={{ background: primary.color }} />
        <span className="tnum text-lg font-bold text-foreground">{compactDisplayValue(primary.points[0], currency)}</span>
        <span className="text-meta">{t(lang, "singlePricePoint")}</span>
      </div>
    )
  }

  const width = size.w
  const height = size.h
  const padTop = 14
  const padBottom = 30
  const plotH = height - padTop - padBottom
  // Real-px font sizes now (1 unit = 1px). Role hierarchy: live-price TAG loudest, y-axis,
  // x-axis smallest. One x-tick group (density = f(width)) replaces the old mobile/desktop split.
  const TAG_FONT = 13
  const Y_AXIS_FONT = 12
  const X_AXIS_FONT = 12
  const TOOLTIP_FONT = 13
  const TOOLTIP_LABEL_FONT = 12
  const len = primary.points.length
  const allPoints = drawn.flatMap((s) => s.points)
  const min = Math.min(...allPoints)
  const max = Math.max(...allPoints)
  const span = Math.max(1, max - min)
  const yMin = min - span * 0.08
  const yMax = max + span * 0.08

  // Y-axis ticks computed FIRST so the RIGHT gutter (padRight) can be sized to the widest
  // label + the last-price pill. Axis + live value sit on the RIGHT (Google/CoinGecko/CMC
  // convention: the newest point lands at the right edge, where the eye reads "now").
  const gridVals = niceTicks(min, max, 5).filter((v) => v >= yMin && v <= yMax)
  const yLabels = gridVals.map((v) => (indexed ? fmtIndex(v) : compactDisplayValue(v, currency)))
  const lastLabel = indexed ? "" : compactDisplayValue(primary.points[len - 1], currency)
  // <text> advance ≈ chars × fontSize × ~0.62. RIGHT gutter fits the widest y-label AND the
  // last-price pill so a high-value card (฿489K) never clips. LEFT gutter is slim (no labels).
  const tagW = Math.ceil(Math.max(1, lastLabel.length) * TAG_FONT * 0.62) + 12
  const maxYChars = Math.max(4, ...yLabels.map((s) => s.length))
  const padRight = Math.max(46, Math.ceil(maxYChars * Y_AXIS_FONT * 0.62) + 12, tagW + 10)
  const padLeft = 14
  const plotW = width - padLeft - padRight

  const x = (i: number) => padLeft + (plotW * i) / (len - 1)
  const y = (v: number) => padTop + ((yMax - v) / Math.max(1, yMax - yMin)) * plotH
  const pathOf = (pts: number[]) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(p).toFixed(2)}`).join(" ")
  const active = activeIndex != null ? Math.min(len - 1, Math.max(0, activeIndex)) : len - 1
  const latestIndex = len - 1
  const bottomY = height - padBottom
  // Scrub focus (Google Finance): split the line + area at the cursor — BRIGHT up to the
  // hovered point, DIMMED after it — so the eye focuses on "start → here". Honest: it only
  // de-emphasises real points already drawn (no fabricated future). At rest splitIdx = last
  // ⇒ the whole line is the bright segment and nothing is dimmed.
  const splitIdx = activeIndex != null ? active : latestIndex
  const hasDim = activeIndex != null && splitIdx < latestIndex
  const pathRange = (a: number, b: number) =>
    primary.points.slice(a, b + 1).map((p, k) => `${k === 0 ? "M" : "L"}${x(a + k).toFixed(2)} ${y(p).toFixed(2)}`).join(" ")
  const areaRange = (a: number, b: number) => `${pathRange(a, b)} L${x(b).toFixed(2)} ${bottomY} L${x(a).toFixed(2)} ${bottomY} Z`

  // Last-price pill geometry — hoisted so the y-axis can suppress the gridline label it
  // would collide with. Clamped to the plot so the pill never escapes top/bottom.
  const lastVal = primary.points[latestIndex]
  const open = primary.points[0]
  const tagY = Math.min(height - padBottom - 10, Math.max(padTop + 10, y(lastVal)))

  // Calendar-snapped date ticks — evenly spaced, sized to the real plot width, with
  // "today" pinned at the right edge (see xAxisTicks). Replaces the old measure→thin split.
  const refMs = latestUpdatedAt ? new Date(latestUpdatedAt).getTime() : null
  const xTicks = refMs != null && !Number.isNaN(refMs) ? xAxisTicks(refMs, range, lang, plotW) : []

  const scrubAt = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width) return
    // Map the cursor into PLOT coordinates (subtract the gutters) — not the full element —
    // so the snapped index/dot lands under the cursor and on the x-axis date. Without this
    // the right axis gutter offsets every hit (worst on 7D, few points).
    const vx = ((event.clientX - rect.left) / rect.width) * width
    const frac = Math.min(1, Math.max(0, (vx - padLeft) / plotW))
    onScrub(Math.round(frac * (len - 1)))
  }

  const ttW = 188
  const ttH = 24 + drawn.length * 19
  const ttX = Math.min(width - ttW - 16, Math.max(16, x(active) - ttW / 2))
  // Place the box ABOVE the point; if it would clip the top, flip it BELOW (Google Finance).
  const ttAbove = y(primary.points[active]) - ttH - 14
  const ttY = ttAbove >= padTop ? ttAbove : Math.min(height - padBottom - ttH, y(primary.points[active]) + 14)

  // Crosshair date-pill on the time axis (Google/CoinGecko): WHEN on the axis, WHAT on the
  // line. Clamped to the plot so it never escapes the gutters.
  const dpLabel = activeIndex != null ? dateAtIndex({ i: active, len, range, latestUpdatedAt, lang }) : ""
  const dpW = Math.ceil(Math.max(6, dpLabel.length) * X_AXIS_FONT * 0.62) + 14
  const dpX = Math.min(width - padRight - dpW / 2, Math.max(padLeft + dpW / 2, x(active)))

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label={
        indexed
          ? `${t(lang, "priceHistory")} · ${t(lang, "chartKeyboardHint")}`
          : `${t(lang, "priceHistory")} — ${compactDisplayValue(open, currency)} → ${compactDisplayValue(lastVal, currency)} · ${t(lang, "low")} ${compactDisplayValue(min, currency)} · ${t(lang, "high")} ${compactDisplayValue(max, currency)} · ${t(lang, "chartKeyboardHint")}`
      }
      tabIndex={0}
      viewBox={`0 0 ${width} ${height}`}
      className="block h-[210px] w-full touch-pan-y select-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-[280px] lg:h-[320px]"
      onPointerDown={(event) => {
        // A mouse/pen click must NOT focus the SVG — Chromium matches :focus-visible on a
        // tabindex'd SVG even for a plain click, so the blue focus ring painted on every
        // chart click. Suppressing the default focus-on-click for mouse/pen kills that ring
        // while keyboard Tab still focuses (ring kept for a11y). Touch is left alone so a
        // vertical swipe can still scroll the page (touch-pan-y).
        if (event.pointerType !== "touch") event.preventDefault()
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
      // Keyboard scrub (a11y) — reuses the SAME activeIndex the pointer drives. Focus shows
      // the crosshair at the latest point; arrows step, Home/End jump, Esc/blur clears.
      onFocus={() => onScrub(latestIndex)}
      onBlur={onScrubEnd}
      onKeyDown={(event: KeyboardEvent<SVGSVGElement>) => {
        const cur = activeIndex ?? latestIndex
        if (event.key === "ArrowRight") { event.preventDefault(); onScrub(Math.min(len - 1, cur + 1)) }
        else if (event.key === "ArrowLeft") { event.preventDefault(); onScrub(Math.max(0, cur - 1)) }
        else if (event.key === "Home") { event.preventDefault(); onScrub(0) }
        else if (event.key === "End") { event.preventDefault(); onScrub(len - 1) }
        else if (event.key === "Escape") onScrubEnd()
      }}
    >
      <defs>
        <linearGradient id="card-price-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={primary.color} stopOpacity="0.28" />
          <stop offset="62%" stopColor={primary.color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={primary.color} stopOpacity="0" />
        </linearGradient>
        {/* tooltip elevation — drop shadow so the box reads clearly over the dark plot.
            Hover-only (not page-scroll), so the filter's cost never hits scroll perf. */}
        <filter id="tt-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>
      {/* dated x-ticks (labels) — calendar-snapped, density = f(real width), single group. */}
      {xTicks.map((tk, idx) => (
        <text
          key={`xt-${idx}`}
          x={padLeft + plotW * tk.frac}
          y={height - padBottom + 16}
          textAnchor={idx === 0 ? "start" : idx === xTicks.length - 1 ? "end" : "middle"}
          fill="var(--muted-foreground)"
          fontSize={X_AXIS_FONT}
        >
          {tk.label}
        </text>
      ))}
      {/* area — BRIGHT up to the cursor, DIMMED after it (scrub focus). At rest = full bright. */}
      <path d={areaRange(0, splitIdx)} fill="url(#card-price-area)" />
      {hasDim && <path d={areaRange(splitIdx, latestIndex)} fill="url(#card-price-area)" opacity="0.25" />}
      {/* faint dotted VERTICAL gridlines at the date ticks (graph-paper texture, both dark
          refs) — over the area fill, under the data line. Horizontals are dotted below too. */}
      {xTicks.map((tk, idx) => {
        const tx = padLeft + plotW * tk.frac
        return <line key={`vg-${idx}`} x1={tx} x2={tx} y1={padTop} y2={height - padBottom} stroke="var(--muted-foreground)" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="1 5" />
      })}
      {/* round-tick gridlines — drawn OVER the area fill (so the fill never dims them)
          but UNDER the data lines; muted-foreground at low alpha is traceable edge-to-
          edge in both themes (--border carries its own 0.12 alpha, too faint to scale). */}
      {gridVals.map((v, idx) => {
        const gy = y(v)
        // Hide the y-label when it would (a) collide with the last-price pill (the pill owns
        // that gutter slot, CMC/Robinhood-style), or (b) round to the SAME text as the tick
        // above it — which happens on a near-flat series and would print "200฿ / 200฿".
        const hideLabel = (!indexed && Math.abs(gy - tagY) < 20) || (idx > 0 && yLabels[idx] === yLabels[idx - 1])
        return (
          <g key={v}>
            <line x1={padLeft} x2={width - padRight} y1={gy} y2={gy} stroke="var(--muted-foreground)" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="1 5" />
            {!hideLabel && (
              <text x={width - padRight + 8} y={gy + 4} textAnchor="start" fill="var(--muted-foreground)" fontSize={Y_AXIS_FONT}>
                {yLabels[idx]}
              </text>
            )}
          </g>
        )
      })}
      {/* window-open baseline — a faint dashed reference at the period's first price, so the
          green/up vs red/down colour has something to be "up/down FROM" (Robinhood/Google). */}
      <line
        x1={padLeft}
        x2={width - padRight}
        y1={y(open)}
        y2={y(open)}
        stroke="var(--muted-foreground)"
        strokeOpacity="0.3"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
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
        d={pathRange(0, splitIdx)}
        fill="none"
        stroke={primary.color}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={primary.isEst ? "7 5" : undefined}
      />
      {/* dimmed segment after the cursor — Google scrub focus */}
      {hasDim && (
        <path
          d={pathRange(splitIdx, latestIndex)}
          fill="none"
          stroke={primary.color}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={primary.isEst ? "7 5" : undefined}
          opacity="0.3"
        />
      )}
      {/* crosshair — a solid hairline that FADES in (ease-chrome, reduced-motion-safe),
          not an instantly-toggled dashed wireframe. */}
      <line
        className="ease-chrome"
        x1={x(active)}
        x2={x(active)}
        y1={padTop}
        y2={height - padBottom}
        stroke="var(--muted-foreground)"
        strokeWidth="1"
        strokeDasharray="4 6"
        strokeOpacity={activeIndex == null ? "0" : "0.45"}
      />
      {/* resting end-dots — hidden while scrubbing so there's exactly ONE focal point */}
      {activeIndex == null &&
        drawn.map((s) => (
          <circle
            key={s.key}
            cx={x(latestIndex)}
            cy={y(s.points[latestIndex])}
            r={s.key === primary.key ? 4 : 3}
            fill={s.color}
            stroke="var(--background)"
            strokeWidth={s.key === primary.key ? 2 : 1.5}
          />
        ))}
      {/* last-price tag — pins the current value to the axis at the latest point so
          it reads at rest (Google Finance / Robinhood). Solo ฿ only: in indexed mode
          the primary rebases to 100 → "+0%", which is meaningless. */}
      {!indexed && (
        // RIGHT gutter — a compact solid pill of the live price (CoinGecko/CMC). No arrow
        // (the hero's ▲/▼% already carries direction) → cleaner. Small gap from the end-dot.
        <g transform={`translate(${width - padRight + 7} ${tagY})`}>
          <rect x="0" y="-9" width={tagW} height="18" rx="6" fill={primary.color} opacity={primary.isEst ? 0.85 : 1} />
          <text x={tagW / 2} y="4" textAnchor="middle" fill="var(--background)" fontSize={TAG_FONT} fontWeight="700">
            {compactDisplayValue(lastVal, currency)}
          </text>
        </g>
      )}
      {activeIndex != null && (
        <>
          {drawn.map((s) => (
            <circle key={s.key} cx={x(active)} cy={y(s.points[active])} r="5" fill={s.color} stroke="var(--background)" strokeWidth="2.5" />
          ))}
          {/* date-pill pinned to the time axis at the crosshair */}
          <g transform={`translate(${dpX} ${height - padBottom})`}>
            <rect x={-dpW / 2} y="3" width={dpW} height="18" rx="5" fill="var(--popover)" stroke="var(--p-hair)" filter="url(#tt-shadow)" />
            <text x="0" y="16" textAnchor="middle" fill="var(--popover-foreground)" fontSize={X_AXIS_FONT}>{dpLabel}</text>
          </g>
          <g transform={`translate(${ttX} ${ttY})`}>
            <rect width={ttW} height={ttH} rx="10" fill="var(--popover)" stroke="var(--p-hair)" filter="url(#tt-shadow)" />
            <text x="12" y="17" fill="var(--muted-foreground)" fontSize={TOOLTIP_FONT}>
              {dateAtIndex({ i: active, len, range, latestUpdatedAt, lang })}
            </text>
            {drawn.map((s, idx) => (
              <g key={s.key} transform={`translate(12 ${32 + idx * 19})`}>
                <circle cx="4" cy="-4" r="4" fill={s.color} />
                <text x="15" y="0" fill="var(--muted-foreground)" fontSize={TOOLTIP_LABEL_FONT}>{s.label}</text>
                <text x={ttW - 24} y="0" textAnchor="end" fill="var(--popover-foreground)" fontSize={TOOLTIP_FONT} fontWeight="700">
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
