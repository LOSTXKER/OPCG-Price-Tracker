"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Eye,
  Gift,
  Layers,
  Link,
  Lock,
  Package,
  Search,
  Share2,
  ShoppingBag,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCountdown } from "../hooks/use-countdown";
import type { MissionData } from "../types";

const ICON_MAP: Record<string, typeof Award> = {
  Search, TrendingUp, Package, Layers, ShoppingBag, BarChart3, Circle, Share2, Link,
  BookOpen, Wallet, Eye,
};

const MISSION_HREF: Record<string, string> = {
  check_price: "/sets",
  browse_trending: "/trending",
  visit_marketplace: "/marketplace",
  check_portfolio: "/portfolio",
  explore_set: "/sets",
  visit_overview: "/market-overview",
  read_blog: "/blog",
  check_watchlist: "/watchlist",
  check_collection: "/portfolio",
};

export function MissionsTab({
  lang,
  mission,
  onClaimTask,
  onClaimBonus,
  onShare,
}: {
  lang: Language;
  mission: MissionData | null;
  onClaimTask: (taskId: string) => void;
  onClaimBonus: () => void;
  onShare: (taskId: string) => void;
}) {
  const countdown = useCountdown();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const prevAllComplete = useRef(false);

  const handleClaimTask = async (taskId: string) => {
    setClaimingId(taskId);
    await onClaimTask(taskId);
    setClaimingId(null);
  };

  const handleClaimBonus = async () => {
    setClaimingBonus(true);
    await onClaimBonus();
    setClaimingBonus(false);
  };

  if (!mission) {
    return (
      <div className="panel p-6">
        <p className="text-sm text-muted-foreground">{t(lang, "missionAutoHint")}</p>
      </div>
    );
  }

  const { tasks, bonusClaimed, perfectDayBonus } = mission;
  const earnedReward = tasks.filter((tk) => tk.claimed).reduce((s, tk) => s + tk.reward, 0) + (bonusClaimed ? perfectDayBonus : 0);
  const allDone = tasks.every((tk) => tk.done);
  const allClaimed = tasks.every((tk) => tk.claimed);
  const completedCount = tasks.filter((tk) => tk.claimed).length;
  const allComplete = allClaimed && bonusClaimed;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  useEffect(() => {
    if (allComplete && !prevAllComplete.current) {
      setCollapsed(true);
    }
    prevAllComplete.current = allComplete;
  }, [allComplete]);

  if (allComplete && collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="panel flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-price-up/15">
          <CheckCircle2 className="size-4.5 text-price-up" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-price-up">
            {completedCount}/{tasks.length} {t(lang, "dailyMissions")}
          </p>
          <p className="text-[11px] text-muted-foreground">
            +{earnedReward} 🍯{" "}
            {lang === "TH" ? "วันนี้" : lang === "JP" ? "今日" : "today"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Clock className="size-3" />
            <span className="font-mono tabular-nums">{countdown}</span>
          </div>
          <ChevronDown className="size-4" />
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + progress strip */}
      <div className="panel overflow-hidden">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{t(lang, "dailyMissions")}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {lang === "TH" ? "ทำภารกิจเพื่อรับ Honey ฟรีทุกวัน" : lang === "JP" ? "毎日ミッションをクリアしてHoneyを獲得" : "Complete missions to earn free Honey daily"}
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <span className="text-sm font-bold tabular-nums text-primary">
            {completedCount}/{tasks.length}
          </span>
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", allComplete ? "bg-price-up" : "bg-primary")}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="size-3" />
            <span className="font-mono tabular-nums">{countdown}</span>
          </div>
          {allComplete && (
            <button onClick={() => setCollapsed(true)} className="text-muted-foreground hover:text-foreground">
              <ChevronDown className="size-4 rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* 2-column split: missions grid (left) + Perfect Day (right) */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Left: 2x2 mission cards */}
        <div className="grid flex-1 grid-cols-2 gap-3">
          {tasks.map((task) => {
            const Icon = ICON_MAP[task.icon] ?? Circle;
            const isManual = task.trackType === "manual";
            const canClaim = task.done && !task.claimed;
            const isClaiming = claimingId === task.id;
            const href = MISSION_HREF[task.id];

            return (
              <div
                key={task.id}
                className={cn(
                  "panel flex items-center gap-3 p-3 transition-all",
                  task.claimed
                    ? "border-price-up/20 bg-price-up/[0.03]"
                    : canClaim
                      ? "border-primary/30 bg-primary/[0.03] ring-1 ring-primary/10"
                      : "",
                )}
              >
                <div className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  task.claimed
                    ? "bg-price-up/15 text-price-up"
                    : task.done
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                )}>
                  {task.claimed ? <CheckCircle2 className="size-4.5" /> : <Icon className="size-4.5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-xs font-semibold leading-tight",
                    task.claimed && "text-muted-foreground line-through",
                  )}>
                    {t(lang, task.labelKey as TranslationKey)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                    {t(lang, task.hintKey as TranslationKey)}
                  </p>
                  {!task.claimed && !task.done && (
                    isManual ? (
                      <button onClick={() => onShare(task.id)} className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80">
                        <Share2 className="size-2.5" />
                        {lang === "TH" ? "แชร์" : lang === "JP" ? "シェア" : "Share"}
                      </button>
                    ) : href ? (
                      <NextLink href={href} className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground">
                        {lang === "TH" ? "ไปทำ" : lang === "JP" ? "GO" : "Go"}
                        <ArrowRight className="size-2.5" />
                      </NextLink>
                    ) : null
                  )}
                </div>

                <div className="shrink-0">
                  {task.claimed ? (
                    <CheckCircle2 className="size-4 text-price-up" />
                  ) : canClaim ? (
                    <Button
                      size="sm"
                      disabled={isClaiming}
                      onClick={() => handleClaimTask(task.id)}
                      className="relative h-7 gap-1 rounded-lg bg-primary px-2.5 text-[11px] font-bold text-primary-foreground hover:bg-primary/90"
                    >
                      <span className="absolute -right-1 -top-1 flex size-2.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
                      </span>
                      <Gift className="size-3" />
                      {isClaiming ? "..." : `+${task.reward}`}
                      <span className="text-[9px] leading-none">🍯</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled
                      className="h-7 gap-1 rounded-lg bg-muted px-2.5 text-[11px] font-bold text-muted-foreground"
                    >
                      <Lock className="size-3" />
                      +{task.reward}
                      <span className="text-[9px] leading-none">🍯</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Perfect Day card */}
        <div className={cn(
          "panel flex flex-col items-center justify-center gap-3 p-5 text-center transition-all sm:w-56",
          bonusClaimed
            ? "border-price-up/20 bg-price-up/[0.03]"
            : allDone && allClaimed
              ? "border-primary/30 bg-primary/[0.03] ring-1 ring-primary/10"
              : "border-dashed",
        )}>
          <div className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-2xl",
            bonusClaimed
              ? "bg-price-up/15 text-price-up"
              : allDone && allClaimed
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground",
          )}>
            {bonusClaimed ? <CheckCircle2 className="size-7" /> : <Star className="size-7" />}
          </div>

          <div>
            <p className={cn(
              "text-sm font-bold leading-tight",
              bonusClaimed && "text-muted-foreground line-through",
            )}>
              Perfect Day!
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {lang === "TH" ? "ทำภารกิจครบทุกอัน" : lang === "JP" ? "全ミッション達成" : "Complete all missions"}
            </p>
          </div>

          {bonusClaimed ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-price-up/10 px-3 py-1.5 text-sm font-bold tabular-nums text-price-up">
              <CheckCircle2 className="size-4" />
              +{perfectDayBonus} 🍯
            </span>
          ) : allDone && allClaimed ? (
            <Button
              size="sm"
              disabled={claimingBonus}
              onClick={handleClaimBonus}
              className="relative h-9 w-full gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              <span className="absolute -right-1 -top-1 flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
              </span>
              <Gift className="size-4" />
              {claimingBonus ? "..." : `+${perfectDayBonus}`}
              <span className="text-sm leading-none">🍯</span>
            </Button>
          ) : (
            <Button
              size="sm"
              disabled
              className="h-9 w-full gap-1.5 rounded-lg bg-muted px-4 text-xs font-bold text-muted-foreground"
            >
              <Lock className="size-4" />
              +{perfectDayBonus}
              <span className="text-sm leading-none">🍯</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
