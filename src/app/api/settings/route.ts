import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { canCheckinToday } from "@/lib/honey";
import { parseTasks } from "@/lib/honey/missions";
import { todayStr } from "@/lib/honey/utils";
import { effectiveTier, getLimits } from "@/lib/billing";
import { UpdateSettingsSchema } from "@/lib/settings/schemas";
import {
  getNotificationPrefs,
  upsertNotificationPrefs,
  type NotificationPrefsUpdate,
} from "@/lib/users/notification-prefs";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const [canCheckin, todayMission, prefs] = await Promise.all([
    canCheckinToday(user.id),
    prisma.userMissionPeriod.findUnique({
      where: {
        userId_cadence_periodKey: {
          userId: user.id,
          cadence: "DAILY",
          periodKey: todayStr(),
        },
      },
      select: { tasks: true, perfectDay: true, bonusClaimed: true },
    }),
    getNotificationPrefs(user.id),
  ]);

  const hasClaimableTasks = todayMission
    ? parseTasks(todayMission.tasks).some((t) => t.done && !t.claimed)
      || (todayMission.perfectDay && !todayMission.bonusClaimed)
    : false;

  return NextResponse.json({
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    tier: user.tier,
    tierExpiresAt: user.tierExpiresAt,
    trialUsed: user.trialUsed,
    trialStartedAt: user.trialStartedAt,
    stripeCustomerId: user.stripeCustomerId ? true : false,
    stripeSubscriptionId: user.stripeSubscriptionId ? true : false,
    honeyPoints: user.honeyPoints,
    honeyLifetimeEarned: user.honeyLifetimeEarned,
    lineConnected: !!user.lineUserId,
    emailAlerts: prefs.emailAlerts,
    lineAlerts: prefs.lineAlerts,
    weeklyDigest: prefs.weeklyDigest,
    notifyPriceEmail: prefs.notifyPriceEmail,
    notifyPriceWeb: prefs.notifyPriceWeb,
    notifyPriceLine: prefs.notifyPriceLine,
    notifyMarketEmail: prefs.notifyMarketEmail,
    notifyMarketWeb: prefs.notifyMarketWeb,
    notifyMarketLine: prefs.notifyMarketLine,
    notifyHoneyEmail: prefs.notifyHoneyEmail,
    notifyHoneyWeb: prefs.notifyHoneyWeb,
    notifyHoneyLine: prefs.notifyHoneyLine,
    notifyDigestEmail: prefs.notifyDigestEmail,
    notifyDigestWeb: prefs.notifyDigestWeb,
    notifyDigestLine: prefs.notifyDigestLine,
    honeyPendingActions: canCheckin || hasClaimableTasks,
  });
});

const NOTIFY_KEYS = [
  "emailAlerts",
  "lineAlerts",
  "weeklyDigest",
  "notifyPriceEmail",
  "notifyPriceWeb",
  "notifyPriceLine",
  "notifyMarketEmail",
  "notifyMarketWeb",
  "notifyMarketLine",
  "notifyHoneyEmail",
  "notifyHoneyWeb",
  "notifyHoneyLine",
  "notifyDigestEmail",
  "notifyDigestWeb",
  "notifyDigestLine",
] as const satisfies ReadonlyArray<keyof NotificationPrefsUpdate>;

export const PATCH = apiHandler(async (request) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request as never, UpdateSettingsSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const tier = effectiveTier(auth.user.tier, auth.user.tierExpiresAt);
  const limits = getLimits(tier);

  const lineFields: Array<keyof NotificationPrefsUpdate> = [
    "lineAlerts", "notifyPriceLine", "notifyMarketLine",
    "notifyHoneyLine", "notifyDigestLine",
  ];
  if (!limits.lineAlerts) {
    for (const f of lineFields) {
      if (body[f] === true) {
        return NextResponse.json(
          { error: "LINE alerts require a Pro plan or higher" },
          { status: 403 }
        );
      }
    }
  }

  if (!limits.weeklyDigest) {
    if (body.weeklyDigest === true || body.notifyDigestEmail === true || body.notifyDigestWeb === true || body.notifyDigestLine === true) {
      return NextResponse.json(
        { error: "Weekly digest requires a Pro plan or higher" },
        { status: 403 }
      );
    }
  }

  const notifyUpdate: NotificationPrefsUpdate = {};
  for (const key of NOTIFY_KEYS) {
    const value = body[key];
    if (typeof value === "boolean") {
      notifyUpdate[key] = value;
    }
  }

  let prefs = await getNotificationPrefs(auth.user.id);
  if (Object.keys(notifyUpdate).length > 0) {
    prefs = await upsertNotificationPrefs(auth.user.id, notifyUpdate);
  }

  if (typeof body.displayName === "string") {
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { displayName: body.displayName },
    });
  }

  const finalDisplayName =
    typeof body.displayName === "string" ? body.displayName : auth.user.displayName;

  return NextResponse.json({
    emailAlerts: prefs.emailAlerts,
    lineAlerts: prefs.lineAlerts,
    weeklyDigest: prefs.weeklyDigest,
    notifyPriceEmail: prefs.notifyPriceEmail,
    notifyPriceWeb: prefs.notifyPriceWeb,
    notifyPriceLine: prefs.notifyPriceLine,
    notifyMarketEmail: prefs.notifyMarketEmail,
    notifyMarketWeb: prefs.notifyMarketWeb,
    notifyMarketLine: prefs.notifyMarketLine,
    notifyHoneyEmail: prefs.notifyHoneyEmail,
    notifyHoneyWeb: prefs.notifyHoneyWeb,
    notifyHoneyLine: prefs.notifyHoneyLine,
    notifyDigestEmail: prefs.notifyDigestEmail,
    notifyDigestWeb: prefs.notifyDigestWeb,
    notifyDigestLine: prefs.notifyDigestLine,
    displayName: finalDisplayName,
  });
});
