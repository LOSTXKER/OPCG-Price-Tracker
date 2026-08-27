"use client"

import { type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { TypewriterText } from "@/components/shared/typewriter-text"
import {
  buildHomeHeroHeading,
  buildHomeHeroSubtitle,
} from "@/lib/seo/copy/home"

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
 * Compact page introduction after search moved into the global navbar. The
 * keyword-bearing H1 remains visible for people and crawlers, but the duplicate
 * input and marketing kicker are gone so the market reaches the first viewport
 * sooner — the same content-first rhythm used by CoinGecko's market page.
 */
export function HomeSearchHero() {
  const lang = useUIStore((s) => s.language)

  return (
    <section className="relative">
      <div className="px-4 pb-2 pt-2 sm:pb-4 sm:pt-4">
        <div>
          {/* The H1 is the page's one keyword-bearing heading and must remain
              real visible text. The rotating line is supporting copy only. */}
          <h1 className="text-h1 text-foreground">
            {buildHomeHeroHeading(lang)}
          </h1>
          <p className="mt-1 text-body-sm text-muted-foreground">
            <span className="sr-only">{buildHomeHeroSubtitle(lang)}</span>
            <span aria-hidden>
              <TypewriterText words={ROTATING[lang]} holdMs={2600} className="text-foreground" />
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
