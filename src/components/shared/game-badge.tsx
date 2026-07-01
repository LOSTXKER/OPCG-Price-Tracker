"use client"

import Image from "next/image"

import { getGameConfig } from "@/lib/game-config"
import type { GameRef } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"

/**
 * Tiny per-row game tag for the unified MINE surfaces (portfolio / watchlist /
 * alerts). Render it only when a list spans ≥2 games — a lone-game badge is
 * redundant noise (Collectr got dinged for exactly that). Callers gate on their
 * own `availableGames.length >= 2`; this component just draws the tag.
 */
export function GameBadge({ game, className }: { game: GameRef | null; className?: string }) {
  if (!game) return null
  const label = getGameConfig(game.slug)?.shortName ?? game.nameEn ?? game.slug.toUpperCase()
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-micro font-medium text-muted-foreground",
        className,
      )}
    >
      {game.logoUrl ? (
        <span className="relative size-3 shrink-0 overflow-hidden rounded-full">
          <Image src={game.logoUrl} alt="" fill className="object-contain" sizes="12px" />
        </span>
      ) : (
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary/60" />
      )}
      {label}
    </span>
  )
}
