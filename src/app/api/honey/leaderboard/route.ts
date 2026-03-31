import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany({
    where: { honeyPoints: { gt: 0 } },
    orderBy: { honeyPoints: "desc" },
    take: 20,
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      honeyPoints: true,
      checkinStreak: true,
    },
  });

  return NextResponse.json({ leaderboard: users });
}
