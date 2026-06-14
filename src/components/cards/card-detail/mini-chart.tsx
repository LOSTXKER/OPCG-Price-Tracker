"use client"

import { useId, useRef, useState } from "react"

/**
 * Clean SVG area chart (proto visionary look) — no axes/legend chrome, just a
 * gradient area + line, with optional finger-scrub. Up/down recolours to the
 * gain/loss tokens (honey-gold stays reserved for chrome). Ported from the proto
 * ScrubChart into a real component.
 */
export function MiniAreaChart({
  data,
  height = 176,
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

  if (data.length < 2) {
    return <div className="flex h-[176px] items-center justify-center text-sm text-muted-foreground">—</div>
  }

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
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {hover !== null && (
        <g>
          <line x1={pts[hover][0]} y1="0" x2={pts[hover][0]} y2={H} stroke="var(--p-hair)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4.5" fill="var(--background)" stroke={stroke} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </g>
      )}
    </svg>
  )
}
