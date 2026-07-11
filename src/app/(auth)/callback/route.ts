import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getSafeInternalRedirect } from "@/lib/auth/safe-redirect";
import { processReferralConversion } from "@/lib/honey/referral";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const redirect = getSafeInternalRedirect(searchParams.get("redirect"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const existing = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        select: { id: true },
      });

      const user = await prisma.user.upsert({
        where: { supabaseId: data.user.id },
        update: {
          email: data.user.email!,
          displayName: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          avatarUrl: data.user.user_metadata?.avatar_url,
        },
        create: {
          supabaseId: data.user.id,
          email: data.user.email!,
          displayName: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          avatarUrl: data.user.user_metadata?.avatar_url,
        },
      });

      if (!existing) {
        const jar = await cookies();
        const refCode = jar.get("ref_code")?.value;
        if (refCode) {
          processReferralConversion(user.id, refCode).catch(() => {});
          jar.delete("ref_code");
        }
      }

      const hdrs = await headers();
      prisma.loginHistory.create({
        data: {
          userId: user.id,
          method: data.user.app_metadata?.provider ?? "email",
          ipAddress: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
          userAgent: hdrs.get("user-agent")?.slice(0, 500) ?? null,
        },
      }).catch(() => {});

      return NextResponse.redirect(new URL(redirect, origin));
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth_failed");
  if (redirect !== "/") loginUrl.searchParams.set("redirect", redirect);
  return NextResponse.redirect(loginUrl);
}
