import type { HoneyActionType } from "@/generated/prisma/client";

/**
 * Frozen `HoneyActionType` values that exist solely so historical
 * `HoneyTransaction` rows still validate against the Prisma enum.
 *
 * No new code should emit any of these values. The runtime guard in
 * `assertNotDeprecatedHoneyActionType` is wired into `grantHoney` and
 * makes a write attempt fail loudly — a defensive layer in case the
 * Prisma typesystem is bypassed via a string cast.
 *
 * See `doc/honey-action-type-migration.md` for the planned migration
 * to a free-form `legacyType` column so the enum can shrink to the
 * actively used set.
 */
export const DEPRECATED_HONEY_ACTION_TYPES = new Set<HoneyActionType>([
  "PORTFOLIO_ADD",
  "GIFT_SEND",
  "GIFT_RECEIVE",
  "LUCKY_DRAW",
  "FIRST_PURCHASE",
  "SHARE",
  "AFFILIATE",
]);

/**
 * Throws if `type` is one of the deprecated values. Call this from
 * write-side helpers (grantHoney/spendHoney/earnHoneyDirect) to keep
 * legacy values out of the live ledger.
 */
export function assertNotDeprecatedHoneyActionType(type: HoneyActionType): void {
  if (DEPRECATED_HONEY_ACTION_TYPES.has(type)) {
    throw new Error(
      `HoneyActionType "${type}" is deprecated and may not be used for new writes. ` +
        `See src/lib/honey/deprecated.ts and doc/honey-action-type-migration.md.`,
    );
  }
}
