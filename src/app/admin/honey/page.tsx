import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Award,
  CalendarDays,
  ShoppingBag,
  Ticket,
  Trophy,
  Users,
  TrendingUp,
  ArrowRight,
  Zap,
} from "lucide-react";

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
  PORTFOLIO_ADD: "text-blue-500",
  MARKETPLACE_SELL: "text-purple-500",
  REVIEW: "text-cyan-500",
  REFERRAL: "text-pink-500",
  REDEEM: "text-red-500",
  ADMIN_GRANT: "text-amber-600 dark:text-amber-400",
  TRIAL_BONUS: "text-orange-500",
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Honey System</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/honey/shop"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ShoppingBag className="h-4 w-4" />
            Shop Items
          </Link>
          <Link
            href="/admin/honey/users"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Users className="h-4 w-4" />
            Users
          </Link>
          <Link
            href="/admin/honey/achievements"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Trophy className="h-4 w-4" />
            Achievements
          </Link>
          <Link
            href="/admin/honey/raffle"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Ticket className="h-4 w-4" />
            Raffle
          </Link>
          <Link
            href="/admin/honey/events"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <CalendarDays className="h-4 w-4" />
            Events
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="panel p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
                {card.sub && (
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top Earners */}
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Top Earners</h2>
            <Link href="/admin/honey/users" className="text-xs text-muted-foreground hover:text-primary">
              View all <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {s.topEarners.map((u, i) => (
              <Link
                key={u.id}
                href={`/admin/honey/users?search=${encodeURIComponent(u.email)}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
              >
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">
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
        </div>

        {/* Recent Transactions */}
        <div className="panel col-span-1 p-4 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Recent Transactions</h2>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {s.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm">
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
        </div>
      </div>
    </div>
  );
}
