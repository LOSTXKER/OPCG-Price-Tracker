"use client"

import { GameFilterChips, type GameChip } from "@/components/shared/game-filter-chips"
import { getGameConfig } from "@/lib/game-config"
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
    .filter((b) => b.game && b.valueJpy > 0)
    .map((b) => ({
      slug: b.game!.slug,
      label: getGameConfig(b.game!.slug)?.shortName ?? b.game!.nameEn ?? b.game!.slug.toUpperCase(),
      value: money(b.valueJpy),
      logoUrl: b.game!.logoUrl,
    }))

  return <GameFilterChips games={games} activeGame={activeGame} onSelect={onSelect} />
}
