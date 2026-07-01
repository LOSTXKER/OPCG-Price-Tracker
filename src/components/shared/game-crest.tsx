"use client"

import Image from "next/image"

import { getGameConfig, getGameAccentTint } from "@/lib/game-config"
import type { GameRef } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"

/**
 * Small round game marker — logo if the game has one, else a thin tinted ring.
 * Each instance carries ITS OWN game's tint inline (never the active shell's),
 * so a list of crests reads as distinct games. Used by the portfolio per-game
 * breakdown, alert group headers, and the switcher rows.
 */
export function GameCrest({
  game,
  size = 20,
  className,
}: {
  game: GameRef | null
  size?: number
  className?: string
}) {
  if (!game) return null
  const label = getGameConfig(game.slug)?.shortName ?? game.nameEn ?? game.slug
  if (game.logoUrl) {
    return (
      <span
        className={cn("relative shrink-0 overflow-hidden rounded-full bg-muted", className)}
        style={{ width: size, height: size }}
      >
        <Image src={game.logoUrl} alt={label} fill className="object-contain" sizes={`${size}px`} />
      </span>
    )
  }
  const tint = getGameAccentTint(game.slug)
  return (
    <span
      aria-hidden
      className={cn("shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: `color-mix(in srgb, ${tint} 20%, transparent)`,
        boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${tint} 60%, transparent)`,
      }}
    />
  )
}
