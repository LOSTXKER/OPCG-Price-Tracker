"use client"

import Image from "next/image"
import Link from "next/link"

import { getAllGameConfigs } from "@/lib/game-config"
import { ALL_GAMES } from "@/lib/game/constants"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

export type GameChip = {
  slug: string
  /** Short label, e.g. "OPCG". */
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

/**
 * The "one collection, every game" filter for a unified personal surface
 * (portfolio / watchlist / alerts). A filter that can't partition is clutter, so
 * the real filter is DATA-DRIVEN and progressively disclosed: the caller passes
 * only the games the user actually has data in, and the filter chips render only
 * once at least two of them exist. Below that, the rail still appears when there
 * are coming-soon games — as a pure teaser, never a dead filter chip.
 *
 * Visual vocabulary is byte-identical to SegmentedControl's pill: frameless
 * `bg-muted/50` track, active = `bg-primary/15 text-primary` (one honey fill,
 * no border/extra dot — keeps honey <5%).
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

  // Real filtering needs ≥2 games; below that there's nothing to partition. Still
  // render the rail when a coming-soon game exists, to tease it — but never tease
  // a game that already has real data (it's a live filter chip now, not "soon").
  const showFilter = games.length >= 2
  const teasers = COMING_SOON_GAMES.filter((g) => !games.some((x) => x.slug === g.slug))
  if (!showFilter && teasers.length === 0) return null

  return (
    <div className="no-sb -mx-0.5 flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-muted/50 p-0.5">
      {showFilter && (
        <div role="radiogroup" aria-label={t(lang, "filterByGame")} className="contents">
          <Seg active={activeGame === ALL_GAMES} onClick={() => onSelect(ALL_GAMES)} label={t(lang, "allGames")} value={allValue} />
          {games.map((g) => (
            <Seg
              key={g.slug}
              active={activeGame === g.slug}
              onClick={() => onSelect(g.slug)}
              label={g.label}
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
          label={g.shortName ?? g.nameEn}
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
      className="motion-base inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full px-3 py-2 text-muted-foreground/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
  onClick,
  label,
  value,
  logoUrl,
}: {
  active: boolean
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
      onClick={onClick}
      className={cn(
        "motion-base inline-flex min-h-11 shrink-0 snap-start items-center justify-center gap-2 rounded-full px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
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
