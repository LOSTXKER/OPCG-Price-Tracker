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
 * "GAME'S" features — a game's catalog / market / tools. These live under a game
 * namespace (`/[game]/<seg>/...`) and the GameSwitcher reroutes between games.
 * A set belongs to one game; deck rules / pull-rates differ per TCG; search keeps
 * its namespace but honours the `/all/...` aggregate prefix (VISION §5.7).
 * Account / system / content routes (settings, profile, honey, admin, auth,
 * blog, …) are flat by construction and never appear here.
 */
export const GAME_SCOPED_SEGMENTS: ReadonlySet<string> = new Set([
  "cards",
  "sets",
  "market-overview",
  "search",
  "trending",
  "compare",
  "decks",
  "drop-calculator",
  "deck-calculator",
])

/**
 * "MINE" features — the user's own collections. One unified list PER USER across
 * every game, filtered in-view by game chips (never split per game). A
 * `/[game]/<feature>` request for one of these is redirected back to the flat
 * `/<feature>`, so `my stuff` always lives at one canonical URL. Game is derived
 * per item via `card.set.game`. (Owner-approved 2026-06-30 "ของฉันรวมทุกเกม";
 * amends VISION §5.7, which previously named only Portfolio + Search.)
 */
export const GAME_AGNOSTIC_FEATURES: ReadonlySet<string> = new Set([
  "portfolio",
  "watchlist",
  "saved",
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
