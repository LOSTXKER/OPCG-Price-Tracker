"use client";

import { useEffect, useSyncExternalStore } from "react";

import { apiGet } from "@/lib/api/client";
import { createSharedResource } from "@/lib/api/shared-resource";
import {
  DEFAULT_RANK_TIERS,
  RankTiersSchema,
  type RankTier,
} from "@/lib/honey/rank-tiers";

/**
 * Shared cache for the admin-configurable rank ladder — one request across
 * the many components that need the tier list (rank card, popover, header
 * avatar, mock preview, etc.). Falls back to `DEFAULT_RANK_TIERS` when the
 * endpoint fails or returns an unexpected shape.
 *
 * `invalidateRankTiers()` is exported so the admin editor can force a
 * refresh after saving.
 */
const resource = createSharedResource<RankTier[]>(async () => {
  try {
    const data = await apiGet<{ tiers?: unknown }>("/api/honey/ranks");
    const parsed = RankTiersSchema.safeParse(data?.tiers);
    return parsed.success ? parsed.data : DEFAULT_RANK_TIERS;
  } catch {
    return DEFAULT_RANK_TIERS;
  }
});

export function invalidateRankTiers() {
  resource.invalidate();
}

const getServerSnapshot = () => null;

export function useRankTiers(): { tiers: RankTier[]; loaded: boolean } {
  const tiers = useSyncExternalStore(resource.subscribe, resource.get, getServerSnapshot);

  useEffect(() => {
    resource.ensure();
  }, []);

  return { tiers: tiers ?? DEFAULT_RANK_TIERS, loaded: tiers !== null };
}
