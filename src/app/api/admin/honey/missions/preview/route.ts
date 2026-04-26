import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { resolveDailyMissions, getActiveBonusRules } from "@/lib/honey/mission-resolver";

export const GET = adminApiHandler(async (req: NextRequest) => {
  const sp = new URL(req.url).searchParams;
  const date = sp.get("date") ?? undefined;

  const missions = await resolveDailyMissions(date);
  const bonusRules = await getActiveBonusRules("DAILY");

  return NextResponse.json({ date: date ?? new Date().toISOString().slice(0, 10), missions, bonusRules });
});
