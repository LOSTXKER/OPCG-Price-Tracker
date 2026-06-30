"use client"

import Image from "next/image"

import { getAllGameConfigs } from "@/lib/game-config"
import { ALL_GAMES } from "@/lib/game/constants"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

const GAMES = getAllGameConfigs()

/**
 * The "one collection, every game" rail (VISION §5.7 / the MINE family). A
 * horizontal row of chips — "All games" + one per registered game (logo/dot +
 * its value) + coming-soon games shown disabled — under the hero of any unified
 * personal surface (portfolio, watchlist, …). Tapping a chip filters the whole
 * view to that game; the collection is never split into per-game books. The
 * caller formats the values (money for portfolio, counts for watchlist).
 */
export function GameFilterChips({
  activeGame,
  onSelect,
  allValue,
  valueFor,
  logoFor,
}: {
  activeGame: string
  onSelect: (game: string) => void
  /** Formatted aggregate on the "All games" chip. */
  allValue: string
  /** Formatted per-game value (e.g. "฿42,300" or "12 ใบ"). */
  valueFor: (slug: string) => string
  /** Optional per-game logo URL. */
  logoFor?: (slug: string) => string | null
}) {
  const lang = useUIStore((s) => s.language)

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Chip
        active={activeGame === ALL_GAMES}
        onClick={() => onSelect(ALL_GAMES)}
        label={t(lang, "allGames")}
        value={allValue}
        dot
      />

      {GAMES.map((g) => {
        const soon = Boolean(g.comingSoon)
        return (
          <Chip
            key={g.slug}
            active={activeGame === g.slug}
            disabled={soon}
            onClick={() => {
              if (!soon) onSelect(g.slug)
            }}
            logoUrl={logoFor?.(g.slug) ?? null}
            label={g.shortName ?? g.nameEn ?? g.slug.toUpperCase()}
            value={soon ? t(lang, "comingSoon") : valueFor(g.slug)}
            muted={soon}
          />
        )
      })}
    </div>
  )
}

function Chip({
  active,
  disabled,
  onClick,
  label,
  value,
  logoUrl,
  dot,
  muted,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  label: string
  value: string
  logoUrl?: string | null
  dot?: boolean
  muted?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "ease-chrome inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary/30 bg-primary/10"
          : disabled
            ? "cursor-not-allowed border-[var(--p-hair)] opacity-60"
            : "border-[var(--p-hair)] hover:bg-muted/50",
      )}
    >
      {logoUrl ? (
        <span className="relative size-5 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-[var(--p-hair)]">
          <Image src={logoUrl} alt="" fill className="object-contain" sizes="20px" />
        </span>
      ) : (
        (dot || !muted) && (
          <span
            aria-hidden
            className={cn("size-2 shrink-0 rounded-full", active ? "bg-primary" : "bg-muted-foreground/40")}
          />
        )
      )}
      <span
        className={cn(
          "whitespace-nowrap text-body-sm font-semibold",
          active ? "text-primary" : muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {label}
      </span>
      <span className={cn("whitespace-nowrap font-price text-meta tabular-nums", muted && "text-muted-foreground/60")}>
        {value}
      </span>
    </button>
  )
}
