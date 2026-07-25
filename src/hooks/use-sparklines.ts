"use client"

import { useEffect, useState } from "react"
import { apiGet } from "@/lib/api/client"

const SPARKLINE_BATCH_SIZE = 50

/**
 * Fetches 30-day price sparkline series for a set of cards from
 * `/api/cards/sparklines`, keyed by card id. Abortable; refetches whenever the
 * card array reference changes (i.e. after a new page/filter fetch). Shared by
 * the home market table (`useMarketCards`) and `/search` (`useSearch`) so both
 * render the same trend lines from one implementation.
 */
export function useSparklines(
  cards: { id?: number | null }[],
): Record<number, number[]> {
  const [sparklines, setSparklines] = useState<Record<number, number[]>>({})

  useEffect(() => {
    const ids = [...new Set(
      cards
        .map((card) => card.id)
        .filter((id): id is number => id != null && Number.isInteger(id)),
    )]
    if (ids.length === 0) return

    const controller = new AbortController()
    const requests = []
    for (let index = 0; index < ids.length; index += SPARKLINE_BATCH_SIZE) {
      const batch = ids.slice(index, index + SPARKLINE_BATCH_SIZE)
      requests.push(
        apiGet<{ sparklines?: Record<number, number[]> }>(
          `/api/cards/sparklines?ids=${batch.join(",")}`,
          controller.signal,
        ),
      )
    }

    void Promise.all(requests)
      .then((responses) => {
        if (controller.signal.aborted) return

        const merged: Record<number, number[]> = {}
        for (const response of responses) {
          Object.assign(merged, response.sparklines ?? {})
        }
        setSparklines(merged)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        if (err instanceof Error && err.name === "AbortError") return
        console.error("Sparkline fetch failed:", err)
      })

    return () => controller.abort()
  }, [cards])

  return sparklines
}
