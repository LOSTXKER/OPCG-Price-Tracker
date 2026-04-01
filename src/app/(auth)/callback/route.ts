import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { processReferralConversion } from "@/lib/honey-referral";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/";

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

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
