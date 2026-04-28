import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { getAdminConfig } from "@/lib/admin/config";

/**
 * Public, unauthenticated endpoint that returns the current marketplace fee
 * percentages by tier. Used by `/pricing` and `/settings/subscription` to keep
 * displayed fees in sync with whatever an admin saved in `/admin/config`.
 *
 * Cached server-side for 60s by `getAdminConfig()`.
 */
export const GET = apiHandler(async () => {
  const config = await getAdminConfig();
  return NextResponse.json({
    data: {
      FREE: config.marketplaceFeeFree,
      PRO: config.marketplaceFeePro,
      PRO_PLUS: config.marketplaceFeeProPlus,
    },
  });
});
