import { NextRequest, NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/admin-helpers";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!(await checkIsAdmin())) return unauthorized();

  const { id } = await context.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      honeyPoints: true,
      checkinStreak: true,
      lastCheckinAt: true,
      tier: true,
      tierExpiresAt: true,
      createdAt: true,
      badges: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const transactions = await prisma.honeyTransaction.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, amount: true, type: true, reason: true, metadata: true, createdAt: true },
  });

  return NextResponse.json({ user, transactions });
}
