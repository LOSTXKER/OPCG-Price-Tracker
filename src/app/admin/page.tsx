import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Library,
  CreditCard,
  Image as ImageIcon,
  Languages,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

async function getStats() {
  const [
    totalCards,
    totalSets,
    missingEn,
    missingTh,
    missingImage,
    totalWithPrice,
    parallelCards,
    parallelNoImage,
  ] = await Promise.all([
    prisma.card.count(),
    prisma.cardSet.count(),
    prisma.card.count({ where: { nameEn: null } }),
    prisma.card.count({ where: { nameTh: null } }),
    prisma.card.count({
      where: { OR: [{ imageUrl: null }, { imageUrl: "" }] },
    }),
    prisma.card.count({ where: { latestPriceJpy: { not: null } } }),
    prisma.card.count({ where: { isParallel: true } }),
    prisma.card.count({
      where: {
        isParallel: true,
        OR: [
          { imageUrl: null },
          { imageUrl: "" },
          { imageUrl: { contains: "yuyu-tei" } },
        ],
      },
    }),
  ]);

  return {
    totalCards,
    totalSets,
    missingEn,
    missingTh,
    missingImage,
    totalWithPrice,
    parallelCards,
    parallelNoImage,
  };
}

function pct(numerator: number, denominator: number) {
  if (denominator === 0) return "0";
  return ((numerator / denominator) * 100).toFixed(1);
}

export default async function AdminDashboard() {
  const s = await getStats();

  const statCards = [
    {
      label: "Total Cards",
      value: s.totalCards.toLocaleString(),
      icon: CreditCard,
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
      label: "With Price",
      value: `${pct(s.totalWithPrice, s.totalCards)}%`,
      sub: `${s.totalWithPrice.toLocaleString()} cards`,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Parallels",
      value: s.parallelCards.toLocaleString(),
      sub: `${s.parallelNoImage} unmatched`,
      icon: ImageIcon,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border/50 bg-card p-4"
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

      <div className="rounded-xl border border-border/50 bg-card p-4">
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/sets"
          className="group rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30"
        >
          <Library className="mb-2 h-6 w-6 text-muted-foreground group-hover:text-primary" />
          <h3 className="font-semibold">Manage Sets</h3>
          <p className="text-sm text-muted-foreground">
            Edit set metadata, import data, scrape prices
          </p>
        </Link>
        <Link
          href="/admin/cards"
          className="group rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30"
        >
          <CreditCard className="mb-2 h-6 w-6 text-muted-foreground group-hover:text-primary" />
          <h3 className="font-semibold">Browse Cards</h3>
          <p className="text-sm text-muted-foreground">
            Search, filter, and edit card data
          </p>
        </Link>
        <Link
          href="/admin/image-matching"
          className="group rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30"
        >
          <ImageIcon className="mb-2 h-6 w-6 text-muted-foreground group-hover:text-primary" />
          <h3 className="font-semibold">Image Matching</h3>
          <p className="text-sm text-muted-foreground">
            Match parallel card images with AI
          </p>
        </Link>
      </div>
    </div>
  );
}
