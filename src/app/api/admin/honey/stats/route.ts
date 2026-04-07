import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";

export const GET = adminApiHandler(async (_req: NextRequest) => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setDate(monthStart.getDate() - 30);

  const [
    totalCirculation,
    earnedToday,
    earnedWeek,
    earnedMonth,
    redeemedTotal,
    activeShopItems,
    totalUsers,
    recentTransactions,
    topEarners,
  ] = await Promise.all([
    prisma.user.aggregate({ _sum: { honeyPoints: true } }),
    prisma.honeyTransaction.aggregate({
      where: { amount: { gt: 0 }, createdAt: { gte: todayStart } },
      _sum: { amount: true },
    }),
    prisma.honeyTransaction.aggregate({
      where: { amount: { gt: 0 }, createdAt: { gte: weekStart } },
      _sum: { amount: true },
    }),
    prisma.honeyTransaction.aggregate({
      where: { amount: { gt: 0 }, createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.honeyTransaction.aggregate({
      where: { type: "REDEEM" },
      _sum: { amount: true },
    }),
    prisma.honeyShopItem.count({ where: { isActive: true } }),
    prisma.user.count({ where: { honeyPoints: { gt: 0 } } }),
    prisma.honeyTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amount: true,
        type: true,
        reason: true,
        createdAt: true,
        user: { select: { id: true, displayName: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: { honeyPoints: { gt: 0 } },
      orderBy: { honeyPoints: "desc" },
      take: 10,
      select: { id: true, displayName: true, email: true, honeyPoints: true, checkinStreak: true },
    }),
  ]);

  return NextResponse.json({
    totalCirculation: totalCirculation._sum.honeyPoints ?? 0,
    earnedToday: earnedToday._sum.amount ?? 0,
    earnedWeek: earnedWeek._sum.amount ?? 0,
    earnedMonth: earnedMonth._sum.amount ?? 0,
    redeemedTotal: Math.abs(redeemedTotal._sum.amount ?? 0),
    activeShopItems,
    totalUsers,
    recentTransactions,
    topEarners,
  });
});
