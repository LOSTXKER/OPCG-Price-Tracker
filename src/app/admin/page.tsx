import { prisma } from "@/lib/db";
import { raritySort } from "@/lib/constants/rarities";
import Link from "next/link";
import {
  Library,
  CreditCard,
  CheckCircle2,
  BarChart3,
  Database,
  DollarSign,
  LayoutDashboard,
  ArrowRight,
  Clock,
  ArrowLeftRight,
  ImageIcon,
  FileText,
  ExternalLink,
  CircleAlert,
  Globe,
  Languages,
  ImagePlus,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DashboardCharts } from "./dashboard-charts";

export const dynamic = "force-dynamic";

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

  let recentLogs: {
    id: number;
    action: string;
    entity: string;
    entityId: string | null;
    createdAt: Date;
  }[] = [];
  try {
    recentLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        createdAt: true,
      },
    });
  } catch {
    // Table may not exist
  }

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
    rarityCounts: rarityCounts.map((r) => ({
      rarity: r.rarity,
      count: r._count,
    })),
    recentLogs,
  };
}

function pct(numerator: number, denominator: number) {
  if (denominator === 0) return "0";
  return ((numerator / denominator) * 100).toFixed(1);
}

const RARITY_DOT: Record<string, string> = {
  TR: "bg-red-500",
  SP: "bg-pink-500",
  SEC: "bg-amber-500",
  SR: "bg-purple-500",
  R: "bg-blue-500",
  UC: "bg-emerald-500",
  C: "bg-neutral-400",
  L: "bg-orange-500",
  DON: "bg-red-400",
  P: "bg-cyan-500",
};

function relativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชม. ที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-500",
  update: "bg-blue-500",
  delete: "bg-red-500",
  approve: "bg-emerald-500",
  reject: "bg-amber-500",
  scrape: "bg-purple-500",
  import: "bg-cyan-500",
};

function actionDotColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find((k) => action.toLowerCase().includes(k));
  return key ? ACTION_COLORS[key] : "bg-primary/50";
}

const QUICK_ACTIONS = [
  {
    href: "/admin/sets",
    icon: Library,
    title: "จัดการชุดการ์ด",
    description: "ดูชุดการ์ดและดึงข้อมูลราคา",
    accent: "group-hover:text-purple-500",
    accentBg: "group-hover:bg-purple-500/10",
  },
  {
    href: "/admin/cards",
    icon: CreditCard,
    title: "เรียกดูการ์ด",
    description: "ค้นหา กรอง และตรวจสอบข้อมูล",
    accent: "group-hover:text-blue-500",
    accentBg: "group-hover:bg-blue-500/10",
  },
  {
    href: "/admin/yuyutei-matching",
    icon: ArrowLeftRight,
    title: "จับคู่ Yuyutei",
    description: "จัดการการจับคู่การ์ดกับราคา",
    accent: "group-hover:text-amber-500",
    accentBg: "group-hover:bg-amber-500/10",
  },
  {
    href: "/admin/image-matching",
    icon: ImageIcon,
    title: "จับคู่รูปภาพ",
    description: "จัดการการจับคู่รูปภาพการ์ด",
    accent: "group-hover:text-emerald-500",
    accentBg: "group-hover:bg-emerald-500/10",
  },
  {
    href: "/admin/drop-rates",
    icon: BarChart3,
    title: "อัตราดรอป",
    description: "ดูและแก้ไขอัตราการเปิดได้",
    accent: "group-hover:text-cyan-500",
    accentBg: "group-hover:bg-cyan-500/10",
  },
  {
    href: "/admin/blog/new",
    icon: FileText,
    title: "สร้างบทความ",
    description: "เขียนบทความใหม่",
    accent: "group-hover:text-pink-500",
    accentBg: "group-hover:bg-pink-500/10",
  },
];

const QUALITY_ICONS = {
  "ชื่อภาษาอังกฤษ": Globe,
  "ชื่อภาษาไทย": Languages,
  "รูปภาพ": ImagePlus,
};

