import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { grantHoney } from "@/lib/honey";

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

  // Route through grantHoney so positive admin grants update
  // honeyLifetimeEarned (driving levels + honey_lifetime_* achievements).
  // Negative grants only adjust honeyPoints, matching the historical behavior.
  const result = await grantHoney(userId, amount, "ADMIN_GRANT", reason, {
    grantedBy: admin.id,
  });

  return NextResponse.json({
    success: true,
    honeyPoints: result.total,
  });
});
