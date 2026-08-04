"use client"

import { t, type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { TypewriterText } from "@/components/shared/typewriter-text"
import {
  buildHomeHeroHeading,
  buildHomeHeroSubtitle,
} from "@/lib/seo/copy/home"
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
 * not as chips below it.
 *
 * NO z-index here on purpose. It used to be `relative z-30`, which made this
 * section a stacking context — and the suggestion dropdown inside it could then
 * never rise above the floating ad (35) or the mobile bottom nav (50): both
 * punched straight through the results list. The dropdown now lifts itself to
 * `z-dropdown` (see hero-search-bar), which only works while this section stays
 * a plain positioning parent. Overflow stays visible so it isn't clipped either.
 */
export function HomeSearchHero({ sets, trending }: { sets: SetSuggestion[]; trending?: HeroTrendingCard[] }) {
  const lang = useUIStore((s) => s.language)

  return (
    <section className="relative">
      <div className="mx-auto max-w-2xl px-1 pb-6 pt-4 sm:pb-8 sm:pt-8">
        <div className="text-center">
          {/* Eyebrow teaser → visible H1 → rotating subject.
              The H1 is the page's one keyword-bearing heading and must be real
              visible text (SEO plan §3.1) — it used to be sr-only with only the
              animation on screen, so Google saw a heading with no keyword. The
              typewriter keeps the energy but is now a SUBTITLE: still decorative
              (aria-hidden), with an sr-only static line carrying the same list. */}
          <p className="text-meta">{t(lang, "heroTeaser")}</p>
          <h1 className="mt-1.5 text-3xl font-extrabold leading-[1.12] tracking-tight text-foreground sm:text-4xl">
            {buildHomeHeroHeading(lang)}
          </h1>
          <p className="mt-2 text-lg font-semibold leading-snug tracking-tight text-foreground sm:mt-3 sm:text-2xl">
            <span className="sr-only">{buildHomeHeroSubtitle(lang)}</span>
            <span aria-hidden>
              <TypewriterText words={ROTATING[lang]} holdMs={2600} className="text-foreground" />
            </span>
          </p>
        </div>

        <div className="mt-6">
          <HeroSearchBar sets={sets} trending={trending} />
        </div>
      </div>
    </section>
  )
}
