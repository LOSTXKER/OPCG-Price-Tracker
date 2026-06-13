"use client";

import { useEffect, useSyncExternalStore } from "react";

import { apiGet, apiTry } from "@/lib/api/client";
import { createSharedResource } from "@/lib/api/shared-resource";

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

const resource = createSharedResource<PublicConfig>(async () => {
  const json = await apiTry(apiGet<{ data?: Partial<PublicConfig> }>("/api/config/public"));
  if (!json) return null;
  return { ...DEFAULTS, ...(json.data ?? {}) };
});

const getServerSnapshot = () => null;

/**
 * Read the public admin config (currently just `marketplaceEnabled`) on the
 * client. Returns the defaults synchronously on first render and re-renders
 * once the fetch completes, so consumers can use `config.marketplaceEnabled`
 * directly without null-checking.
 */
export function usePublicConfig(): { config: PublicConfig; loaded: boolean } {
  const config = useSyncExternalStore(resource.subscribe, resource.get, getServerSnapshot);

  useEffect(() => {
    resource.ensure();
  }, []);

  return {
    config: config ?? DEFAULTS,
    loaded: config !== null,
  };
}
