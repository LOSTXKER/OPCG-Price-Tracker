"use client";

import { useEffect, useState } from "react";
import type { MarketplaceFeeOverrides } from "@/lib/billing";

/**
 * Public marketplace-fee overrides keyed by tier. Returned from
 * `/api/billing/fees` and used by `/pricing` + `/settings/subscription` so
 * admin-edited fees flow into user-facing pricing tables without a redeploy.
 *
 * Module-level cache mirrors `use-settings.ts` — one fetch per browser tab.
 */
let _cache: MarketplaceFeeOverrides | null = null;
let _promise: Promise<MarketplaceFeeOverrides | null> | null = null;
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

function doFetch(): Promise<MarketplaceFeeOverrides | null> {
  if (_promise) return _promise;
  _promise = fetch("/api/billing/fees")
    .then((r) => (r.ok ? r.json() : null))
    .then((json: { data?: MarketplaceFeeOverrides } | null) => {
      _cache = json?.data ?? null;
      _promise = null;
      notify();
      return _cache;
    })
    .catch(() => {
      _promise = null;
      return null;
    });
  return _promise;
}

export function useMarketplaceFees(): MarketplaceFeeOverrides | undefined {
  const [fees, setFees] = useState<MarketplaceFeeOverrides | null>(_cache);

  useEffect(() => {
    const sync = () => setFees(_cache);
    _listeners.add(sync);
    if (!_cache && !_promise) void doFetch();
    return () => {
      _listeners.delete(sync);
    };
  }, []);

  return fees ?? undefined;
}
