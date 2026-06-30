import { getGameSlugs } from "@/lib/game-config"

/** Cookie persisting the visitor's active game (mirrors the `currentGame` store
 *  + the `kuma-lang` language cookie). Read by middleware to resolve the game
 *  prefix for un-prefixed legacy URLs. */
export const GAME_COOKIE = "kuma-game"

/** Request header middleware injects on a game-prefixed rewrite so server
 *  components resolve the game of THIS request without a route param — exactly
 *  how `x-language` / the language resolver work. */
export const GAME_HEADER = "x-game"

/** Thai-market default game for first-time visitors with no game in URL/cookie. */
export const DEFAULT_GAME = "opcg"

/** Aggregate pseudo-game — cross-game views. Only Portfolio + Search support it
 *  (VISION §5.7); other features stay single-game. */
export const ALL_GAMES = "all"

export const GAME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * First path segments that live under a game namespace (`/[game]/<seg>/...`).
 * Browse / data / collection features only — account, system, content and chat
 * routes (settings, profile, honey, admin, auth, blog, …) stay flat with no
 * game prefix. Keep this the single source of truth for what gets namespaced.
 */
export const GAME_SCOPED_SEGMENTS: ReadonlySet<string> = new Set([
  "portfolio",
  "cards",
  "sets",
  "market-overview",
  "search",
  "trending",
  "compare",
  "watchlist",
  "decks",
  "drop-calculator",
  "deck-calculator",
])

const VALID_PREFIXES: ReadonlySet<string> = new Set([...getGameSlugs(), ALL_GAMES])

/** True when `seg` is a usable game URL prefix (`opcg` / `pokemon` / `all`). */
export function isGamePrefix(seg: string | undefined | null): seg is string {
  return seg != null && VALID_PREFIXES.has(seg)
}

/** True when `seg` is a feature that belongs under a game namespace. */
export function isGameScopedSegment(seg: string | undefined | null): seg is string {
  return seg != null && GAME_SCOPED_SEGMENTS.has(seg)
}
