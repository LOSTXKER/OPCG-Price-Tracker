import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { earnHoney } from "@/lib/honey";

const TRIAL_DAYS = 14;

export async function POST() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  if (user.trialUsed) {
    return NextResponse.json({ error: "Trial already used" }, { status: 400 });
  }

  if (user.tier !== "FREE") {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tier: "PRO",
      trialStartedAt: now,
      tierExpiresAt: trialEnd,
      trialUsed: true,
    },
  });

  await earnHoney(user.id, "TRIAL_BONUS", "Trial welcome bonus");

  return NextResponse.json({
    success: true,
    tier: "PRO",
    trialEndsAt: trialEnd.toISOString(),
  });
}
