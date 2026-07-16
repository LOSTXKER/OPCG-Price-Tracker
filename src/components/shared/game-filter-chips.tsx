"use client"

import type { KeyboardEvent } from "react"
import Image from "next/image"
import Link from "next/link"

import { getAllGameConfigs, getGameConfig } from "@/lib/game-config"
import { ALL_GAMES } from "@/lib/game/constants"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

export type GameChip = {
  slug: string
  /** Fallback label for unregistered games. Registered games may provide the
   *  canonical MINE-rail label through `GameConfig.filterName`. */
  label: string
  /** Pre-formatted per-game value (unit-labelled count). Omit for name-only
   *  chips — e.g. portfolio, where the money lives in the breakdown panel. */
  value?: string
  logoUrl?: string | null
}

/** Registered-but-not-yet-live games, teased at the end of every MINE rail so a
 *  single-game collector still sees the multi-game roadmap. Tapping routes to the
 *  same `/coming-soon` teaser the header switcher uses. */
const COMING_SOON_GAMES = getAllGameConfigs().filter((g) => g.comingSoon)

/** @internal Exported for keyboard regression coverage. */
export function getGameFilterTargetIndex(
  key: string,
  currentIndex: number,
  itemCount: number,
): number | null {
  if (itemCount <= 0 || currentIndex < 0 || currentIndex >= itemCount) return null
  if (key === "Home") return 0
  if (key === "End") return itemCount - 1
  if (key === "ArrowRight" || key === "ArrowDown") {
    return (currentIndex + 1) % itemCount
  }
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return (currentIndex - 1 + itemCount) % itemCount
  }
  return null
}

function handleGameFilterKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return

  const current = target.closest<HTMLButtonElement>('button[role="radio"]')
  if (!current || !event.currentTarget.contains(current)) return

  const radios = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>(
      'button[role="radio"]:not(:disabled)',
    ),
  )
  const currentIndex = radios.indexOf(current)
  const nextIndex = getGameFilterTargetIndex(event.key, currentIndex, radios.length)
  if (nextIndex == null) return

  event.preventDefault()
  const next = radios[nextIndex]
  if (!next) return
  next.focus()
  if (next !== current) next.click()
}

/**
 * The "one collection, every game" filter for a unified personal surface
 * (portfolio / watchlist / alerts). The caller passes only games with real data,
 * while the rail keeps a stable All → live game → coming-soon hierarchy even
 * when there is only one live game. With no data games, only the roadmap teaser
 * remains; a coming-soon game with real demo data becomes a live filter instead
 * of rendering twice.
 *
 * Visual vocabulary is byte-identical to SegmentedControl's pill: frameless
 * `bg-muted/50` track, active = `bg-primary/15 text-primary` (one honey fill,
 * no border/extra dot — keeps honey <5%). Segments keep a 44px touch target
 * below `md`, then settle to the same compact desktop rail as other filters.
 */
export function GameFilterChips({
  games,
  activeGame,
  onSelect,
  allValue,
}: {
  games: GameChip[]
  activeGame: string
  onSelect: (game: string) => void
  /** Aggregate value shown on the "All games" chip (e.g. the cross-game total). */
  allValue?: string
}) {
  const lang = useUIStore((s) => s.language)

  // Keep the MINE rail structurally consistent from the first live game onward.
  // Never tease a game that already has data (it is a live filter chip instead).
  const showFilter = games.length > 0
  const hasActiveSelection =
    activeGame === ALL_GAMES || games.some((game) => game.slug === activeGame)
  const teasers = COMING_SOON_GAMES.filter((g) => !games.some((x) => x.slug === g.slug))
  if (!showFilter && teasers.length === 0) return null

  return (
    <div className="no-sb relative -mx-0.5 flex h-11 w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-full px-0.5 before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-1 before:rounded-full before:bg-muted/50 before:content-[''] md:h-auto md:bg-muted/50 md:p-0.5 md:before:hidden">
      {showFilter && (
        <div
          role="radiogroup"
          aria-label={t(lang, "filterByGame")}
          className="contents"
          onKeyDown={handleGameFilterKeyDown}
        >
          <Seg
            active={activeGame === ALL_GAMES}
            tabIndex={activeGame === ALL_GAMES || !hasActiveSelection ? 0 : -1}
            onClick={() => onSelect(ALL_GAMES)}
            label={t(lang, "allGames")}
            value={allValue}
          />
          {games.map((g) => (
            <Seg
              key={g.slug}
              active={activeGame === g.slug}
              tabIndex={activeGame === g.slug ? 0 : -1}
              onClick={() => onSelect(g.slug)}
              label={getGameConfig(g.slug)?.filterName ?? g.label}
              value={g.value}
              logoUrl={g.logoUrl}
            />
          ))}
        </div>
      )}
      {teasers.map((g) => (
        <ComingSoonSeg
          key={g.slug}
          slug={g.slug}
          label={g.filterName ?? g.shortName ?? g.nameEn}
          soon={t(lang, "comingSoon")}
        />
      ))}
    </div>
  )
}

/** Teaser pill for a not-yet-live game. A link (not a radio) so it stays out of
 *  the filter's radiogroup semantics — it navigates, it doesn't filter. */
function ComingSoonSeg({ slug, label, soon }: { slug: string; label: string; soon: string }) {
  return (
    <Link
      href={`/coming-soon?game=${slug}`}
      className="motion-base relative z-10 inline-flex h-11 shrink-0 snap-start items-center gap-2 rounded-full px-3 py-2 text-muted-foreground/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:h-8 md:gap-1.5 md:px-2.5 md:py-1"
    >
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full border border-dashed border-muted-foreground/50"
      />
      <span className="whitespace-nowrap text-body-sm font-medium">{label}</span>
      <span className="whitespace-nowrap rounded-full bg-muted px-1.5 py-0.5 text-micro text-muted-foreground">
        {soon}
      </span>
    </Link>
  )
}

function Seg({
  active,
  tabIndex,
  onClick,
  label,
  value,
  logoUrl,
}: {
  active: boolean
  tabIndex: 0 | -1
  onClick: () => void
  label: string
  value?: string
  logoUrl?: string | null
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={tabIndex}
      onClick={onClick}
      className={cn(
        "motion-base relative isolate inline-flex h-11 shrink-0 snap-start items-center justify-center gap-2 rounded-full px-3 py-2 before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-1 before:rounded-full before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:h-8 md:gap-1.5 md:px-2.5 md:py-1 md:before:hidden [&>*]:relative [&>*]:z-10",
        active
          ? "text-primary before:bg-primary/15 md:bg-primary/15"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {logoUrl ? (
        <span className="relative size-5 shrink-0 overflow-hidden rounded-full bg-muted">
          <Image src={logoUrl} alt="" fill className="object-contain" sizes="20px" />
        </span>
      ) : (
        <span
          aria-hidden
          className={cn("size-2 shrink-0 rounded-full", active ? "bg-primary" : "bg-muted-foreground/40")}
        />
      )}
      <span className="whitespace-nowrap text-body-sm font-medium">{label}</span>
      {value && <span className="whitespace-nowrap text-price">{value}</span>}
    </button>
  )
}
