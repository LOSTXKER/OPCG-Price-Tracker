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
  className,
  showTooltip = true,
}: {
  cardId: number
  size?: "sm" | "md"
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
        "inline-flex shrink-0 items-center justify-center rounded-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90",
        loaded
          ? "text-muted-foreground/40 hover:text-amber-400"
          : "pointer-events-none text-muted-foreground/20",
        watched && "text-amber-400 hover:text-amber-500",
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
