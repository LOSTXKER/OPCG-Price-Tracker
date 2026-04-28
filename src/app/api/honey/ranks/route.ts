import { NextResponse } from "next/server";

import { apiHandler } from "@/lib/api/api-handler";
import { getRankTiers } from "@/lib/honey/rank-tiers-server";

/**
 * Public read-only feed for the honey rank ladder. Used by the client
 * to render the rank stat card, popover, mobile rank chip in the
 * daily-missions card, and the avatar ring/progress in the header
 * dropdown. The route is intentionally unauthenticated — the ladder
 * itself isn't sensitive and is shown to logged-out previews.
 */
export const GET = apiHandler(async () => {
  const tiers = await getRankTiers();
  return NextResponse.json({ tiers });
});
