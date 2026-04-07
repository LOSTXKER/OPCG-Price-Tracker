import { useEffect, useState } from "react";
import { TIER_LIMITS } from "@/lib/tier";

type TierKey = "FREE" | "PRO" | "PRO_PLUS";

function toTierKey(tier: string): TierKey {
  if (tier === "PRO_PLUS" || tier === "LIFETIME_PRO_PLUS") return "PRO_PLUS";
  if (tier === "PRO" || tier === "LIFETIME_PRO") return "PRO";
  return "FREE";
}

export type TierLimitsData = (typeof TIER_LIMITS)[TierKey];

export function useTierLimits() {
  const [tier, setTier] = useState<TierKey>("FREE");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setTier(toTierKey(data.tier ?? "FREE"));
        setLoaded(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const limits = TIER_LIMITS[tier];

  return { tier, limits, loaded };
}
