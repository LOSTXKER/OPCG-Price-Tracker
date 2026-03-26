"use client"

import { useEffect } from "react"
import { Star } from "lucide-react"
import { useWatchlistStore } from "@/stores/watchlist-store"
import { cn } from "@/lib/utils"

const SIZE = {
  sm: "size-3.5",
  md: "size-5",
} as const

export function WatchlistStar({
  cardId,
  size = "sm",
  className,
}: {
  cardId: number
  size?: "sm" | "md"
  className?: string
}) {
  const loaded = useWatchlistStore((s) => s.loaded)
  const watched = useWatchlistStore((s) => s.ids.has(cardId))
  const load = useWatchlistStore((s) => s.load)
  const toggle = useWatchlistStore((s) => s.toggle)

  useEffect(() => {
    void load()
  }, [load])

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void toggle(cardId)
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center transition-colors",
        loaded
          ? "text-muted-foreground/40 hover:text-amber-400"
          : "pointer-events-none text-muted-foreground/20",
        watched && "text-amber-400 hover:text-amber-500",
        className
      )}
      aria-label={watched ? "ลบออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
    >
      <Star
        className={cn(SIZE[size], watched && "fill-current")}
      />
    </button>
  )
}
