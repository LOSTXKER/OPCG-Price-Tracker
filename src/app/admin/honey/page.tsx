import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Award,
  ArrowDownUp,
  TrendingUp,
  ArrowRight,
  Package,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/shared/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { HoneyCharts } from "./honey-charts";
import { HoneyTransactionList } from "./honey-transaction-list";

export const dynamic = "force-dynamic";

const TX_PAGE_SIZE = 30;

async function getHoneyStats() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalCirculation,
    earnedToday,
    earnedWeek,
    redeemedTotal,
    redeemCount,
    activeShopItems,
    inactiveShopItems,
    totalHoneyUsers,
    recentTransactions,
    totalTransactions,
    topEarners,
    last30dTransactions,
    typeCounts,
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
      where: { type: "REDEEM" },
      _sum: { amount: true },
    }),
    prisma.honeyTransaction.count({ where: { type: "REDEEM" } }),
    prisma.honeyShopItem.count({ where: { isActive: true } }),
    prisma.honeyShopItem.count({ where: { isActive: false } }),
    prisma.user.count({ where: { honeyPoints: { gt: 0 } } }),
    prisma.honeyTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: TX_PAGE_SIZE,
      select: {
        id: true,
        amount: true,
        type: true,
        reason: true,
        createdAt: true,
        user: { select: { displayName: true, email: true } },
      },
    }),
    prisma.honeyTransaction.count(),
    prisma.user.findMany({
      where: { honeyPoints: { gt: 0 } },
      orderBy: { honeyPoints: "desc" },
      take: 5,
      select: {
        id: true,
        displayName: true,
        email: true,
        honeyPoints: true,
      },
    }),
    prisma.honeyTransaction.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { amount: true, createdAt: true },
    }),
    prisma.honeyTransaction.groupBy({
      by: ["type"],
      _count: true,
    }),
  ]);

  const dailyMap = new Map<string, { earned: number; redeemed: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { earned: 0, redeemed: 0 });
  }
  for (const tx of last30dTransactions) {
    const key = new Date(tx.createdAt).toISOString().slice(0, 10);
    const entry = dailyMap.get(key);
    if (!entry) continue;
    if (tx.amount > 0) {
      entry.earned += tx.amount;
    } else {
      entry.redeemed += Math.abs(tx.amount);
    }
  }
  const dailyData = Array.from(dailyMap.entries()).map(([date, v]) => ({
    date,
    earned: v.earned,
    redeemed: v.redeemed,
  }));

  const typeCountsFormatted = typeCounts.map((tc) => ({
    type: tc.type,
    count: tc._count,
  }));

  return {
    totalCirculation: totalCirculation._sum.honeyPoints ?? 0,
    earnedToday: earnedToday._sum.amount ?? 0,
    earnedWeek: earnedWeek._sum.amount ?? 0,
    redeemedTotal: Math.abs(redeemedTotal._sum.amount ?? 0),
    redeemCount,
    activeShopItems,
    inactiveShopItems,
    totalHoneyUsers,
    recentTransactions: recentTransactions.map((tx) => ({
      ...tx,
      createdAt: tx.createdAt.toISOString(),
    })),
    hasMoreTransactions: totalTransactions > TX_PAGE_SIZE,
    topEarners,
    dailyData,
    typeCounts: typeCountsFormatted,
  };
}

export default async function AdminHoneyDashboard() {
  const s = await getHoneyStats();

  const statCards = [
    {
      label: "Honey หมุนเวียนรวม",
      value: s.totalCirculation.toLocaleString(),
      sub: `${s.totalHoneyUsers} คนมีคะแนน`,
      icon: Award,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-500/10",
    },
    {
      label: "ได้รับวันนี้",
      value: `+${s.earnedToday.toLocaleString()}`,
      sub: `สัปดาห์นี้: +${s.earnedWeek.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "แลกไปทั้งหมด",
      value: s.redeemedTotal.toLocaleString(),
      sub: `${s.redeemCount.toLocaleString()} ครั้ง`,
      icon: ArrowDownUp,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "สินค้าในร้าน",
      value: s.activeShopItems.toString(),
      sub: s.inactiveShopItems > 0 ? `${s.inactiveShopItems} ปิดอยู่` : "ทุกชิ้นเปิดขาย",
      icon: Package,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="ระบบ Honey"
        description="ภาพรวมระบบคะแนน Honey Points"
        icon={Award}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <HoneyCharts dailyData={s.dailyData} typeCounts={s.typeCounts} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>ผู้มีคะแนนสูงสุด</CardTitle>
            <CardAction>
              <Link
                href="/admin/users"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                ดูทั้งหมด{" "}
                <ArrowRight className="ml-0.5 inline size-3" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {s.topEarners.map((u, i) => (
                <Link
                  key={u.id}
                  href={`/admin/users?search=${encodeURIComponent(u.email)}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm">
                    {u.displayName ?? u.email}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {u.honeyPoints.toLocaleString()}
                  </span>
                </Link>
              ))}
              {s.topEarners.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  ยังไม่มีผู้ใช้
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>ธุรกรรมล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <HoneyTransactionList
              initialTransactions={s.recentTransactions}
              initialHasMore={s.hasMoreTransactions}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
