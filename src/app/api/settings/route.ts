import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { canCheckinToday } from "@/lib/honey";
import { parseTasks } from "@/lib/honey-missions";
import { todayStr } from "@/lib/honey-utils";

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const [canCheckin, todayMission] = await Promise.all([
    canCheckinToday(user.id),
    prisma.dailyMission.findUnique({
      where: { userId_date: { userId: user.id, date: todayStr() } },
      select: { tasks: true, perfectDay: true, bonusClaimed: true },
    }),
  ]);

  const hasClaimableTasks = todayMission
    ? parseTasks(todayMission.tasks).some((t) => t.done && !t.claimed)
      || (todayMission.perfectDay && !todayMission.bonusClaimed)
    : false;

  return NextResponse.json({
    tier: user.tier,
    tierExpiresAt: user.tierExpiresAt,
    trialUsed: user.trialUsed,
    trialStartedAt: user.trialStartedAt,
    stripeCustomerId: user.stripeCustomerId ? true : false,
    stripeSubscriptionId: user.stripeSubscriptionId ? true : false,
    honeyPoints: user.honeyPoints,
    honeyLifetimeEarned: user.honeyLifetimeEarned,
    lineConnected: !!user.lineUserId,
    emailAlerts: user.emailAlerts,
    lineAlerts: user.lineAlerts,
    weeklyDigest: user.weeklyDigest,
    honeyPendingActions: canCheckin || hasClaimableTasks,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody<Record<string, unknown>>(request as never);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const allowed = ["emailAlerts", "lineAlerts", "weeklyDigest", "displayName"];
  const data: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: auth.user.id },
    data,
  });

  return NextResponse.json({
    emailAlerts: updated.emailAlerts,
    lineAlerts: updated.lineAlerts,
    weeklyDigest: updated.weeklyDigest,
    displayName: updated.displayName,
  });
}
