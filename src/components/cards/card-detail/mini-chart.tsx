"use client"

import { useId, useRef, useState } from "react"

import { compactDisplayValue, formatDisplayValue, type Currency } from "@/lib/utils/currency"

export interface ChartSeries {
  key: string
  points: number[]
  /** the selected grade — drawn bold/colored with area fill + end-dot. */
  isHero: boolean
  up: boolean
  label: string
}

/** "Nice" round gridline values across [min,max] (1/2/2.5/5/10 × 10ⁿ steps). */
function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1
  const raw = span / (count - 1)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = ([1, 2, 2.5, 5, 10].find((s) => s * mag >= raw) ?? 10) * mag
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-6; v += step) ticks.push(v)
  return ticks
}

/**
 * Multi-series trading chart on ONE shared scale. Every grade is a faint grey
 * ghost; the selected (hero) grade is the bold green/red line with gradient fill,
 * end-dot, and a dashed last-price reference. A real Y price axis (nice-tick
 * gridlines + right-edge HTML price labels), a last-price pill, and a scrub
 * tooltip make it read as a genuine terminal — not a drawn SVG. All TYPE is HTML
 * overlay (the SVG uses preserveAspectRatio="none", which would shear svg text).
 * Honey-gold stays reserved for chrome; only the hero carries gain/loss color.
 */
export function MiniAreaChart({
  series,
  height = 176,
  currency,
  labelAt,
  onScrub,
  onScrubEnd,
}: {
  series: ChartSeries[]
  height?: number
  currency: Currency
  labelAt?: (i: number) => string
  onScrub?: (i: number) => void
  onScrubEnd?: () => void
}) {
  const W = 360
  const H = height
  const PAD = 10
  const gid = useId().replace(/:/g, "")
  const ref = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  const hero = series.find((s) => s.isHero) ?? series[0]
  if (!hero || hero.points.length < 2) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: H }}>
        —
      </div>
    )
  }

  // shared scale — pool every visible series so the ladder is honest
  const all = series.flatMap((s) => s.points)
  const min = Math.min(...all)
  const max = Math.max(...all)
  const range = max - min || 1
  const len = hero.points.length
  const x = (i: number) => (i / (len - 1)) * W
  const y = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2)

  const toLine = (pts: number[]) =>
    pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")

  const heroPts = hero.points.map((v, i) => [x(i), y(v)] as const)
  const heroLine = toLine(hero.points)
  const heroArea = `${heroLine} L ${W} ${H} L 0 ${H} Z`
  const stroke = hero.up ? "var(--price-up)" : "var(--price-down)"
  const ghosts = series.filter((s) => s !== hero && s.points.length >= 2)

  const lastV = hero.points[len - 1]
  const lastY = y(lastV)
  const ticks = niceTicks(min, max).filter((t) => Math.abs(y(t) - lastY) > 14) // avoid pill collision

  function locate(clientX: number) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const rel = (clientX - rect.left) / rect.width
    const i = Math.max(0, Math.min(len - 1, Math.round(rel * (len - 1))))
    setHover(i)
    onScrub?.(i)
  }
  function end() {
    setHover(null)
    onScrubEnd?.()
  }

  const hoverLeft = hover !== null ? (x(hover) / W) * 100 : 0
  const flip = hoverLeft > 70

  return (
    <div className="relative select-none" style={{ height: H }}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          locate(e.clientX)
        }}
        onPointerMove={(e) => hover !== null && locate(e.clientX)}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* price gridlines (behind everything) */}
        {ticks.map((t) => (
          <line key={t} x1="0" y1={y(t)} x2={W} y2={y(t)} stroke="var(--p-hair)" strokeOpacity="0.6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}

        {/* hero area backdrop, then ghosts crisp on top, then the hero line */}
        <path d={heroArea} fill={`url(#g${gid})`} className="ease-chrome transition-opacity duration-150" />
        {ghosts.map((g) => (
          <path
            key={g.key}
            d={toLine(g.points)}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeOpacity="0.3"
            strokeWidth="1"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="ease-chrome transition-[opacity,stroke-width] duration-150"
          />
        ))}
        <path
          d={heroLine}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="ease-chrome transition-[opacity,stroke-width] duration-150"
        />

        {/* dashed last-price reference */}
        <line x1="0" y1={lastY} x2={W} y2={lastY} stroke={stroke} strokeDasharray="2 3" strokeOpacity="0.5" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <circle cx={heroPts[len - 1][0]} cy={heroPts[len - 1][1]} r="3" fill={stroke} vectorEffect="non-scaling-stroke" />

        {hover !== null && (
          <g>
            <line x1={heroPts[hover][0]} y1="0" x2={heroPts[hover][0]} y2={H} stroke="var(--p-hair)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <circle cx={heroPts[hover][0]} cy={heroPts[hover][1]} r="4.5" fill="var(--background)" stroke={stroke} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </g>
        )}
      </svg>

      {/* Y price labels — HTML overlay (svg text would shear) */}
      {ticks.map((t) => (
        <span
          key={t}
          className="text-overlay tnum pointer-events-none absolute right-0 -translate-y-1/2 bg-[var(--background)]/60 px-0.5 text-muted-foreground/70"
          style={{ top: `${(y(t) / H) * 100}%` }}
        >
          {compactDisplayValue(t, currency)}
        </span>
      ))}

      {/* last-price pill */}
      <span
        className="text-overlay tnum surface-2 hairline pointer-events-none absolute right-0 -translate-y-1/2 rounded px-1.5 py-0.5"
        style={{ top: `${(lastY / H) * 100}%`, color: stroke }}
      >
        {formatDisplayValue(lastV, currency)}
      </span>

      {/* scrub tooltip */}
      {hover !== null && (
        <div
          className="surface-2 hairline pointer-events-none absolute top-1 z-10 rounded-md px-2 py-1 shadow-[var(--elev-overlay)]"
          style={{ left: `${Math.max(0, Math.min(100, hoverLeft))}%`, transform: flip ? "translateX(-100%)" : "translateX(0)" }}
        >
          {labelAt && <p className="text-meta whitespace-nowrap">{labelAt(hover)}</p>}
          <p className="tnum whitespace-nowrap text-sm font-semibold text-foreground">
            {formatDisplayValue(hero.points[hover], currency)}
          </p>
        </div>
      )}
    </div>
  )
}
