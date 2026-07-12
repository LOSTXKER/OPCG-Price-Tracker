"use client"

import { t, type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { TypewriterText } from "@/components/shared/typewriter-text"
import { HeroSearchBar, type SetSuggestion } from "./hero-search-bar"

export type HeroTrendingCard = {
  cardCode: string
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
}

// Rotating headline subjects — the full sweep of what the PLATFORM does (not
// individual cards), so the hero sells every tool we ship. One entry per live
// feature: market price · history · trending · PSA 10 · portfolio · watchlist ·
// alerts · compare · deck calc · drop calc. Kept short so none wrap to a second
// line (which would jolt the layout). Per-language because these are value props.
const ROTATING: Record<Language, string[]> = {
  TH: ["ราคากลาง", "การ์ดมาแรง", "ราคา PSA 10", "พอร์ตการ์ด"],
  EN: ["live prices", "trending cards", "PSA 10 prices", "your portfolio"],
  JP: ["リアル相場", "急上昇カード", "PSA 10 相場", "ポートフォリオ"],
}

/**
 * Home hero — universal search as the page's focal point (VISION §5 "Universal
 * search = teleport"). A calm headline sits above a single oversized smart bar;
 * popular searches now live INSIDE the bar's focus dropdown (Fastwork-style),
 * not as chips below it. Kept `z-30` + overflow-visible so the dropdown is never
 * clipped by the dense market data that follows.
 */
export function HomeSearchHero({ sets, trending }: { sets: SetSuggestion[]; trending?: HeroTrendingCard[] }) {
  const lang = useUIStore((s) => s.language)

  return (
    <section className="relative z-30">
      <div className="mx-auto max-w-2xl px-1 pb-6 pt-4 sm:pb-8 sm:pt-8">
        <div className="text-center">
          {/* Eyebrow teaser + rotating subject.
              sr-only carries a stable heading; the animated line is aria-hidden. */}
          <p className="text-meta">{t(lang, "heroTeaser")}</p>
          <h1 className="mt-1.5 text-3xl font-extrabold leading-[1.12] tracking-tight text-foreground sm:text-5xl">
            <span className="sr-only">{t(lang, "heroSearchTitle")}</span>
            <span aria-hidden>
              <TypewriterText words={ROTATING[lang]} holdMs={2600} className="text-foreground" />
            </span>
          </h1>
        </div>

        <div className="mt-6">
          <HeroSearchBar sets={sets} trending={trending} />
        </div>
      </div>
    </section>
  )
}
