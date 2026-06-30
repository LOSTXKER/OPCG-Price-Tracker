"use client"

import { usePathname } from "next/navigation"

import { DEFAULT_GAME, isGamePrefix } from "@/lib/game/constants"
import { useUIStore } from "@/stores/ui-store"

/**
 * The active game scope for the current page, read from the URL's `/[game]`
 * prefix (the canonical source after the middleware redirect), falling back to
 * the persisted `currentGame`, then the default. Returns a game slug or `"all"`
 * for the cross-game aggregate. Client mirror of `getServerGame()`.
 */
export function useGameScope(): string {
  const pathname = usePathname()
  const currentGame = useUIStore((s) => s.currentGame)
  const seg1 = pathname.split("/").filter(Boolean)[0]
  if (isGamePrefix(seg1)) return seg1
  return currentGame || DEFAULT_GAME
}
