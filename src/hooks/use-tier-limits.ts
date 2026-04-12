import { TIER_LIMITS } from "@/lib/tier";
import { useSettings } from "./use-settings";

type TierKey = "FREE" | "PRO" | "PRO_PLUS";

function toTierKey(tier: string): TierKey {
  if (tier === "PRO_PLUS" || tier === "LIFETIME_PRO_PLUS") return "PRO_PLUS";
  if (tier === "PRO" || tier === "LIFETIME_PRO") return "PRO";
  return "FREE";
}

export type TierLimitsData = (typeof TIER_LIMITS)[TierKey];

export function useTierLimits() {
  const { settings, loaded } = useSettings();
  const tier = toTierKey(settings?.tier ?? "FREE");
  const limits = TIER_LIMITS[tier];
  return { tier, limits, loaded };
}
