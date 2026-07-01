"use client"

import { useEffect } from "react"

import { ALL_GAMES } from "@/lib/game/constants"

/**
 * Keep a MINE page's game filter honest: reset it to "all" the moment the active
 * game leaves the data — a holding/alert removed, or the chip rail dropping below
 * two games and self-hiding. Without this, a stale filter strands the user on an
 * empty list with no visible control to clear it.
 *
 * Each MINE surface (portfolio / watchlist / alerts) owns its OWN filter — plain
 * local state, session-only, deliberately NOT shared through a global store. A
 * filter set on Watchlist must never silently narrow Alerts (that was the
 * cross-page dead-end this replaces). `setGameFilter` from `useState` is stable,
 * so the effect only fires when `stranded` actually flips.
 */
export function useGameFilterReset(
  gameFilter: string,
  availableGames: string[],
  setGameFilter: (game: string) => void,
) {
  const stranded = gameFilter !== ALL_GAMES && !availableGames.includes(gameFilter)
  useEffect(() => {
    if (stranded) setGameFilter(ALL_GAMES)
  }, [stranded, setGameFilter])
}
