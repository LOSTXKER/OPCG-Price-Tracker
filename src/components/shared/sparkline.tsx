"use client"

export function Sparkline({
  data,
  width = 80,
  height = 32,
  className,
}: {
  data: number[]
  width?: number
  height?: number
  className?: string
}) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2

  const w = width
  const h = height
  const drawH = h - padding * 2

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * w
    const y = padding + drawH - ((val - min) / range) * drawH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const isUp = data[data.length - 1] >= data[0]

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={isUp ? "var(--price-up)" : "var(--price-down)"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
      />
    </svg>
  )
}
