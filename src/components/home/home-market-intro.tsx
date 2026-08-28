"use client"

import { buildHomeMarketHeading } from "@/lib/seo/copy/home"
import { useUIStore } from "@/stores/ui-store"

/**
 * Slim heading above the market table (SEO plan §3.1 gave the page's core
 * data section a real h2; owner ruling 2026-08-28 then moved the keyword
 * phrase and the freshness date up into the hero lead, so only the section
 * name remains here — no prose between the heading and the toolbar).
 *
 * Client component only so the copy follows the language toggle; it renders in
 * the first HTML response like every other client component on this ISR page
 * (the store's default language is TH, which is what crawlers get).
 */
export function HomeMarketIntro() {
  const lang = useUIStore((s) => s.language)

  return (
    // px-4 matches the toolbar / table rows below at every width, so the
    // heading sits exactly over the section it titles.
    <div className="px-4">
      <h2 className="text-h2">{buildHomeMarketHeading(lang)}</h2>
    </div>
  )
}
