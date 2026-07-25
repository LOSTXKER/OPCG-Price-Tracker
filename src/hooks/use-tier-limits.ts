import { effectiveTier, getLimits, type TierLimits } from "@/lib/billing";
import type { UserTier } from "@/generated/prisma/client";
import { useSettings } from "./use-settings";

export type TierLimitsData = TierLimits;

/**
 * Resolve plan limits for the currently signed-in user, derived from
 * `getLimits(tier)` so Lifetime tiers map to their paid equivalents.
 *
 * `tier` and `limits` reflect expiration immediately, matching API gates.
 * `rawTier` remains available when a caller needs to distinguish lifetime
 * purchases from subscriptions.
 */
export function useTierLimits() {
  const { settings, loaded } = useSettings();
  const rawTier = (settings?.tier ?? "FREE") as UserTier;
  const expiresAt = settings?.tierExpiresAt
    ? new Date(settings.tierExpiresAt)
    : null;
  const tier = effectiveTier(rawTier, expiresAt);
  const limits = getLimits(tier);
  return { tier, rawTier, limits, loaded };
}
