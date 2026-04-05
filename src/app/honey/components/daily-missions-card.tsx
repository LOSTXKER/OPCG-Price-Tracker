"use client";

import { useState } from "react";
import NextLink from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Crown,
  Eye,
  Gift,
  Layers,
  Link,
  Lock,
  Package,
  Search,
  Share2,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCountdown } from "../hooks/use-countdown";
import type { MissionData, HoneyLevel, ActiveEvent } from "../types";
import { StreakTierIndicator } from "@/components/shared/streak-tier-indicator";

const RANK_LABELS: Record<string, Record<number, string>> = {
  TH: { 0: "มือใหม่", 1: "บรอนซ์", 2: "ซิลเวอร์", 3: "โกลด์", 4: "ไดมอนด์" },
  EN: { 0: "Newbie", 1: "Bronze", 2: "Silver", 3: "Gold", 4: "Diamond" },
  JP: { 0: "ニュービー", 1: "ブロンズ", 2: "シルバー", 3: "ゴールド", 4: "ダイヤモンド" },
};

const RANK_ICONS = [Shield, Shield, Star, Crown, Trophy] as const;

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

function MobileStreakRankRow({
  lang,
  streak,
  level,
  lifetimeEarned,
}: {
  lang: Language;
  streak: number;
  level: HoneyLevel | null;
  lifetimeEarned: number;
}) {
  const currentLevel = level?.level ?? 0;
  const currentMin = level?.currentMin ?? 0;
  const nextThreshold = level?.nextThreshold ?? null;
  const isMaxRank = nextThreshold === null;
  const progress = isMaxRank ? 100 : nextThreshold > currentMin
    ? Math.min(100, Math.round(((lifetimeEarned - currentMin) / (nextThreshold - currentMin)) * 100))
    : 100;
  const rankLabels = RANK_LABELS[lang] ?? RANK_LABELS.EN;
  const RankIcon = RANK_ICONS[currentLevel] ?? Shield;

  return (
    <div className="grid grid-cols-2 gap-3 border-t px-5 py-3 sm:px-6">
      {/* Streak */}
      <div className="rounded-xl border border-border/50 p-3">
        <StreakTierIndicator streak={streak} lang={lang} variant="expanded" />
      </div>

      {/* Rank */}
      <div className="space-y-2 rounded-xl border border-border/50 p-3">
        <div className="flex items-center gap-1.5">
          <RankIcon className="size-3.5 text-primary" />
          <span className="text-[10px] font-bold text-muted-foreground">Rank</span>
        </div>
        <p className="text-lg font-black leading-none text-primary">
          {rankLabels[currentLevel]}
        </p>
        {!isMaxRank ? (
          <div className="space-y-0.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] tabular-nums text-muted-foreground">
              {lifetimeEarned.toLocaleString()} / {nextThreshold!.toLocaleString()} pt
            </p>
          </div>
        ) : (
          <p className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            <Trophy className="size-2.5" />
            {lang === "TH" ? "สูงสุดแล้ว!" : lang === "JP" ? "最高！" : "Max!"}
          </p>
        )}
      </div>
    </div>
  );
}

