"use client"

import { useEffect } from "react"

import { ALL_GAMES } from "@/lib/game/constants"

/** @internal Pure decision kept separate for regression coverage. */
export function shouldResetGameFilter(gameFilter: string, availableGames: string[]) {
  if (gameFilter === ALL_GAMES) return false
  return !availableGames.includes(gameFilter)
}

/**
 * Keep a MINE page's game filter honest: reset it to "all" the moment the active
 * game leaves the data. The control remains visible with one launch-ready game,
 * so a valid single-game scope must survive data refreshes.
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
  const stranded = shouldResetGameFilter(gameFilter, availableGames)
  useEffect(() => {
    if (stranded) setGameFilter(ALL_GAMES)
  }, [stranded, setGameFilter])
}
