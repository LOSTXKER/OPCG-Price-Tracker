"use client"

import Image from "next/image"

import { getGameConfig, getGameAccentTint } from "@/lib/game-config"
import { cn } from "@/lib/utils"

type GameIdentity = {
  slug: string
  name?: string | null
  nameEn?: string | null
  logoUrl?: string | null
}

/**
 * Shared game identity. The default remains the compact round crest used by
 * grouped data. `selector` is the square logo shown before a visible game
 * name; it falls back to the registered config so legacy rows need no backfill.
 */
export function GameCrest({
  game,
  size = 20,
  variant = "crest",
  decorative = false,
  className,
}: {
  game: GameIdentity | null
  size?: number
  variant?: "crest" | "selector"
  decorative?: boolean
  className?: string
}) {
  if (!game) return null
  const config = getGameConfig(game.slug)
  const label = config?.nameEn ?? game.nameEn ?? game.name ?? game.slug

  if (variant === "selector") {
    const logoUrl = game.logoUrl ?? config?.logoUrl

    if (logoUrl) {
      return (
        <span
          data-slot="game-logo"
          data-game={game.slug}
          className={cn(
            "relative inline-block shrink-0 overflow-hidden rounded-md bg-white ring-1 ring-black/10 dark:ring-white/15",
            className,
          )}
          style={{ width: size, height: size }}
        >
          <Image
            src={logoUrl}
            alt={decorative ? "" : label}
            fill
            className="select-none object-contain"
            sizes={`${size}px`}
          />
        </span>
      )
    }

    return (
      <span
        data-slot="game-logo-fallback"
        aria-hidden={decorative || undefined}
        className={cn(
          "shrink-0 rounded-md",
          className,
        )}
        style={{
          width: size,
          height: size,
          background: `color-mix(in srgb, ${getGameAccentTint(game.slug)} 20%, transparent)`,
          boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${getGameAccentTint(game.slug)} 60%, transparent)`,
        }}
      />
    )
  }

  if (game.logoUrl) {
    return (
      <span
        className={cn("relative shrink-0 overflow-hidden rounded-full bg-muted", className)}
        style={{ width: size, height: size }}
      >
        <Image src={game.logoUrl} alt={decorative ? "" : label} fill className="object-contain" sizes={`${size}px`} />
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
