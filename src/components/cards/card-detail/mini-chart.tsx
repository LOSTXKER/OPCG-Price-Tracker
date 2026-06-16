"use client"

import { useId } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatDisplayValue, type Currency } from "@/lib/utils/currency"

export interface ChartSeries {
  key: string
  points: number[]
  /** the selected grade — the bold colored hero line. */
  isHero: boolean
  up: boolean
  label: string
}

type ScrubPoint = { index: number; value: number }

/** Clean single-line hover readout (date + hero price) — replaces the boxed
 *  multi-row tooltip; floats near the crosshair like Robinhood/Coinbase. */
function HoverPill({
  active,
  payload,
  label,
  heroKey,
  heroColor,
  labelAt,
  currency,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ dataKey?: string | number; value?: number }>
  label?: number
  heroKey: string
  heroColor: string
  labelAt?: (i: number) => string
  currency: Currency
}) {
  if (!active || !payload?.length) return null
  const entry = payload.find((p) => p.dataKey === heroKey) ?? payload[0]
  if (entry?.value == null) return null
  const date = labelAt && typeof label === "number" ? labelAt(label) : ""
  return (
    <div className="surface-2 hairline rounded-md px-2.5 py-1.5 shadow-[var(--elev-overlay)]">
      {date && <p className="text-meta">{date}</p>}
      <p className="tnum text-sm font-bold" style={{ color: heroColor }}>
        {formatDisplayValue(entry.value as number, currency)}
      </p>
    </div>
  )
}

/**
 * World-class price chart (Robinhood / Coinbase elegance, on Recharts). Resting
 * state = one hero line bleeding edge-to-edge: no visible Y axis (hidden, kept
 * for scale), ≤3 faint hairlines, a dotted period-open baseline, a glowing
 * end-of-line dot + price tag. Hover = a snapped crosshair + a single clean date
 * /price pill. The grade ladder is opt-in (caller passes ghosts only in compare
 * mode). Honey-gold reserved for chrome; hero uses gain/loss color.
 */
export function MiniAreaChart({
  series,
  height = 280,
  currency,
  labelAt,
  onScrub,
}: {
  series: ChartSeries[]
  height?: number
  currency: Currency
  labelAt?: (i: number) => string
  onScrub?: (point: ScrubPoint | null) => void
}) {
  const gid = useId().replace(/:/g, "")
  // SSR-safe reduced-motion read (no state/effect → no cascading render)
  const reduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const hero = series.find((s) => s.isHero) ?? series[0]
  if (!hero || hero.points.length < 2) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        —
      </div>
    )
  }

  const len = hero.points.length
  const open = hero.points[0]
  const last = hero.points[len - 1]
  const heroColor = hero.up ? "var(--price-up)" : "var(--price-down)"
  const ghosts = series.filter((s) => s !== hero && s.points.length >= 2)
  const lineType = len < 20 ? "natural" : "linear"

  const data = Array.from({ length: len }, (_, i) => {
    const row: Record<string, number> = { idx: i }
    for (const s of series) if (s.points[i] != null) row[s.key] = s.points[i]
    return row
  })

  const handleScrub = (state: unknown) => {
    const rawIndex = (state as { activeTooltipIndex?: unknown } | null)?.activeTooltipIndex
    const parsedIndex =
      typeof rawIndex === "number" ? rawIndex : typeof rawIndex === "string" ? Number(rawIndex) : NaN
    const index = Number.isInteger(parsedIndex) && parsedIndex >= 0 ? parsedIndex : null
    if (index == null) {
      onScrub?.(null)
      return
    }
    const value = data[index]?.[hero.key]
    onScrub?.(typeof value === "number" ? { index, value } : null)
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        key={`${hero.key}-${len}`}
        data={data}
        margin={{ top: 16, right: 58, left: 8, bottom: 8 }}
        onMouseMove={handleScrub}
        onMouseLeave={() => onScrub?.(null)}
      >
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={heroColor} stopOpacity={0.28} />
            <stop offset="60%" stopColor={heroColor} stopOpacity={0.08} />
            <stop offset="100%" stopColor={heroColor} stopOpacity={0} />
          </linearGradient>
          <filter id={`glow${gid}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="2 4" className="stroke-border/25" />
        <XAxis
          dataKey="idx"
          type="number"
          domain={[0, len - 1]}
          tickFormatter={(i) => labelAt?.(Number(i)) ?? ""}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
          minTickGap={80}
          dy={6}
        />
        <YAxis
          orientation="right"
          hide
          domain={[(min: number) => Math.floor(min * 0.94), (max: number) => Math.ceil(max * 1.06)]}
        />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3", strokeWidth: 1, opacity: 0.45 }}
          content={<HoverPill heroKey={hero.key} heroColor={heroColor} labelAt={labelAt} currency={currency} />}
        />
        {/* period-open anchor — the one horizontal reference */}
        <ReferenceLine y={open} stroke="var(--muted-foreground)" strokeDasharray="2 4" strokeOpacity={0.3} ifOverflow="extendDomain" />
        {ghosts.map((g) => (
          <Area
            key={g.key}
            type={lineType}
            dataKey={g.key}
            stroke="var(--muted-foreground)"
            strokeOpacity={0.28}
            strokeWidth={1}
            fill="none"
            dot={false}
            isAnimationActive={false}
            activeDot={false}
          />
        ))}
        {/* identify each ghost line at its right end (compare-mode legend) */}
        {ghosts.map((g) => (
          <ReferenceDot
            key={`tag-${g.key}`}
            x={len - 1}
            y={g.points[len - 1]}
            r={2}
            fill="var(--muted-foreground)"
            stroke="none"
            ifOverflow="extendDomain"
            label={{ value: g.label, position: "right", fill: "var(--muted-foreground)", fontSize: 10 }}
          />
        ))}
        <Area
          type={lineType}
          dataKey={hero.key}
          stroke={heroColor}
          strokeWidth={2.5}
          fill={`url(#g${gid})`}
          dot={false}
          isAnimationActive={!reduced}
          animationDuration={700}
          animationEasing="ease-out"
          activeDot={{ r: 4, fill: heroColor, strokeWidth: 2, stroke: "var(--background)" }}
        />
        {/* end-of-line hero: soft glow behind a crisp dot + a price tag */}
        <ReferenceDot x={len - 1} y={last} r={7} fill={heroColor} fillOpacity={0.3} stroke="none" filter={`url(#glow${gid})`} ifOverflow="extendDomain" />
        <ReferenceDot
          x={len - 1}
          y={last}
          r={3.5}
          fill={heroColor}
          stroke="var(--background)"
          strokeWidth={2}
          ifOverflow="extendDomain"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
