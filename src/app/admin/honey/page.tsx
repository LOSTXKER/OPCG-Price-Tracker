import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Award,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  Zap,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";

async function getHoneyStats() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    totalCirculation,
    earnedToday,
    earnedWeek,
    redeemedTotal,
    activeShopItems,
    totalHoneyUsers,
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
      where: { type: "REDEEM" },
      _sum: { amount: true },
    }),
    prisma.honeyShopItem.count({ where: { isActive: true } }),
    prisma.user.count({ where: { honeyPoints: { gt: 0 } } }),
    prisma.honeyTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        amount: true,
        type: true,
        reason: true,
        createdAt: true,
        user: { select: { displayName: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: { honeyPoints: { gt: 0 } },
      orderBy: { honeyPoints: "desc" },
      take: 5,
      select: { id: true, displayName: true, email: true, honeyPoints: true },
    }),
  ]);

  return {
    totalCirculation: totalCirculation._sum.honeyPoints ?? 0,
    earnedToday: earnedToday._sum.amount ?? 0,
    earnedWeek: earnedWeek._sum.amount ?? 0,
    redeemedTotal: Math.abs(redeemedTotal._sum.amount ?? 0),
    activeShopItems,
    totalHoneyUsers,
    recentTransactions,
    topEarners,
  };
}

const TYPE_COLORS: Record<string, string> = {
  CHECKIN: "text-green-500",
  MARKETPLACE_SELL: "text-purple-500",
  REVIEW: "text-cyan-500",
  REFERRAL: "text-pink-500",
  REDEEM: "text-red-500",
  ADMIN_GRANT: "text-amber-600 dark:text-amber-400",
  TRIAL_BONUS: "text-orange-500",
  DAILY_MISSION: "text-blue-500",
  PRICE_PREDICTION: "text-indigo-500",
  DECK_SHARE: "text-teal-500",
  COMMUNITY_PRICE: "text-emerald-500",
  ONBOARDING: "text-sky-500",
  ACHIEVEMENT: "text-yellow-500",
  RAFFLE_TICKET: "text-violet-500",
  RAFFLE_WIN: "text-amber-500",
  LEVEL_UP: "text-rose-500",
  WEEKLY_BONUS: "text-lime-500",
  LEADERBOARD_REWARD: "text-fuchsia-500",
  EXPIRED: "text-gray-400",
};

export default async function AdminHoneyDashboard() {
  const s = await getHoneyStats();

  const statCards = [
    {
      label: "Total Circulation",
      value: s.totalCirculation.toLocaleString(),
      sub: `${s.totalHoneyUsers} users with points`,
      icon: Award,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-500/10",
    },
    {
      label: "Earned Today",
      value: `+${s.earnedToday.toLocaleString()}`,
      sub: `This week: +${s.earnedWeek.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Total Redeemed",
      value: s.redeemedTotal.toLocaleString(),
      icon: ShoppingBag,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Active Shop Items",
      value: s.activeShopItems.toString(),
      icon: ShoppingBag,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Honey System" icon={Award} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <AdminStatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top Earners */}
        <Card>
          <CardHeader>
            <CardTitle>Top Earners</CardTitle>
            <CardAction>
              <Link href="/admin/users" className="text-xs text-muted-foreground hover:text-primary">
                View all <ArrowRight className="ml-0.5 inline h-3 w-3" />
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
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
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
                <p className="py-4 text-center text-sm text-muted-foreground">No users yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 space-y-0.5 overflow-y-auto">
              {s.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/50">
                  <Zap className={`h-3.5 w-3.5 shrink-0 ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`} />
                  <span className="w-20 truncate text-xs text-muted-foreground">
                    {tx.user.displayName ?? tx.user.email}
                  </span>
                  <span className={`w-20 text-xs font-medium ${TYPE_COLORS[tx.type] ?? "text-muted-foreground"}`}>
                    {tx.type}
                  </span>
                  <span className="flex-1 truncate text-xs text-muted-foreground">
                    {tx.reason}
                  </span>
                  <span className={`shrink-0 text-xs font-bold tabular-nums ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {s.recentTransactions.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
