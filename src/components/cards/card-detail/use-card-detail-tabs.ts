"use client"

import { useEffect, useRef, useState } from "react"

import type { Language } from "@/lib/i18n"

const SECTION_IDS = ["overview", "sources", "market", "versions"]
const ACTIVATION_SLOP_PX = 4

export function getSectionActivationLine(navBottom: number, scrollMarginTop: number) {
  return Math.max(navBottom, scrollMarginTop) + ACTIVATION_SLOP_PX
}

/**
 * Owns the sticky section-nav: scrollspy (which in-page section sits under the
 * tab bar) + the sliding underline indicator measurement + click-to-scroll.
 * Wire `navRef` on the nav, `tabRefs` on each anchor, `tabIndicator` on the
 * sliding underline; call `scrollToSection` from a tab's onClick.
 */
export function useCardDetailTabs(lang: Language) {
  const navRef = useRef<HTMLElement | null>(null)
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [activeTab, setActiveTab] = useState("overview")
  const [tabIndicator, setTabIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  const scrollToSection = (id: string) => {
    setActiveTab(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // Scrollspy — the tabs are in-page anchors, so the active underline must
  // follow the section currently under the sticky chrome. Targets intentionally
  // stop a little below the sticky nav via scroll-margin; include that landing
  // line so a completed tab click is not immediately reset to the prior tab.
  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el != null,
    )
    if (sections.length === 0) return
    let raf = 0
    const sync = () => {
      raf = 0
      const navBottom = navRef.current?.getBoundingClientRect().bottom ?? 100
      // Active = section most recently crossed under the tab bar (greatest top
      // still ≤ offset). Ties break to the FIRST id → main column wins.
      let current = sections[0].id
      let bestTop = -Infinity
      for (const el of sections) {
        const scrollMarginTop = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0
        const offset = getSectionActivationLine(navBottom, scrollMarginTop)
        const top = el.getBoundingClientRect().top - offset
        if (top <= 0 && top > bestTop) {
          bestTop = top
          current = el.id
        }
      }
      setActiveTab(current)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync)
    }
    sync()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Sliding underline — measure the active tab's box and animate to it
  // (re-measures on tab change + language/width changes).
  useEffect(() => {
    const measure = () => {
      const el = tabRefs.current[activeTab]
      if (el) setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [activeTab, lang])

  return { navRef, tabRefs, activeTab, tabIndicator, scrollToSection }
}
