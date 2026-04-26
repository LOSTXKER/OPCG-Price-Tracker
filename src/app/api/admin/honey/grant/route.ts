import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";

export const POST = adminApiHandler(async (request: NextRequest, admin) => {
  const parsed = await parseJsonBody<{
    userId: string;
    amount: number;
    reason: string;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const { userId, amount, reason } = parsed.body;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (!Number.isInteger(amount) || amount === 0) {
    return NextResponse.json({ error: "amount must be a non-zero integer" }, { status: 400 });
  }
  if (!reason || typeof reason !== "string") {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { honeyPoints: { increment: amount } },
    }),
    prisma.honeyTransaction.create({
      data: {
        userId,
        amount,
        type: "ADMIN_GRANT",
        reason,
        metadata: { grantedBy: admin.id },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    honeyPoints: updated.honeyPoints,
  });
});
