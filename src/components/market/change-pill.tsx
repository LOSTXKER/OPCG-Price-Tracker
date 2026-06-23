import { cn } from "@/lib/utils"
import { changeToneClass, formatSignedPct } from "@/lib/utils/currency"

/**
 * Colored %-change value (CMC/Coinbase style): green up / red down / muted flat.
 * Plain colored text — no background — so the table reads minimal. The +/- sign
 * (not color alone) carries direction for colorblind/low-vision users. `null`
 * renders a muted em-dash. Shared by the market table row + mobile list item.
 */
export function ChangePill({
  value,
  className,
}: {
  value?: number | null
  className?: string
}) {
  return (
    <span className={cn("font-price text-xs font-medium tabular-nums", changeToneClass(value), className)}>
      {formatSignedPct(value)}
    </span>
  )
}