export function DailyMissionsCard({
  lang,
  points,
  streak,
  level,
  lifetimeEarned,
  activeEvent,
  canCheckin,
  checkinLoading,
  onCheckin,
  mission,
  onClaimTask,
  onClaimBonus,
  onShare,
}: {
  lang: Language;
  points: number;
  streak: number;
  level: HoneyLevel | null;
  lifetimeEarned: number;
  activeEvent: ActiveEvent | null;
  canCheckin: boolean;
  checkinLoading: boolean;
  onCheckin: () => void;
  mission: MissionData | null;
  onClaimTask: (taskId: string) => void;
  onClaimBonus: () => void;
  onShare: (taskId: string) => void;
}) {
  const countdown = useCountdown();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimingBonus, setClaimingBonus] = useState(false);

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

  const tasks = mission?.tasks ?? [];
  const bonusClaimed = mission?.bonusClaimed ?? false;
  const perfectDayBonus = mission?.perfectDayBonus ?? 20;
  const totalReward = tasks.reduce((s, tk) => s + tk.reward, 0) + perfectDayBonus;
  const earnedReward = tasks.filter((tk) => tk.claimed).reduce((s, tk) => s + tk.reward, 0) + (bonusClaimed ? perfectDayBonus : 0);
  const allDone = tasks.every((tk) => tk.done);
  const allClaimed = tasks.every((tk) => tk.claimed);
  const completedCount = tasks.filter((tk) => tk.claimed).length;
  const progressPct = totalReward > 0 ? Math.round((earnedReward / totalReward) * 100) : 0;

  return (
    <div className="panel overflow-hidden">
      {/* Row 1: Honey balance + check-in */}
      <div className="flex items-center gap-x-4 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <span className="text-base leading-none">🍯</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Honey</p>
            <p className="text-2xl font-extrabold tabular-nums leading-tight text-primary">
              🍯 {points.toLocaleString()}
            </p>
          </div>
        </div>

        {activeEvent && (
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
            <Sparkles className="size-3 text-primary" />
            <span className="text-xs font-bold text-primary">{activeEvent.honeyMultiplier}x</span>
          </div>
        )}

        <div className="ml-auto shrink-0">
          {canCheckin ? (
            <Button
              onClick={onCheckin}
              disabled={checkinLoading}
              size="sm"
              className="relative h-9 gap-1.5 bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <span className="absolute -right-1 -top-1 flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-red-500" />
              </span>
              <Calendar className="size-4" />
              {t(lang, "dailyCheckin")}
              <span className="ml-0.5 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                +{streak >= 30 ? 30 : streak >= 7 ? 20 : 10} 🍯
              </span>
            </Button>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-price-up/10 px-3 py-1.5 text-xs font-medium text-price-up">
              <CheckCircle2 className="size-3.5" />
              {t(lang, "checkinDone")}
            </span>
          )}
        </div>
      </div>

      {/* Row 1.5: Streak + Rank cards */}
      <MobileStreakRankRow lang={lang} streak={streak} level={level} lifetimeEarned={lifetimeEarned} />

      {/* Row 2: Mission progress + countdown */}
      <div className="flex items-center gap-4 border-t px-5 py-3 sm:px-6">
        <h2 className="shrink-0 text-sm font-bold">{t(lang, "dailyMissions")}</h2>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", allClaimed && bonusClaimed ? "bg-price-up" : "bg-primary")}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
          {completedCount}/{tasks.length}
        </span>
        <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span className="font-mono tabular-nums">{countdown}</span>
        </div>
      </div>

      {/* Row 3: Quest cards */}
      {tasks.length > 0 && (
        <div className="flex gap-3 overflow-x-auto border-t px-5 py-4 scrollbar-none sm:px-6">
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
                  "flex w-48 shrink-0 flex-col rounded-2xl border p-4 transition-all sm:w-52",
                  task.claimed
                    ? "border-price-up/20 bg-price-up/[0.03]"
                    : canClaim
                      ? "border-primary/30 bg-primary/[0.03] ring-1 ring-primary/10"
                      : "border-border/50 bg-card",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    task.claimed
                      ? "bg-price-up/15 text-price-up"
                      : task.done
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                  )}>
                    {task.claimed ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
                  </div>
                  <span className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold tabular-nums",
                    task.claimed ? "bg-price-up/10 text-price-up" : "bg-primary/10 text-primary",
                  )}>
                    +{task.reward} <span className="text-[10px] leading-none">🍯</span>
                  </span>
                </div>

                <p className={cn(
                  "mt-3 text-sm font-semibold leading-tight",
                  task.claimed && "text-muted-foreground line-through",
                )}>
                  {t(lang, task.labelKey as TranslationKey)}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {t(lang, task.hintKey as TranslationKey)}
                </p>

                <div className="mt-auto pt-3">
                  {task.claimed ? (
                    <div className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-price-up/10 text-xs font-semibold text-price-up">
                      <CheckCircle2 className="size-4" />
                      {lang === "TH" ? "เสร็จสิ้น" : lang === "JP" ? "完了" : "Done"}
                    </div>
                  ) : canClaim ? (
                    <Button
                      size="sm"
                      disabled={isClaiming}
                      onClick={() => handleClaimTask(task.id)}
                      className="h-9 w-full gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                      <Gift className="size-4" />
                      {isClaiming
                        ? "..."
                        : lang === "TH" ? "รับรางวัล" : lang === "JP" ? "受取" : "Claim"}
                    </Button>
                  ) : isManual && !task.done ? (
                    <Button
                      size="sm"
                      onClick={() => onShare(task.id)}
                      className="h-9 w-full gap-1.5 rounded-xl border border-primary/25 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/15"
                    >
                      <Share2 className="size-4" />
                      {lang === "TH" ? "แชร์เลย" : lang === "JP" ? "シェア" : "Share"}
                    </Button>
                  ) : href ? (
                    <NextLink href={href}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-full gap-1.5 rounded-xl text-xs font-semibold"
                      >
                        {lang === "TH" ? "ไปทำเลย" : lang === "JP" ? "やってみる" : "Go"}
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </NextLink>
                  ) : (
                    <div className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                      <Lock className="size-3.5" />
                      {lang === "TH" ? "ยังไม่สำเร็จ" : lang === "JP" ? "未完了" : "Incomplete"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Perfect Day bonus card */}
          <div className={cn(
            "flex w-48 shrink-0 flex-col rounded-2xl border border-dashed p-4 transition-all sm:w-52",
            bonusClaimed
              ? "border-price-up/20 bg-price-up/[0.03]"
              : allDone && allClaimed
                ? "border-primary/30 bg-primary/[0.03] ring-1 ring-primary/10"
                : "border-border/50 bg-card",
          )}>
            <div className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              bonusClaimed
                ? "bg-price-up/15 text-price-up"
                : allDone && allClaimed
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
            )}>
              {bonusClaimed ? <CheckCircle2 className="size-5" /> : <Star className="size-5" />}
            </div>

            <p className={cn(
              "mt-3 text-sm font-semibold leading-tight",
              bonusClaimed && "text-muted-foreground line-through",
            )}>
              Perfect Day!
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {lang === "TH" ? "ทำภารกิจครบทุกอัน" : lang === "JP" ? "全ミッション達成" : "Complete all missions"}
            </p>

            <div className="mt-auto pt-3">
              {bonusClaimed ? (
                <div className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-price-up/10 text-xs font-semibold text-price-up">
                  <CheckCircle2 className="size-4" />+{perfectDayBonus} <span className="text-[10px] leading-none">🍯</span>
                </div>
              ) : allDone && allClaimed ? (
                <Button
                  size="sm"
                  disabled={claimingBonus}
                  onClick={handleClaimBonus}
                  className="h-9 w-full gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Gift className="size-4" />
                  {claimingBonus ? "..." : lang === "TH" ? "รับรางวัล" : lang === "JP" ? "受取" : "Claim"}
                </Button>
              ) : (
                <div className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                  <Lock className="size-3.5" />+{perfectDayBonus} <span className="text-[10px] leading-none">🍯</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
