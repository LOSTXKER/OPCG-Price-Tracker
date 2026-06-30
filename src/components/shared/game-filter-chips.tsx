"use client"

import Image from "next/image"

import { ALL_GAMES } from "@/lib/game/constants"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

export type GameChip = {
  slug: string
  /** Short label, e.g. "OPCG". */
  label: string
  /** Pre-formatted per-game value (money or unit-labelled count). */
  value: string
  logoUrl?: string | null
}

/**
 * The "one collection, every game" filter for a unified personal surface
 * (portfolio / watchlist / alerts). A filter that can't partition is clutter, so
 * the rail is DATA-DRIVEN and progressively disclosed: the caller passes only the
 * games the user actually has data in, and the rail renders nothing until at
 * least two of them exist. Multi-TCG ambition is signalled by the global
 * game-switcher (coming-soon games live there), never by a dead chip here.
 *
 * Visual vocabulary is byte-identical to SegmentedControl's pill: frameless
 * `bg-muted/50` track, active = `bg-primary/15 text-primary` (one honey fill,
 * no border/extra dot — keeps honey <5%).
 */
export function GameFilterChips({
  games,
  activeGame,
  onSelect,
}: {
  games: GameChip[]
  activeGame: string
  onSelect: (game: string) => void
}) {
  const lang = useUIStore((s) => s.language)

  // Nothing to filter with fewer than two games — don't paint a fake control.
  if (games.length < 2) return null

  return (
    <div
      role="radiogroup"
      aria-label={t(lang, "filterByGame")}
      className="no-sb -mx-0.5 flex items-center gap-0.5 overflow-x-auto rounded-full bg-muted/50 p-0.5"
    >
      <Seg active={activeGame === ALL_GAMES} onClick={() => onSelect(ALL_GAMES)} label={t(lang, "allGames")} />
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
