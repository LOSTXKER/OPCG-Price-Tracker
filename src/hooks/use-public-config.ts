"use client";

import { useEffect, useState } from "react";

/**
 * Public, unauthenticated subset of `AdminConfig` exposed to all clients via
 * `/api/config/public`. Keep this in sync with that route's response shape —
 * never widen it to include admin-only fields.
 */
export interface PublicConfig {
  marketplaceEnabled: boolean;
}

const DEFAULTS: PublicConfig = {
  // Mirrors `ADMIN_CONFIG_DEFAULTS.marketplaceEnabled` in `src/lib/admin/config.ts`.
  // Marketplace ships disabled until an admin flips it on.
  marketplaceEnabled: false,
};

let _cache: PublicConfig | null = null;
let _promise: Promise<PublicConfig | null> | null = null;
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

function doFetch(): Promise<PublicConfig | null> {
  if (_promise) return _promise;
  _promise = fetch("/api/config/public")
    .then((r) => (r.ok ? r.json() : null))
    .then((json: { data?: Partial<PublicConfig> } | null) => {
      _cache = { ...DEFAULTS, ...(json?.data ?? {}) };
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

/**
 * Read the public admin config (currently just `marketplaceEnabled`) on the
 * client. Returns the defaults synchronously on first render and re-renders
 * once the fetch completes, so consumers can use `config.marketplaceEnabled`
 * directly without null-checking.
 *
 * Module-level cache mirrors `use-marketplace-fees.ts` — one fetch per tab.
 */
export function usePublicConfig(): { config: PublicConfig; loaded: boolean } {
  const [config, setConfig] = useState<PublicConfig | null>(_cache);

  useEffect(() => {
    const sync = () => setConfig(_cache);
    _listeners.add(sync);
    if (!_cache && !_promise) void doFetch();
    return () => {
      _listeners.delete(sync);
    };
  }, []);

  return {
    config: config ?? DEFAULTS,
    loaded: config !== null,
  };
}
