"use client"

import { useId, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/* ── formatting ─────────────────────────────────────────────────────────── */
export const baht = (n: number, dp = 0) =>
  "฿" + n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })
export const usd = (n: number, dp = 2) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })

/* ── signed delta (gain/loss only) ──────────────────────────────────────── */
export function Delta({
  pct,
  amount,
  className,
  size = "sm",
}: {
  pct: number | null | undefined
  amount?: string
  className?: string
  size?: "sm" | "lg"
}) {
  if (pct == null) return <span className={cn("text-muted-foreground", className)}>—</span>
  const up = pct >= 0
  return (
    <span
      className={cn("tnum inline-flex items-center gap-1 font-semibold", size === "lg" ? "text-base" : "text-sm", className)}
      style={{ color: up ? "var(--price-up)" : "var(--price-down)" }}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {amount && <span>{amount}</span>}
      <span>{Math.abs(pct).toFixed(1)}%</span>
    </span>
  )
}

/* ── segmented control ──────────────────────────────────────────────────── */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
  size?: "sm" | "md"
}) {
  return (
    <div className={cn("surface-2 hairline inline-flex rounded-full p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "ease-chrome rounded-full font-semibold",
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
              active ? "text-[var(--primary-foreground)]" : "text-muted-foreground hover:text-foreground",
            )}
            style={active ? { background: "var(--primary)" } : undefined}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── stat cell ──────────────────────────────────────────────────────────── */
export function StatCell({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="tnum mt-1 text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="tnum mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

/* ── warm surface card ──────────────────────────────────────────────────── */
export function Panel({ children, className, elevated = false }: { children: React.ReactNode; className?: string; elevated?: boolean }) {
  return <div className={cn(elevated ? "surface-2" : "surface-1", "hairline rounded-2xl", className)}>{children}</div>
}

/* ── foil thumbnail (real card art when available, gradient fallback) ────── */
export function FoilThumb({ src, alt, className }: { src?: string | null; alt?: string; className?: string }) {
  return (
    <div
      className={cn("relative aspect-[63/88] overflow-hidden rounded-lg hairline", className)}
      style={!src ? { background: "linear-gradient(150deg,#241808,#6d4f23,#e9b970)" } : undefined}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ""} className="size-full object-cover" loading="lazy" />
      )}
    </div>
  )
}

/* ── SVG area chart with finger-scrub ───────────────────────────────────── */
export function ScrubChart({
  data,
  height = 168,
  up = true,
  onScrub,
  onScrubEnd,
}: {
  data: number[]
  height?: number
  up?: boolean
  onScrub?: (i: number) => void
  onScrubEnd?: () => void
}) {
  const W = 360
  const H = height
  const PAD = 10
  const gid = useId().replace(/:/g, "")
  const ref = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const x = (i: number) => (i / (data.length - 1)) * W
  const y = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2)
  const pts = data.map((v, i) => [x(i), y(v)] as const)
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
  const area = `${line} L ${W} ${H} L 0 ${H} Z`
  const stroke = up ? "var(--price-up)" : "var(--price-down)"

  function locate(clientX: number) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const rel = (clientX - rect.left) / rect.width
    const i = Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1))))
    setHover(i)
    onScrub?.(i)
  }
  function end() {
    setHover(null)
    onScrubEnd?.()
  }

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      className="touch-none select-none"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); locate(e.clientX) }}
      onPointerMove={(e) => hover !== null && locate(e.clientX)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${gid})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {hover !== null && (
        <g>
          <line x1={pts[hover][0]} y1="0" x2={pts[hover][0]} y2={H} stroke="var(--v-hair)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4.5" fill="var(--background)" stroke={stroke} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </g>
      )}
    </svg>
  )
}

/* ── compact sparkline ──────────────────────────────────────────────────── */
export function Spark({ data, up = true, w = 64, h = 24 }: { data: number[]; up?: boolean; w?: number; h?: number }) {
  if (!data.length) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const d = data
    .map((v, i) => `${i ? "L" : "M"}${((i / (data.length - 1)) * w).toFixed(1)} ${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ")
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <path d={d} fill="none" stroke={up ? "var(--price-up)" : "var(--price-down)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
