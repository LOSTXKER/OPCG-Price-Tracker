interface MiniSparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
  /**
   * Draw a soft solid area under the line. Off by default — dense rows read
   * cleaner as a plain trend line. Turn on only for roomier one-off contexts.
   */
  fill?: boolean
}

/**
 * The ONE tiny inline trend line (KIT-08) — gain/loss tinted, no axes. Used across
 * every dense row (market · portfolio · watchlist · trending · home). Fixed
 * width/height so it renders pixel-stable inside a row; pass `fill` for a subtle
 * area under the line. Renders null with <2 points. For the portfolio hero / value
 * timeline use PortfolioScrubChart instead.
 */
export function MiniSparkline({ data, width = 88, height = 28, className, fill = false }: MiniSparklineProps) {
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
  const stroke = up ? "var(--color-price-up)" : "var(--color-price-down)"
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      {fill && (
        <polygon
          fill={stroke}
          fillOpacity={0.08}
          points={`0,${height} ${points} ${width},${height}`}
        />
      )}
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
