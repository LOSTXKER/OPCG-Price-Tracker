"use client";

import { useEffect, useSyncExternalStore } from "react";

import { apiGet, apiTry } from "@/lib/api/client";
import { createSharedResource } from "@/lib/api/shared-resource";
import type { MarketplaceFeeOverrides } from "@/lib/billing";

/**
 * Public marketplace-fee overrides keyed by tier. Returned from
 * `/api/billing/fees` and used by `/pricing` + `/settings/subscription` so
 * admin-edited fees flow into user-facing pricing tables without a redeploy.
 */
const resource = createSharedResource<MarketplaceFeeOverrides>(async () => {
  const json = await apiTry(apiGet<{ data?: MarketplaceFeeOverrides }>("/api/billing/fees"));
  return json?.data ?? null;
});

const getServerSnapshot = () => null;

export function useMarketplaceFees(): MarketplaceFeeOverrides | undefined {
  const fees = useSyncExternalStore(resource.subscribe, resource.get, getServerSnapshot);

  useEffect(() => {
    resource.ensure();
  }, []);

  return fees ?? undefined;
}
