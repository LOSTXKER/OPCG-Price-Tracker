"use client"

import Image from "next/image"

import { getGameConfig, getGameAccentTint } from "@/lib/game-config"
import { DEFAULT_GAME } from "@/lib/game/constants"
import type { GameRef } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"

/**
 * Tiny per-row game tag for the unified MINE surfaces (portfolio / watchlist /
 * alerts). Render it only when a list spans ≥2 games — a lone-game badge is
 * redundant noise. A null game folds into the default game (matching every
 * fold upstream) so un-backfilled OPCG rows still read "OPCG" instead of
 * silently dropping the tag. The fallback dot carries the game's own thin tint
 * (set inline per element, so each row reads as ITS game, not the shell's).
 */
export function GameBadge({
  game,
  className,
  size = "sm",
}: {
  game: GameRef | null
  className?: string
  size?: "sm" | "md"
}) {
  const slug = game?.slug ?? DEFAULT_GAME
  const label = getGameConfig(slug)?.shortName ?? game?.nameEn ?? slug.toUpperCase()
  const md = size === "md"
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 font-medium text-muted-foreground",
        md ? "text-micro" : "text-micro",
        className,
      )}
    >
      {game?.logoUrl ? (
        <span className={cn("relative shrink-0 overflow-hidden rounded-full", md ? "size-3.5" : "size-3")}>
          <Image src={game.logoUrl} alt="" fill className="object-contain" sizes="16px" />
        </span>
      ) : (
        <span
          aria-hidden
          className={cn("shrink-0 rounded-full", md ? "size-2" : "size-1.5")}
          style={{ background: `color-mix(in srgb, ${getGameAccentTint(slug)} 65%, transparent)` }}
        />
      )}
      {label}
    </span>
  )
}
