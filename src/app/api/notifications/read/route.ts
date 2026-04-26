import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody<{ id?: number; all?: boolean }>(request);
  if (!parsed.ok) return parsed.response;

  const now = new Date();

  if (parsed.body.all) {
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, read: false },
      data: { read: true, readAt: now },
    });
  } else if (parsed.body.id) {
    await prisma.notification.updateMany({
      where: { id: parsed.body.id, userId: auth.user.id },
      data: { read: true, readAt: now },
    });
  }

  return NextResponse.json({ ok: true });
});
