import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { earnHoney, getHoneyMultiplier } from "@/lib/honey";

export const POST = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  if (user.onboardingCompleted) {
    return NextResponse.json({ error: "Onboarding already completed" }, { status: 400 });
  }

  const result = await earnHoney(
    user.id,
    "ONBOARDING",
    "Onboarding completed",
    undefined,
    getHoneyMultiplier(user.tier, user.tierExpiresAt),
  );

  if (!result) {
    return NextResponse.json({ error: "Failed to grant onboarding reward" }, { status: 500 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingCompleted: true },
  });

  return NextResponse.json({ earned: result.earned, total: result.total });
});
