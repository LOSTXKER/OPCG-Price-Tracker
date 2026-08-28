"use client"

import { type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import {
  buildHomeHeroHeading,
  buildHomeHeroLead,
  buildHomeHeroMeta,
} from "@/lib/seo/copy/home"

/**
 * Compact page introduction after search moved into the global navbar. One
 * keyword-bearing H1 + ONE lead sentence (owner ruling 2026-08-28): the lead
 * absorbed the old rotating typewriter line, the market-intro paragraph and
 * the separate "อัปเดตล่าสุด" line, so the market reaches the first viewport
 * sooner — the same content-first rhythm as CoinMarketCap's header.
 */
export function HomeSearchHero({
  totalCards,
  totalSets,
  updatedLabels,
}: {
  totalCards: number
  totalSets: number
  /**
   * Freshest price scrape, pre-formatted server-side per language: the page
   * is ISR (no request-time language) and formatting on the client risks a
   * hydration mismatch when server/client timezones disagree on the calendar
   * day. E-E-A-T signal — a visible, real "last updated" date is the thing
   * frozen listicle competitors cannot show (SEO round 2).
   */
  updatedLabels: Record<Language, string> | null
}) {
  const lang = useUIStore((s) => s.language)

  return (
    <section className="relative">
      {/* No horizontal padding of its own: the page container already sets the
          one gutter every block on this page lines up on (owner selection
          2026-08-29 — the old px-4 inset the hero 16px past the set strip and
          the market rows). */}
      <div className="pb-2 pt-2 sm:pb-4 sm:pt-4">
        {/* The H1 is the page's one keyword-bearing heading and must remain
            real visible text. */}
        <h1 className="text-h1 text-foreground">
          {buildHomeHeroHeading(lang)}
        </h1>
        <p className="mt-1 max-w-3xl text-body-sm leading-relaxed text-muted-foreground">
          {buildHomeHeroLead(lang)}
        </p>
        <p className="mt-1.5 text-meta tabular-nums">
          {buildHomeHeroMeta(lang, {
            totalCards,
            totalSets,
            updatedLabel: updatedLabels?.[lang] ?? null,
          })}
        </p>
      </div>
    </section>
  )
}
