"use client"

import { useEffect } from "react"
import { Star } from "lucide-react"
import { useWatchlistStore } from "@/stores/watchlist-store"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"

const SIZE = {
  sm: "size-3.5",
  md: "size-5",
} as const

export function WatchlistStar({
  cardId,
  size = "sm",
  variant = "icon",
  className,
  showTooltip = true,
}: {
  cardId: number
  size?: "sm" | "md"
  /**
   * - `icon`: bare icon button (default — used in tables/headers)
   * - `chip`: square chip with visible surface and large tap target,
   *   for use in card grid action rows.
   */
  variant?: "icon" | "chip"
  className?: string
  showTooltip?: boolean
}) {
  const lang = useUIStore((s) => s.language)
  const loaded = useWatchlistStore((s) => s.loaded)
  const watched = useWatchlistStore((s) => s.ids.has(cardId))
  const limitHit = useWatchlistStore((s) => s.limitHit)
  const load = useWatchlistStore((s) => s.load)
  const toggle = useWatchlistStore((s) => s.toggle)
  const { openUpgradeDialog } = useUpgradeDialog()

  useEffect(() => {
    void load()
  }, [load])

  const tooltipText = limitHit && !watched
    ? t(lang, "limitReachedUpgrade")
    : watched
      ? t(lang, "removeFromWatchlist")
      : t(lang, "addToWatchlist")

  const button = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (limitHit && !watched) {
          openUpgradeDialog({ featureKey: "watchlistCards" })
          return
        }
        void toggle(cardId)
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center motion-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90",
        variant === "chip"
          ? "h-9 w-9 rounded-md border border-transparent dark:border-[var(--p-hair)] bg-muted/30 hover:border-amber-400/60 hover:bg-amber-400/10"
          : "rounded-sm",
        loaded
          ? variant === "chip"
            ? "text-muted-foreground hover:text-amber-500"
            : "text-muted-foreground/40 hover:text-amber-400"
          : "pointer-events-none text-muted-foreground/20",
        watched &&
          (variant === "chip"
            ? "border-amber-400/60 bg-amber-400/10 text-amber-500 hover:bg-amber-400/15"
            : "text-amber-400 hover:text-amber-500"),
        limitHit && !watched && "animate-pulse text-destructive",
        className
      )}
      aria-label={tooltipText}
    >
      <Star
        className={cn(SIZE[size], watched && "fill-current")}
      />
    </button>
  )

  if (!showTooltip) return button

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
