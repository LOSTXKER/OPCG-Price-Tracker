import type { Prisma } from "@/generated/prisma/client"
import { ALL_GAMES, DEFAULT_GAME } from "@/lib/game/constants"

/**
 * Scope card sets to a game while legacy OPCG rows are still unlinked.
 * New games must have an explicit relation; only the default game may adopt
 * null gameId rows until the planned backfill makes the column required.
 */
export function buildCardSetScope(
  game: string | undefined,
  setCode?: string,
): Prisma.CardSetWhereInput {
  const where: Prisma.CardSetWhereInput = {}

  if (setCode) where.code = setCode
  if (game && game !== ALL_GAMES) {
    where.OR = [
      { game: { is: { slug: game } } },
      ...(game === DEFAULT_GAME ? [{ gameId: null }] : []),
    ]
  }

  return where
}
