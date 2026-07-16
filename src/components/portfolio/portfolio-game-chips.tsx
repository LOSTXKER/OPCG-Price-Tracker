"use client"

import { GameFilterChips, type GameChip } from "@/components/shared/game-filter-chips"
import { getGameConfig } from "@/lib/game-config"
import { DEFAULT_GAME } from "@/lib/game/constants"
import type { GameBreakdown } from "@/lib/types/portfolio"

/**
 * Portfolio's game filter — one chip per game the user actually holds
 * (count > 0). Chips are NAME-ONLY: the per-game money lives in exactly one
 * place (the "by game" breakdown panel), so the rail stays a clean control
 * instead of a second stats row. The rail self-hides below two games.
 */
export function PortfolioGameChips({
  breakdown,
  activeGame,
  onSelect,
}: {
  breakdown: GameBreakdown[]
  activeGame: string
  onSelect: (game: string) => void
}) {
  const games: GameChip[] = breakdown
    .filter((b) => b.count > 0)
    .map((b) => {
      // Fall back to the default game when a holding's set has no game link yet
      // (not every set is backfilled) — mirrors watchlist/alerts so OPCG still
      // produces a chip instead of vanishing behind a strict `b.game` check.
      const slug = b.game?.slug ?? DEFAULT_GAME
      return {
        slug,
        label: getGameConfig(slug)?.shortName ?? b.game?.nameEn ?? slug.toUpperCase(),
        logoUrl: b.game?.logoUrl ?? null,
      }
    })

  return <GameFilterChips games={games} activeGame={activeGame} onSelect={onSelect} />
}
