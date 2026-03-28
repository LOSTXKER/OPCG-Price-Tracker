import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Library,
  CreditCard,
  Languages,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Database,
  DollarSign,
} from "lucide-react";

async function getStats() {
  const [
    totalCards,
    baseCards,
    totalSets,
    missingEn,
    missingTh,
    missingImage,
    totalWithPrice,
    parallelCards,
    rarityCounts,
  ] = await Promise.all([
    prisma.card.count(),
    prisma.card.count({ where: { isParallel: false } }),
    prisma.cardSet.count(),
    prisma.card.count({ where: { nameEn: null } }),
    prisma.card.count({ where: { nameTh: null } }),
    prisma.card.count({
      where: { OR: [{ imageUrl: null }, { imageUrl: "" }] },
    }),
    prisma.card.count({ where: { latestPriceJpy: { not: null } } }),
    prisma.card.count({ where: { isParallel: true } }),
    prisma.card.groupBy({
      by: ["rarity"],
      where: { isParallel: false },
      _count: true,
      orderBy: { rarity: "asc" },
    }),
  ]);

  const withYuyuteiId = await prisma.card.count({
    where: { yuyuteiId: { not: null } },
  });

  return {
    totalCards,
    baseCards,
    totalSets,
    missingEn,
    missingTh,
    missingImage,
    totalWithPrice,
    parallelCards,
    withYuyuteiId,
    rarityCounts: rarityCounts.map((r) => ({ rarity: r.rarity, count: r._count })),
  };
}

function pct(numerator: number, denominator: number) {
  if (denominator === 0) return "0";
  return ((numerator / denominator) * 100).toFixed(1);
}

const RARITY_COLORS: Record<string, string> = {
  TR: "bg-red-500", SP: "bg-pink-500", SEC: "bg-amber-500", SR: "bg-purple-500",
  R: "bg-blue-500", UC: "bg-emerald-500", C: "bg-neutral-400",
  L: "bg-orange-500", DON: "bg-red-500", P: "bg-cyan-500",
};

export default async function AdminDashboard() {
  const s = await getStats();

  const statCards = [
    {
      label: "Total Cards",
      value: s.totalCards.toLocaleString(),
      sub: `${s.baseCards.toLocaleString()} base + ${s.parallelCards.toLocaleString()} parallels`,
      icon: Database,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Sets",
      value: s.totalSets.toLocaleString(),
      icon: Library,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Price Coverage",
      value: `${pct(s.totalWithPrice, s.totalCards)}%`,
      sub: `${s.totalWithPrice.toLocaleString()} with price`,
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Yuyutei Linked",
      value: `${pct(s.withYuyuteiId, s.totalCards)}%`,
      sub: `${s.withYuyuteiId.toLocaleString()} cards`,
      icon: CheckCircle,
      color: s.withYuyuteiId === s.totalCards ? "text-green-500" : "text-amber-500",
      bg: s.withYuyuteiId === s.totalCards ? "bg-green-500/10" : "bg-amber-500/10",
    },
  ];

  const qualityItems = [
    {
      label: "EN Name Coverage",
      have: s.totalCards - s.missingEn,
      total: s.totalCards,
      missing: s.missingEn,
      href: "/admin/cards?missing=en",
    },
    {
      label: "TH Name Coverage",
      have: s.totalCards - s.missingTh,
      total: s.totalCards,
      missing: s.missingTh,
      href: "/admin/cards?missing=th",
    },
    {
      label: "Image Coverage",
      have: s.totalCards - s.missingImage,
      total: s.totalCards,
      missing: s.missingImage,
      href: "/admin/cards?missing=image",
    },
  ];

  const rarityOrder = ["L", "C", "UC", "R", "SR", "SEC", "SP", "TR", "DON", "P"];

  const sortedRarities = [...s.rarityCounts].sort((a, b) => {
    const ai = rarityOrder.indexOf(a.rarity);
    const bi = rarityOrder.indexOf(b.rarity);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="panel p-4"
          >
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

      {/* Rarity Breakdown */}
      <div className="panel p-4">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="h-5 w-5" />
          Rarity Breakdown (Base Cards)
        </h2>
        <div className="flex flex-wrap gap-3">
          {sortedRarities.map((r) => (
            <Link
              key={r.rarity}
              href={`/admin/cards?rarity=${r.rarity}&parallel=false`}
              className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 transition-colors hover:border-primary/30"
            >
              <div className={`h-3 w-3 rounded-full ${RARITY_COLORS[r.rarity] ?? "bg-muted"}`} />
              <span className="font-mono text-sm font-bold">{r.rarity}</span>
              <span className="text-sm text-muted-foreground">{r.count}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="panel p-4">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Languages className="h-5 w-5" />
          Data Quality
        </h2>
        <div className="space-y-4">
          {qualityItems.map((item) => {
            const pctValue =
              item.total > 0 ? (item.have / item.total) * 100 : 0;
            const isGood = pctValue >= 90;
            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {isGood ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    {item.label}
                  </span>
                  <Link
                    href={item.href}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    {item.missing > 0
                      ? `${item.missing.toLocaleString()} missing`
                      : "All good"}
                  </Link>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isGood ? "bg-green-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(pctValue, 100)}%` }}
                  />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.have.toLocaleString()} / {item.total.toLocaleString()} (
                  {pctValue.toFixed(1)}%)
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/sets"
          className="panel group p-4 transition-colors hover:shadow-md"
        >
          <Library className="mb-2 h-6 w-6 text-muted-foreground group-hover:text-primary" />
          <h3 className="font-semibold">Manage Sets</h3>
          <p className="text-sm text-muted-foreground">
            View sets, scrape prices
          </p>
        </Link>
        <Link
          href="/admin/cards"
          className="panel group p-4 transition-colors hover:shadow-md"
        >
          <CreditCard className="mb-2 h-6 w-6 text-muted-foreground group-hover:text-primary" />
          <h3 className="font-semibold">Browse Cards</h3>
          <p className="text-sm text-muted-foreground">
            Search, filter, verify card data
          </p>
        </Link>
        <Link
          href="/admin/drop-rates"
          className="panel group p-4 transition-colors hover:shadow-md"
        >
          <BarChart3 className="mb-2 h-6 w-6 text-muted-foreground group-hover:text-primary" />
          <h3 className="font-semibold">Drop Rates</h3>
          <p className="text-sm text-muted-foreground">
            View and edit pull rates per set
          </p>
        </Link>
      </div>
    </div>
  );
}
