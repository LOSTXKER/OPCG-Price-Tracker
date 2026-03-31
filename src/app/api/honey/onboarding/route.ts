import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { earnHoney, getHoneyMultiplier } from "@/lib/honey";

export async function POST() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  if (user.onboardingCompleted) {
    return NextResponse.json({ error: "Onboarding already completed" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingCompleted: true },
  });

  const result = await earnHoney(
    user.id,
    "ONBOARDING",
    "Onboarding completed",
    undefined,
    getHoneyMultiplier(user.tier, user.tierExpiresAt),
  );

  return NextResponse.json({ earned: result?.earned ?? 50, total: result?.total ?? user.honeyPoints + 50 });
}
