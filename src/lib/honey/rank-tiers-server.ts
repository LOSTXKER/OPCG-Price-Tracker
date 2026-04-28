/**
 * Server-only loader / saver for the admin-editable rank tier ladder.
 *
 * Tiers are persisted as a single JSON value in the `SystemConfig`
 * key/value table (key: `honey.rank_tiers`). A small in-process cache
 * avoids hitting the DB on every honey grant and `/api/honey` request;
 * the cache is invalidated by `setRankTiers` and after the configured
 * TTL. With multiple instances behind a load balancer, propagation is
 * eventually consistent within `CACHE_TTL_MS`.
 */

import { prisma } from "@/lib/db";
import {
  DEFAULT_RANK_TIERS,
  RankTiersSchema,
  type RankTier,
} from "./rank-tiers";

const SYSTEM_CONFIG_KEY = "honey.rank_tiers";
const CACHE_TTL_MS = 60_000;

let cache: { tiers: RankTier[]; expiresAt: number } | null = null;

function sortTiers(tiers: RankTier[]): RankTier[] {
  return [...tiers].sort((a, b) => a.level - b.level);
}

/**
 * Returns the active tier ladder. Falls back to `DEFAULT_RANK_TIERS`
 * when the row is missing, has invalid JSON, or fails Zod validation
 * (so a corrupt admin write never bricks the honey UI).
 */
export async function getRankTiers(): Promise<RankTier[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.tiers;

  let tiers: RankTier[] = DEFAULT_RANK_TIERS;
  try {
    const row = await prisma.systemConfig.findUnique({
      where: { key: SYSTEM_CONFIG_KEY },
    });
    if (row?.value) {
      const parsed = RankTiersSchema.safeParse(JSON.parse(row.value));
      if (parsed.success) {
        tiers = sortTiers(parsed.data);
      } else {
        console.warn(
          "[honey] invalid rank tier config in SystemConfig, using defaults",
          parsed.error.issues,
        );
      }
    }
  } catch (err) {
    console.error("[honey] failed to load rank tiers, using defaults", err);
  }

  cache = { tiers, expiresAt: Date.now() + CACHE_TTL_MS };
  return tiers;
}

/**
 * Persist the tier ladder. Validates again before writing so callers
 * can pass values straight through from a request body. The local
 * cache is refreshed immediately so the saving instance sees the new
 * ladder on the next read.
 */
export async function setRankTiers(
  tiers: RankTier[],
  updatedBy: string | null,
): Promise<RankTier[]> {
  const parsed = RankTiersSchema.parse(tiers);
  const sorted = sortTiers(parsed);
  const value = JSON.stringify(sorted);

  await prisma.systemConfig.upsert({
    where: { key: SYSTEM_CONFIG_KEY },
    update: { value, updatedBy: updatedBy ?? null },
    create: { key: SYSTEM_CONFIG_KEY, value, updatedBy: updatedBy ?? null },
  });

  cache = { tiers: sorted, expiresAt: Date.now() + CACHE_TTL_MS };
  return sorted;
}

/** Force the next `getRankTiers()` call to re-read from the database. */
export function invalidateRankTiersCache(): void {
  cache = null;
}
