import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";

export const GET = apiHandler(async () => {
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
});
