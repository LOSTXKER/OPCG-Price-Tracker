import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { ensureReferralCode, getReferralStats } from "@/lib/honey/referral";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const code = await ensureReferralCode(auth.user.id);
  const stats = await getReferralStats(auth.user.id);

  return NextResponse.json({
    referralCode: code,
    referralUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/ref/${code}`,
    totalClicks: stats.totalClicks,
    todayClicks: stats.todayClicks,
    totalConversions: stats.totalConversions,
    totalEarned: stats.totalEarned,
  });
});