export default async function AdminDashboard() {
  const s = await getStats();

  const statCards = [
    {
      label: "การ์ดทั้งหมด",
      value: s.totalCards.toLocaleString(),
      sub: `${s.baseCards.toLocaleString()} พื้นฐาน + ${s.parallelCards.toLocaleString()} พาราเลล`,
      icon: Database,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "ชุดการ์ดทั้งหมด",
      value: s.totalSets.toLocaleString(),
      icon: Library,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "ความครบถ้วนราคา",
      value: `${pct(s.totalWithPrice, s.totalCards)}%`,
      sub: `${s.totalWithPrice.toLocaleString()} ใบมีราคาแล้ว`,
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "เชื่อม Yuyutei แล้ว",
      value: `${pct(s.withYuyuteiId, s.totalCards)}%`,
      sub: `${s.withYuyuteiId.toLocaleString()} ใบ`,
      icon: CheckCircle2,
      color:
        s.withYuyuteiId === s.totalCards ? "text-green-500" : "text-amber-500",
      bg:
        s.withYuyuteiId === s.totalCards
          ? "bg-green-500/10"
          : "bg-amber-500/10",
    },
  ];

  const qualityItems = [
    {
      label: "ชื่อภาษาอังกฤษ",
      have: s.totalCards - s.missingEn,
      total: s.totalCards,
      missing: s.missingEn,
      href: "/admin/cards?missing=en",
    },
    {
      label: "ชื่อภาษาไทย",
      have: s.totalCards - s.missingTh,
      total: s.totalCards,
      missing: s.missingTh,
      href: "/admin/cards?missing=th",
    },
    {
      label: "รูปภาพ",
      have: s.totalCards - s.missingImage,
      total: s.totalCards,
      missing: s.missingImage,
      href: "/admin/cards?missing=image",
    },
  ];

  const sortedRarities = [...s.rarityCounts].sort((a, b) =>
    raritySort(a.rarity, b.rarity),
  );

  const chartData = {
    quality: qualityItems.map((item) => ({
      name: item.label,
      value: item.have,
      missing: item.missing,
      total: item.total,
    })),
    rarities: sortedRarities.map((r) => ({
      rarity: r.rarity,
      count: r.count,
      color: RARITY_DOT[r.rarity] ?? "bg-muted",
    })),
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="แดชบอร์ด"
        description="ภาพรวมข้อมูลการ์ด ราคา และคุณภาพข้อมูล"
        icon={LayoutDashboard}
      />

      {/* ── KPI Stats ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Charts ── */}
      <DashboardCharts data={chartData} />

      {/* ── Data Quality ── */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="size-4 text-muted-foreground" />
            ความครบถ้วนของข้อมูล
          </h3>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {qualityItems.map((item) => {
            const pctValue =
              item.total > 0 ? (item.have / item.total) * 100 : 0;
            const isComplete = item.missing === 0;
            const isGood = pctValue >= 95;
            const QIcon = QUALITY_ICONS[item.label as keyof typeof QUALITY_ICONS] ?? Globe;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-start gap-3 rounded-lg border border-border/30 p-3 transition-all hover:border-primary/30 hover:bg-muted/30"
              >
                <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${isGood ? "bg-green-500/10" : "bg-amber-500/10"}`}>
                  <QIcon className={`size-4 ${isGood ? "text-green-500" : "text-amber-500"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{item.label}</span>
                    <span className="tabular-nums text-xs font-bold">{pctValue.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className={`h-full rounded-full transition-all ${isGood ? "bg-green-500/70" : "bg-amber-500/70"}`}
                      style={{ width: `${Math.min(pctValue, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {isComplete ? (
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="size-3" /> ครบถ้วนแล้ว
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <CircleAlert className="size-3 text-amber-500" />
                        ขาด {item.missing.toLocaleString()} รายการ
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Rarity Breakdown ── */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Database className="size-4 text-muted-foreground" />
          สรุปตามระดับความหายาก
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {sortedRarities.map((r) => (
            <Link
              key={r.rarity}
              href={`/admin/cards?rarity=${r.rarity}&parallel=false`}
              className="flex items-center gap-2 rounded-lg border border-border/30 px-3 py-1.5 text-sm transition-all hover:border-primary/30 hover:bg-muted/40"
            >
              <div
                className={`size-2.5 rounded-full ${RARITY_DOT[r.rarity] ?? "bg-muted"}`}
              />
              <span className="font-mono text-xs font-bold">{r.rarity}</span>
              <span className="tabular-nums text-xs text-muted-foreground">{r.count.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bottom: Recent Activity + Quick Actions ── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Recent Activity */}
        {s.recentLogs.length > 0 && (
          <div className="rounded-xl border border-border/50 bg-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="size-4 text-muted-foreground" />
                กิจกรรมล่าสุด
              </h3>
              <Link
                href="/admin/logs"
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                ดูทั้งหมด
                <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="mt-3 space-y-0.5">
              {s.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/30"
                >
                  <div className={`mt-1.5 size-1.5 shrink-0 rounded-full ${actionDotColor(log.action)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs">
                      <span className="font-medium">{log.action}</span>
                      <span className="mx-1 text-muted-foreground/40">·</span>
                      <span className="text-muted-foreground">{log.entity}</span>
                      {log.entityId && (
                        <span className="ml-1 font-mono text-[10px] text-muted-foreground/50">
                          #{log.entityId.slice(0, 8)}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground/50">
                      {relativeTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={s.recentLogs.length > 0 ? "lg:col-span-3" : "lg:col-span-5"}>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href} className="group">
                <div className="flex h-full items-start gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 transition-colors ${action.accentBg}`}>
                    <action.icon className={`size-[18px] text-muted-foreground transition-colors ${action.accent}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {action.title}
                    </h4>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/60" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
