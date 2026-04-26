import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";

export const GET = adminApiHandler(
  async (_req: NextRequest, _admin, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

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
        badges: {
          select: { id: true, name: true, nameEn: true, grantedAt: true },
          orderBy: { grantedAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transactions = await prisma.honeyTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amount: true,
        type: true,
        reason: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user, transactions });
  },
);
