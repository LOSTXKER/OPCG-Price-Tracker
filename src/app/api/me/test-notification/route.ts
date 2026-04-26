import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendLineMessage } from "@/lib/line";

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody<{ channel: string }>(request);
  if (!parsed.ok) return parsed.response;

  const { channel } = parsed.body;

  if (channel === "email") {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { email: true },
    });
    if (!user?.email) {
      return NextResponse.json({ error: "No email on file" }, { status: 400 });
    }
    const result = await sendEmail({
      to: user.email,
      subject: "🐻 Kuma Tracker — Test Notification",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #73533E;">🐻 Test Notification</h2>
          <p>This is a test email from Kuma Tracker.</p>
          <p>If you received this, your email notifications are working correctly!</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            Sent from your notification settings page.
          </p>
        </div>
      `,
    });
    return NextResponse.json({ ok: !!result });
  }

  if (channel === "line") {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { lineUserId: true },
    });
    if (!user?.lineUserId) {
      return NextResponse.json({ error: "LINE not connected" }, { status: 400 });
    }
    const ok = await sendLineMessage(
      user.lineUserId,
      "🐻 Kuma Tracker — Test\nThis is a test message. If you see this, LINE notifications are working!",
    );
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
});
