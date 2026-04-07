import { NextRequest, NextResponse } from "next/server";
import { recordReferralClick } from "@/lib/honey/referral";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ua = request.headers.get("user-agent") ?? undefined;

  recordReferralClick(code, ip, ua).catch(() => {});

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const res = NextResponse.redirect(new URL(`/?ref=${code}`, base || request.url));
  res.cookies.set("ref_code", code, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  return res;
}
