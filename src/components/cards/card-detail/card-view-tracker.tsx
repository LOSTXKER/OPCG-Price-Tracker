"use client"

import { useEffect, useRef } from "react"

/**
 * Fire-and-forget view ping. Keeping the increment out of the page render is
 * what lets the card page be ISR-cached — and means crawlers (which don't run
 * JS) stop inflating `viewCount`.
 */
export function CardViewTracker({ cardCode }: { cardCode: string }) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    void fetch(`/api/cards/${encodeURIComponent(cardCode)}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // A missed view ping is never worth surfacing to the reader.
    })
  }, [cardCode])

  return null
}
