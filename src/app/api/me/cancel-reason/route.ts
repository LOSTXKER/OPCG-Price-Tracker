import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";

const log = createLog("api:me:cancel-reason");

export const POST = apiHandler(async (request: NextRequest) => {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const parsed = await parseJsonBody<{
      reason: string;
      comment?: string;
    }>(request);
    if (!parsed.ok) return parsed.response;

    const { reason, comment } = parsed.body;

    if (!reason || typeof reason !== "string") {
      return NextResponse.json({ error: "reason is required" }, { status: 400 });
    }

    await prisma.cancelReason.create({
      data: {
        userId: auth.user.id,
        reason: reason.slice(0, 200),
        comment: comment ? String(comment).slice(0, 1000) : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error("POST /api/me/cancel-reason", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
});
