import { cookies, headers } from "next/headers"

import { getGameConfig, type GameConfig } from "@/lib/game-config"

import { ALL_GAMES, DEFAULT_GAME, GAME_COOKIE, GAME_HEADER } from "./constants"

/**
 * Resolve the active game for SERVER components / route handlers. Reads the
 * `x-game` header middleware injects for the current request (from the URL's
 * game prefix), falling back to the persisted cookie, then the default. Mirrors
 * `getServerLanguage`. Returns the slug — may be `"all"` for the aggregate.
 *
 * Reading headers()/cookies() opts the route into dynamic rendering; that's the
 * accepted trade-off for per-request game scope (same as language).
 */
export async function getServerGame(): Promise<string> {
  const h = await headers()
  const fromHeader = h.get(GAME_HEADER)
  if (fromHeader) return fromHeader

  const store = await cookies()
  return store.get(GAME_COOKIE)?.value ?? DEFAULT_GAME
}

/**
 * The resolved GameConfig for the current request, or `undefined` for the
 * `"all"` aggregate (and unknown slugs). Use when a page needs deck rules /
 * rarities / card-face fields, not just the slug.
 */
export async function getServerGameConfig(): Promise<GameConfig | undefined> {
  const slug = await getServerGame()
  if (slug === ALL_GAMES) return undefined
  return getGameConfig(slug)
}
