import { NextResponse } from "next/server";

export const cardInclude = {
  set: { select: { code: true, name: true, nameEn: true, nameTh: true } },
} as const;

/**
 * Game-aware card include — adds the owning game (via the card's set) so the
 * "MINE" collections (portfolio, watchlist, …) can group / filter holdings by
 * game with the in-view game chips. Card.gameId is still nullable, so game is
 * resolved through `set.game` (sets are backfilled to a game). Kept separate
 * from the shared `cardInclude` so the other consumers don't pay for the join.
 */
export const gameCardInclude = {
  set: {
    select: {
      code: true,
      name: true,
      nameEn: true,
      nameTh: true,
      game: { select: { slug: true, name: true, nameEn: true, logoUrl: true } },
    },
  },
} as const;

export const userPublicSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  sellerRating: true,
  sellerReviewCount: true,
} as const;

/**
 * Validates that `value` is an array of strings. Returns the string[]
 * on success, or a 400 NextResponse on failure.
 */
export function asStringArray(
  value: unknown,
  field: string
): string[] | NextResponse {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    return NextResponse.json(
      { error: `${field} must be an array of strings` },
      { status: 400 }
    );
  }
  for (const v of value) {
    if (typeof v !== "string") {
      return NextResponse.json(
        { error: `${field} must contain only strings` },
        { status: 400 }
      );
    }
  }
  return value as string[];
}
