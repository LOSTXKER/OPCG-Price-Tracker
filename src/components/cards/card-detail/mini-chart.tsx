"use client"

import { useId } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { compactDisplayValue, formatDisplayValue, type Currency } from "@/lib/utils/currency"

export interface ChartSeries {
  key: string
  points: number[]
  /** the selected grade — drawn bold/colored with area fill. */
  isHero: boolean
  up: boolean
  label: string
}

type Def = { key: string; label: string; color: string; isHero: boolean }

function GradeTooltip({
  active,
  payload,
  label,
  defs,
  labelAt,
  currency,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ dataKey?: string | number; value?: number }>
  label?: number
  defs: Def[]
  labelAt?: (i: number) => string
  currency: Currency
}) {
  if (!active || !payload?.length) return null
  const date = labelAt && typeof label === "number" ? labelAt(label) : ""
  // hero first, then ghosts — only series that have a value at this point
  const rows = defs
    .map((d) => ({ d, v: payload.find((p) => p.dataKey === d.key)?.value }))
    .filter((r) => r.v != null)
    .sort((a, b) => (b.v as number) - (a.v as number))
  return (
    <div className="surface-2 hairline rounded-md px-2.5 py-2 shadow-[var(--elev-overlay)]">
      {date && <p className="text-meta mb-1">{date}</p>}
      <div className="space-y-0.5">
        {rows.map(({ d, v }) => (
          <div key={d.key} className="flex items-center gap-2">
            <span aria-hidden className="size-1.5 rounded-full" style={{ background: d.color }} />
            <span className="text-meta">{d.label}</span>
            <span
              className="tnum ml-auto text-xs font-semibold"
              style={{ color: d.isHero ? d.color : "var(--foreground)" }}
            >
              {formatDisplayValue(v as number, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Multi-grade price chart (Recharts) — every visible grade overlaid on ONE shared
 * scale (the ghost ladder), the selected grade drawn as the bold green/red hero
 * line with a gradient fill + last-price reference. A real, proportioned chart
 * (responsive, gridlines, right price axis, hover tooltip) — not a stretched SVG.
 * Honey-gold stays reserved for chrome; only the hero carries gain/loss color.
 */
export function MiniAreaChart({
  series,
  height = 280,
  currency,
  labelAt,
}: {
  series: ChartSeries[]
  height?: number
  currency: Currency
  labelAt?: (i: number) => string
}) {
  const gid = useId().replace(/:/g, "")
  const hero = series.find((s) => s.isHero) ?? series[0]

  if (!hero || hero.points.length < 2) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        —
      </div>
    )
  }

  const len = hero.points.length
  const heroColor = hero.up ? "var(--price-up)" : "var(--price-down)"
  const ghosts = series.filter((s) => s !== hero && s.points.length >= 2)
  const orderedDefs: Def[] = [
    ...ghosts.map((g) => ({ key: g.key, label: g.label, color: "var(--muted-foreground)", isHero: false })),
    { key: hero.key, label: hero.label, color: heroColor, isHero: true },
  ]
  const lastVal = hero.points[len - 1]

  // one row per index; each grade is a column (shared x → shared scale ladder)
  const data = Array.from({ length: len }, (_, i) => {
    const row: Record<string, number> = { idx: i }
    for (const s of series) if (s.points[i] != null) row[s.key] = s.points[i]
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={heroColor} stopOpacity={0.26} />
            <stop offset="100%" stopColor={heroColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/25" vertical={false} />
        <XAxis
          dataKey="idx"
          type="number"
          domain={[0, len - 1]}
          tickFormatter={(i) => labelAt?.(Number(i)) ?? ""}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
          minTickGap={56}
          dy={6}
        />
        <YAxis
          orientation="right"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          className="tnum text-muted-foreground"
          tickFormatter={(v) => compactDisplayValue(Number(v), currency)}
          width={50}
          domain={[(min: number) => Math.floor(min * 0.96), (max: number) => Math.ceil(max * 1.04)]}
        />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3", strokeWidth: 1, opacity: 0.4 }}
          content={<GradeTooltip defs={orderedDefs} labelAt={labelAt} currency={currency} />}
        />
        {ghosts.map((g) => (
          <Area
            key={g.key}
            type="monotone"
            dataKey={g.key}
            stroke="var(--muted-foreground)"
            strokeOpacity={0.32}
            strokeWidth={1}
            fill="none"
            dot={false}
            isAnimationActive={false}
            activeDot={false}
          />
        ))}
        <Area
          type="monotone"
          dataKey={hero.key}
          stroke={heroColor}
          strokeWidth={2}
          fill={`url(#g${gid})`}
          dot={false}
          isAnimationActive={false}
          activeDot={{ r: 4, fill: heroColor, strokeWidth: 2, stroke: "var(--background)" }}
        />
        <ReferenceLine y={lastVal} stroke={heroColor} strokeDasharray="2 3" strokeOpacity={0.5} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
