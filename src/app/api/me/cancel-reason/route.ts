import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { CancelReasonSchema } from "@/lib/me/schemas";

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, CancelReasonSchema);
  if (!parsed.ok) return parsed.response;

  const { reason, comment } = parsed.body;

  await prisma.cancelReason.create({
    data: {
      userId: auth.user.id,
      reason: reason.slice(0, 200),
      comment: comment ? comment.slice(0, 1000) : null,
    },
  });

  return NextResponse.json({ ok: true });
});
