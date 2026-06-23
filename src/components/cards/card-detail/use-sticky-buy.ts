"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Drives the mobile sticky-buy bar. `sentinelRef` goes on a 1px marker right
 * after the hero buy box; once it scrolls near the top of the viewport
 * (y < 72), `showStickyBuy` flips true. Uses scroll/resize listeners plus an
 * IntersectionObserver when available.
 */
export function useStickyBuy() {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [showStickyBuy, setShowStickyBuy] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const update = () => setShowStickyBuy(sentinel.getBoundingClientRect().top < 72)
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(update)
      observer.observe(sentinel)
    }
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
      observer?.disconnect()
    }
  }, [])

  return { sentinelRef, showStickyBuy }
}
