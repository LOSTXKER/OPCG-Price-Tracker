"use client"

import { buildHomeMarketIntro } from "@/lib/seo/copy/home"
import { useUIStore } from "@/stores/ui-store"

/**
 * Heading + context copy above the market table (SEO plan §3.1 — the core
 * content block used to jump straight from the hero to a toolbar, so the page's
 * main data section had no heading and no prose at all).
 *
 * Client component only so the copy follows the language toggle; it renders in
 * the first HTML response like every other client component on this ISR page
 * (the store's default language is TH, which is what crawlers get).
 */
export function HomeMarketIntro({
  totalCards,
  totalSets,
}: {
  totalCards: number
  totalSets: number
}) {
  const lang = useUIStore((s) => s.language)
  const { heading, body } = buildHomeMarketIntro(lang, { totalCards, totalSets })

  return (
    // px-4 matches the toolbar / table rows below at every width, so the
    // heading sits exactly over the section it titles.
    <div className="px-4">
      <h2 className="text-h2">{heading}</h2>
      <p className="mt-2 max-w-3xl text-body-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )
}
