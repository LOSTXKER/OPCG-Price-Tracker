import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const GET = adminApiHandler(async (request: NextRequest, _admin) => {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { displayName: { contains: search, mode: "insensitive" } },
    ];
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const [users, total, totalAllUsers, totalHoney, activeToday, newThisWeek] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { honeyPoints: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        honeyPoints: true,
        checkinStreak: true,
        tier: true,
        createdAt: true,
        _count: { select: { honeyTransactions: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count(),
    prisma.user.aggregate({ _sum: { honeyPoints: true } }),
    prisma.user.count({ where: { lastCheckinAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
  ]);

  return NextResponse.json({
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalUsers: totalAllUsers,
      totalHoney: totalHoney._sum.honeyPoints ?? 0,
      activeToday,
      newThisWeek,
    },
  });
});
