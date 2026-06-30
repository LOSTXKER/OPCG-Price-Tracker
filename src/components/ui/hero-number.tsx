"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

const DURATION = 600

/**
 * The one big number on a screen (VISION §3 atom). `.text-display`, tabular
 * numerals, count-up on mount/settle, and scrub-bindable: pass `live` while the
 * user drags a chart so the value mirrors instantly, then flip `live` off to let
 * it ease back to the settled figure ("snap-back"). `value` is already in the
 * caller's display currency; `format` turns it into the shown string.
 *
 * One hero number per screen — see VISION §4 rule 1.
 */
export function HeroNumber({
  value,
  format,
  hidden = false,
  hiddenText = "••••••",
  live = false,
  animate = true,
  className,
}: {
  value: number
  format: (n: number) => string
  /** Balance-privacy mode — render the mask instead of the figure. */
  hidden?: boolean
  hiddenText?: string
  /** True while scrubbing — show the exact value with no tween. */
  live?: boolean
  /** Count-up on mount and when the settled value changes. Ignored when `live`. */
  animate?: boolean
  className?: string
}) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    // Scrubbing: the render mirrors `value` directly; just keep the tween origin
    // current so the snap-back (live → false) eases from where the finger left.
    if (live) {
      fromRef.current = value
      return
    }

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const dur = !animate || reduce ? 0 : DURATION
    const from = mountedRef.current ? fromRef.current : dur === 0 ? value : 0
    mountedRef.current = true
    const start = performance.now()
    const delta = value - from

    // All state updates run inside the rAF callback (async) — never synchronously
    // in the effect body. dur === 0 snaps on the first frame.
    const tick = (now: number) => {
      const t = dur === 0 ? 1 : Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplay(from + delta * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, live, animate])

  return (
    <span className={cn("text-display tabular-nums", className)}>
      {hidden ? hiddenText : format(live ? value : display)}
    </span>
  )
}
