import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { getAdminConfig } from "@/lib/admin/config";

/**
 * Public, unauthenticated endpoint that exposes the subset of admin config
 * keys safe to ship to anonymous clients. Currently this is just the
 * `marketplaceEnabled` feature flag, used by the layout (header, bottom nav,
 * mobile menu) to gate marketplace links until an admin enables the storefront
 * from `/admin/config`.
 *
 * Cached server-side for 60s by `getAdminConfig()`; do not add fields here
 * that contain secrets, fees-by-tier, or other internal scheduling data.
 */
export const GET = apiHandler(async () => {
  const config = await getAdminConfig();
  return NextResponse.json({
    data: {
      marketplaceEnabled: config.marketplaceEnabled,
    },
  });
});
