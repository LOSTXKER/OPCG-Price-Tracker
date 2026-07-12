"use client"

import type { RefObject } from "react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface CardDetailSectionNavProps {
  lang: Language
  tabs: { id: string; label: string }[]
  activeTab: string
  indicator: { left: number; width: number }
  navRef: RefObject<HTMLElement | null>
  tabRefs: RefObject<Record<string, HTMLAnchorElement | null>>
  onSelect: (id: string) => void
}

/** Sticky in-page navigation and scrollspy indicator. */
export function CardDetailSectionNav({
  lang,
  tabs,
  activeTab,
  indicator,
  navRef,
  tabRefs,
  onSelect,
}: CardDetailSectionNavProps) {
  return (
    <nav
      ref={navRef}
      aria-label={t(lang, "cardSectionsNav")}
      className="ease-chrome sticky top-[var(--chrome-h)] z-30 mt-6 bg-background shadow-[inset_0_-1px_0_0_var(--p-hair)]"
    >
      <div className="no-sb relative flex gap-5 overflow-x-auto">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            ref={(element) => {
              tabRefs.current[tab.id] = element
            }}
            href={`#${tab.id}`}
            aria-current={tab.id === activeTab ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault()
              onSelect(tab.id)
            }}
            className={cn(
              "ease-chrome inline-flex min-h-11 shrink-0 items-center py-2.5 text-sm font-semibold focus-visible:outline-none",
              tab.id === activeTab
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </a>
        ))}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-foreground transition-[transform,width] duration-[var(--dur-slow)] ease-out"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
          }}
        />
      </div>
    </nav>
  )
}
