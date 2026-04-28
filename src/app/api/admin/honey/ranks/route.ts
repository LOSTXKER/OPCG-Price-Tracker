import { NextRequest, NextResponse } from "next/server";

import { adminApiHandler } from "@/lib/api/api-handler";
import { logAudit } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api/request-body";
import { RankTiersSchema } from "@/lib/honey/rank-tiers";
import {
  getRankTiers,
  setRankTiers,
} from "@/lib/honey/rank-tiers-server";

export const GET = adminApiHandler(async () => {
  const tiers = await getRankTiers();
  return NextResponse.json({ tiers });
});

const PutBodySchema = RankTiersSchema;

export const PUT = adminApiHandler(async (request: NextRequest, admin) => {
  const parsed = await parseJsonBody(request, PutBodySchema);
  if (!parsed.ok) return parsed.response;

  const tiers = await setRankTiers(parsed.body, admin.id);

  await logAudit({
    action: "UPDATE_RANK_TIERS",
    entity: "SystemConfig",
    userId: admin.id,
    details: { count: tiers.length },
  });

  return NextResponse.json({ ok: true, tiers });
});
