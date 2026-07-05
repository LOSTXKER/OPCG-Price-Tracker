import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

const SIZES = { sm: "size-3", md: "size-3.5", lg: "size-5" } as const

/**
 * The one read-only star rating (COMMERCE-13) — honey/amber filled, muted empty,
 * value rounded for display. Replaces the per-file star renderers that each
 * picked a different colour (foreground / yellow / amber / primary). For an
 * INTERACTIVE rating input build a separate RatingInput atom (none exists yet).
 */
export function RatingStars({
  value,
  max = 5,
  size = "sm",
  className,
  ariaLabel,
}: {
  value: number
  max?: number
  size?: keyof typeof SIZES
  className?: string
  ariaLabel?: string
}) {
  const full = Math.round(value)
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={ariaLabel ?? `${value.toFixed(1)}/${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(SIZES[size], i < full ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")}
        />
      ))}
    </span>
  )
}
