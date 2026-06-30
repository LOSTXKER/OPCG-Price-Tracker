"use client"

import { GameFilterChips } from "@/components/shared/game-filter-chips"
import { useUIStore } from "@/stores/ui-store"
import { formatDisplayValue, jpyToDisplayValue } from "@/lib/utils/currency"
import type { GameBreakdown } from "@/lib/types/portfolio"

/**
 * Portfolio's "every game" chip rail — formats per-game holdings VALUE and hands
 * it to the shared <GameFilterChips>. One unified portfolio, filtered in-view.
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

  const bySlug = new Map(breakdown.filter((b) => b.game).map((b) => [b.game!.slug, b]))
  const allTotal = breakdown.reduce((s, b) => s + b.valueJpy, 0)
  const money = (jpy: number) =>
    hideBalance ? "••••" : formatDisplayValue(jpyToDisplayValue(jpy, currency), currency)

  return (
    <GameFilterChips
      activeGame={activeGame}
      onSelect={onSelect}
      allValue={money(allTotal)}
      valueFor={(slug) => money(bySlug.get(slug)?.valueJpy ?? 0)}
      logoFor={(slug) => bySlug.get(slug)?.game?.logoUrl ?? null}
    />
  )
}
