/**
 * Server-side honey level helpers. The actual ladder is admin-editable
 * via /admin/honey/ranks and lives in `SystemConfig` — see
 * `./rank-tiers-server.ts` for the loader and `./rank-tiers.ts` for
 * the schemas, defaults, and pure helpers.
 *
 * `getHoneyLevel` and `checkLevelUp` are now async because they read
 * from the rank-tier config (with an in-process TTL cache, so the
 * actual DB hit is rare).
 */

import {
  DEFAULT_RANK_TIERS,
  checkLevelUpFromTiers,
  getHoneyLevelFromTiers,
  type HoneyLevel,
} from "./rank-tiers";
import { getRankTiers } from "./rank-tiers-server";

export type { HoneyLevel };

/**
 * Default ladder lookups, derived from `DEFAULT_RANK_TIERS`. Kept for
 * back-compat with tests and any callers that want the *baseline*
 * thresholds without a DB round-trip. New code should prefer reading
 * the live tiers via `getRankTiers()` so admin overrides take effect.
 */
export const LEVEL_THRESHOLD: Record<number, number> = Object.fromEntries(
  DEFAULT_RANK_TIERS.map((t) => [t.level, t.threshold]),
);

export const LEVEL_UP_BONUS: Record<number, number> = Object.fromEntries(
  DEFAULT_RANK_TIERS.filter((t) => t.levelUpBonus > 0).map((t) => [
    t.level,
    t.levelUpBonus,
  ]),
);

export async function getHoneyLevel(lifetimeEarned: number): Promise<HoneyLevel> {
  const tiers = await getRankTiers();
  return getHoneyLevelFromTiers(lifetimeEarned, tiers);
}

/**
 * Returns the level-up bonus if `newLifetime` crossed a threshold that
 * `oldLifetime` hadn't reached yet. Returns null if no level-up
 * occurred. Bonus amount is sourced from the destination tier's
 * configured `levelUpBonus`.
 */
export async function checkLevelUp(
  oldLifetime: number,
  newLifetime: number,
): Promise<{ level: number; label: string; bonus: number } | null> {
  const tiers = await getRankTiers();
  return checkLevelUpFromTiers(oldLifetime, newLifetime, tiers);
}
