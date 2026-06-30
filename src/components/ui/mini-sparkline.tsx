interface MiniSparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
}

/**
 * Tiny inline trend line — gain/loss tinted, no axes. Used in dense rows
 * (watchlist) where a full chart would be too heavy. Renders null with <2 points.
 * For the portfolio hero/value timeline use PortfolioScrubChart instead.
 */
export function MiniSparkline({ data, width = 180, height = 24, className }: MiniSparklineProps) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 2) - 1
      return `${x},${y}`
    })
    .join(" ")
  const up = data[data.length - 1] >= data[0]
  const gradientId = up ? "sparkGradUp" : "sparkGradDown"
  const fillPoints = `0,${height} ${points} ${width},${height}`
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? "var(--color-price-up)" : "var(--color-price-down)"} stopOpacity="0.15" />
          <stop offset="100%" stopColor={up ? "var(--color-price-up)" : "var(--color-price-down)"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#${gradientId})`} points={fillPoints} />
      <polyline
        fill="none"
        stroke={up ? "var(--color-price-up)" : "var(--color-price-down)"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
