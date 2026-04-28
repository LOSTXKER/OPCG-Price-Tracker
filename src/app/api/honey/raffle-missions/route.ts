import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import {
  getOrCreateMonthlyMissions,
  trackRaffleMission,
  claimRaffleMissionReward,
  claimRaffleMissionBonus,
  serializeRaffleMissions,
} from "@/lib/honey/missions";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const mission = await getOrCreateMonthlyMissions(auth.user.id);
  return NextResponse.json({ missions: serializeRaffleMissions(mission) });
});

export const POST = apiHandler(async (request) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody<{
    action: string;
    missionId?: string;
    dedupKey?: string;
  }>(request);
  if (!parsed.ok) return parsed.response;

  const { action, missionId, dedupKey } = parsed.body;

  if (action === "claim-bonus") {
    const result = await claimRaffleMissionBonus(auth.user.id);
    if (!result.claimed) {
      return NextResponse.json({ error: "Cannot claim bonus" }, { status: 400 });
    }
    const mission = await getOrCreateMonthlyMissions(auth.user.id);
    return NextResponse.json({
      missions: serializeRaffleMissions(mission),
      ticketAwarded: result.ticketAwarded,
    });
  }

  if (!missionId) {
    return NextResponse.json({ error: "missionId required" }, { status: 400 });
  }

  if (action === "track") {
    const mission = await trackRaffleMission(auth.user.id, missionId, { dedupKey });
    return NextResponse.json({ missions: serializeRaffleMissions(mission) });
  }

  if (action === "claim") {
    const result = await claimRaffleMissionReward(auth.user.id, missionId);
    if (!result.claimed) {
      return NextResponse.json({ error: "Cannot claim" }, { status: 400 });
    }
    const mission = await getOrCreateMonthlyMissions(auth.user.id);
    return NextResponse.json({
      missions: serializeRaffleMissions(mission),
      earned: result.earned,
      ticketAwarded: result.ticketAwarded,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
});
