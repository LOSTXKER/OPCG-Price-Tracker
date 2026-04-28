"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_RANK_TIERS,
  RankTiersSchema,
  type RankTier,
} from "@/lib/honey/rank-tiers";

/**
 * Module-level cache for the admin-configurable rank ladder. Keeps a
 * single in-flight request open across the many components that need
 * the tier list (rank card, popover, header avatar, mock preview,
 * etc.) and re-uses the resolved value for the rest of the session.
 *
 * `invalidateRankTiers()` is exported so the admin editor can force a
 * refresh after saving.
 */

let cache: RankTier[] | null = null;
let inflight: Promise<RankTier[]> | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

function fetchTiers(): Promise<RankTier[]> {
  if (inflight) return inflight;
  inflight = fetch("/api/honey/ranks")
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { tiers?: unknown } | null) => {
      const parsed = RankTiersSchema.safeParse(data?.tiers);
      const tiers = parsed.success ? parsed.data : DEFAULT_RANK_TIERS;
      cache = tiers;
      inflight = null;
      notify();
      return tiers;
    })
    .catch(() => {
      cache = DEFAULT_RANK_TIERS;
      inflight = null;
      notify();
      return DEFAULT_RANK_TIERS;
    });
  return inflight;
}

export function invalidateRankTiers() {
  cache = null;
  inflight = null;
}

export function useRankTiers(): { tiers: RankTier[]; loaded: boolean } {
  const [tiers, setTiers] = useState<RankTier[]>(cache ?? DEFAULT_RANK_TIERS);
  const [loaded, setLoaded] = useState(cache !== null);

  useEffect(() => {
    const sync = () => {
      if (cache) {
        setTiers(cache);
        setLoaded(true);
      }
    };
    listeners.add(sync);
    if (!cache && !inflight) void fetchTiers();
    else sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return { tiers, loaded };
}
