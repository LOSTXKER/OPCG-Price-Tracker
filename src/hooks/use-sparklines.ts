"use client"

import { useEffect, useState } from "react"
import { apiGet } from "@/lib/api/client"

/**
 * Fetches 7-day price sparkline series for a set of cards from
 * `/api/cards/sparklines`, keyed by card id. Abortable; refetches whenever the
 * card array reference changes (i.e. after a new page/filter fetch). Shared by
 * the home market table (`useMarketCards`) and `/search` (`useSearch`) so both
 * render the same trend lines from one implementation.
 *
 * The endpoint caps at 50 ids, which covers a full page (PAGE_SIZE), so no
 * batching is needed here.
 */
export function useSparklines(
  cards: { id?: number | null }[],
): Record<number, number[]> {
  const [sparklines, setSparklines] = useState<Record<number, number[]>>({})

  useEffect(() => {
    const ids = cards.map((c) => c.id).filter((id): id is number => id != null)
    if (ids.length === 0) return
    const controller = new AbortController()
    apiGet<{ sparklines?: Record<number, number[]> }>(
      `/api/cards/sparklines?ids=${ids.join(",")}`,
      controller.signal,
    )
      .then((data) => { if (data.sparklines) setSparklines(data.sparklines) })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") console.error("Sparkline fetch failed:", err)
      })
    return () => controller.abort()
  }, [cards])

  return sparklines
}
