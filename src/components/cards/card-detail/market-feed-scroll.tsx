"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type MarketFeedScrollProps = {
  className?: string
  scrollClassName: string
  lang: Language
  /** Accessible name for the scroll region (e.g. the section title). */
  label?: string
  /** Changes when the row set changes (e.g. row count) — re-measures the scroll hint.
   *  A content-only change inside a fixed-height viewport doesn't resize the observed
   *  element, so the hint must be re-evaluated off this stable signal, not `children`. */
  revalidateKey?: number | string
  children: ReactNode
}

/** Scroll viewport for market feeds — bottom fade + hint when more rows are below. */
export function MarketFeedScroll({ className, scrollClassName, lang, label, revalidateKey, children }: MarketFeedScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showHint, setShowHint] = useState(false)

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const overflow = el.scrollHeight - el.clientHeight > 8
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8
    setShowHint(overflow && !atBottom)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // ResizeObserver fires once immediately on observe(), covering the initial
    // measurement without a synchronous setState in the effect body.
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [update, revalidateKey])

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollRef}
        className={scrollClassName}
        onScroll={update}
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </div>
      {showHint && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-12 bg-gradient-to-t from-background via-background/85 to-transparent"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-[3] flex items-center justify-center gap-1 text-meta">
            <ChevronDown className="size-3.5 shrink-0 motion-safe:animate-bounce" aria-hidden />
            <span>{t(lang, "scrollForMore")}</span>
          </div>
        </>
      )}
    </div>
  )
}
