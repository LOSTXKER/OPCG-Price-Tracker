import { getLimits, type TierLimits } from "@/lib/billing";
import type { UserTier } from "@/generated/prisma/client";
import { useSettings } from "./use-settings";

export type TierLimitsData = TierLimits;

/**
 * Resolve plan limits for the currently signed-in user, derived from
 * `getLimits(tier)` so Lifetime tiers map to their paid equivalents.
 *
 * Returns the raw `tier` string from settings (so callers can branch on
 * Lifetime vs subscription) plus the resolved limit row.
 */
export function useTierLimits() {
  const { settings, loaded } = useSettings();
  const rawTier = (settings?.tier ?? "FREE") as UserTier;
  const limits = getLimits(rawTier);
  return { tier: rawTier, limits, loaded };
}
