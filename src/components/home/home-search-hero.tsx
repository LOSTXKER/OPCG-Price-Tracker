"use client"

import Link from "next/link"

import { getCardName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { HeroSearchBar, type SetSuggestion } from "./hero-search-bar"

export type HeroTrendingCard = {
  cardCode: string
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
}

/**
 * Home hero — universal search as the page's focal point (VISION §5 "Universal
 * search = teleport"). A calm headline sits above a single oversized smart bar
 * (cards · sets · shortcuts), with popular shortcuts as chips below. Kept
 * `z-30` + overflow-visible so the bar's results dropdown is never clipped by
 * the dense market data that follows.
 */
export function HomeSearchHero({ sets, trending }: { sets: SetSuggestion[]; trending?: HeroTrendingCard[] }) {
  const lang = useUIStore((s) => s.language)
  const chips = (trending ?? []).slice(0, 5).map((c) => ({ label: getCardName(lang, c), href: `/cards/${c.cardCode}` }))

  return (
    <section className="relative z-30">
      {/* subtle focal glow behind the bar (decorative) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-2 -z-10 mx-auto h-32 max-w-xl rounded-full bg-primary/10 blur-3xl"
      />
      <div className="mx-auto max-w-2xl px-1 pb-2 pt-4 sm:pt-8">
        <div className="text-center">
          <h1 className="text-h2 sm:text-h1">{t(lang, "heroSearchTitle")}</h1>
          <p className="text-meta mt-1.5">{t(lang, "heroSearchSubtitle")}</p>
        </div>

        <div className="mt-5">
          <HeroSearchBar sets={sets} />
        </div>

        {chips && chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-meta mr-0.5">{t(lang, "popular")}</span>
            {chips.map((c) => (
              <Link
                key={`${c.href}:${c.label}`}
                href={c.href}
                className="ease-chrome surface-1 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-[var(--p-hair)] transition-colors hover:text-foreground hover:ring-primary/30"
              >
                {c.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
