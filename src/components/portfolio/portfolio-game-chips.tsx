"use client"

import { GameFilterChips, type GameChip } from "@/components/shared/game-filter-chips"
import { getGameConfig } from "@/lib/game-config"
import { DEFAULT_GAME } from "@/lib/game/constants"
import { useUIStore } from "@/stores/ui-store"
import { formatDisplayValue, jpyToDisplayValue } from "@/lib/utils/currency"
import { MASKED } from "@/lib/constants/ui"
import type { GameBreakdown } from "@/lib/types/portfolio"

/**
 * Portfolio's game filter — builds one chip per game the user actually holds
 * (value > 0), formatted as money, and hands it to the shared rail. The rail
 * self-hides below two games, so a single-game portfolio shows no chips at all.
 */
export function PortfolioGameChips({
  breakdown,
  activeGame,
  onSelect,
  hideBalance = false,
}: {
  breakdown: GameBreakdown[]
  activeGame: string
  onSelect: (game: string) => void
  hideBalance?: boolean
}) {
  const currency = useUIStore((s) => s.currency)
  const money = (jpy: number) =>
    hideBalance ? MASKED : formatDisplayValue(jpyToDisplayValue(jpy, currency), currency)

  const games: GameChip[] = breakdown
    .filter((b) => b.valueJpy > 0)
    .map((b) => {
      // Fall back to the default game when a holding's set has no game link yet
      // (not every set is backfilled) — mirrors watchlist/alerts so OPCG still
      // produces a chip instead of vanishing behind a strict `b.game` check.
      const slug = b.game?.slug ?? DEFAULT_GAME
      return {
        slug,
        label: getGameConfig(slug)?.shortName ?? b.game?.nameEn ?? slug.toUpperCase(),
        value: money(b.valueJpy),
        logoUrl: b.game?.logoUrl ?? null,
      }
    })

  return <GameFilterChips games={games} activeGame={activeGame} onSelect={onSelect} />
}
