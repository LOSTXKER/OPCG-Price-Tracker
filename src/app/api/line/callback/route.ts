import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthUser } from "@/lib/api/auth";
import { serverEnv, clientEnv } from "@/lib/env";
import { createLog } from "@/lib/logger";

const log = createLog("api:line");

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const baseUrl = clientEnv().NEXT_PUBLIC_APP_URL;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/profile?tab=notifications&line=error`);
  }

  const auth = await requireAuthUser();
  if (!auth.ok) {
    return NextResponse.redirect(`${baseUrl}/login?redirect=/profile?tab=notifications`);
  }
  const user = auth.user;

  try {
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${baseUrl}/api/line/callback`,
        client_id: serverEnv().LINE_LOGIN_CHANNEL_ID!,
        client_secret: serverEnv().LINE_LOGIN_CHANNEL_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      const tokenErrText = await tokenRes.text();
      log.error("token exchange failed", tokenErrText);
      return NextResponse.redirect(`${baseUrl}/profile?tab=notifications&line=error`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(`${baseUrl}/profile?tab=notifications&line=error`);
    }

    const profile = await profileRes.json();

    await prisma.user.update({
      where: { id: user.id },
      data: { lineUserId: profile.userId, lineAlerts: true },
    });

    return NextResponse.redirect(`${baseUrl}/profile?tab=notifications&line=connected`);
  } catch (err) {
    log.error("callback error", err);
    return NextResponse.redirect(`${baseUrl}/profile?tab=notifications&line=error`);
  }
}
