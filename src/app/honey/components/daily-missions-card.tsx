"use client";

import { useState } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
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
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCountdown } from "../hooks/use-countdown";
import type { MissionData, MissionTaskItem } from "../types";

const ICON_MAP: Record<string, typeof Award> = {
  Search, TrendingUp, Package, Layers, ShoppingBag, BarChart3, Circle, Share2, Link,
  BookOpen, Wallet, Eye,
};

export function DailyMissionsCard({
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
      <div className="panel p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">{t(lang, "dailyMissions")}</h2>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t(lang, "missionAutoHint")}</p>
      </div>
    );
  }

  const { tasks, progress, perfectDay, bonusClaimed, perfectDayBonus } = mission;
  const totalReward = tasks.reduce((s, tk) => s + tk.reward, 0) + perfectDayBonus;
  const earnedReward = tasks.filter((tk) => tk.claimed).reduce((s, tk) => s + tk.reward, 0) + (bonusClaimed ? perfectDayBonus : 0);
  const allDone = tasks.every((tk) => tk.done);
  const allClaimed = tasks.every((tk) => tk.claimed);
  const progressPct = totalReward > 0 ? Math.round((earnedReward / totalReward) * 100) : 0;

  return (
    <div className="panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary" />
          <h2 className="text-xs font-semibold">{t(lang, "dailyMissions")}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="size-3" />
            <span className="font-mono text-[10px] tabular-nums">{countdown}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold tabular-nums text-primary">{earnedReward}/{totalReward}</span>
            <div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", allClaimed && bonusClaimed ? "bg-price-up" : "bg-primary")}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Task grid -- 2 columns on sm+ */}
      <div className="grid grid-cols-1 gap-px border-t bg-border/40 sm:grid-cols-2">
        {tasks.map((task) => {
          const Icon = ICON_MAP[task.icon] ?? Circle;
          const isManual = task.trackType === "manual";
          const canClaim = task.done && !task.claimed;
          const isClaiming = claimingId === task.id;

          return (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-2.5 bg-background px-3 py-2",
                task.claimed && "bg-price-up/5",
              )}
            >
              <div className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
                task.claimed
                  ? "bg-price-up/15 text-price-up"
                  : task.done
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
              )}>
                {task.claimed ? <CheckCircle2 className="size-3.5" /> : <Icon className="size-3" />}
              </div>

              <p className={cn(
                "min-w-0 flex-1 truncate text-[11px] font-medium",
                task.claimed && "text-muted-foreground line-through",
              )}>
                {t(lang, task.labelKey as TranslationKey)}
              </p>

              <div className="shrink-0">
                {task.claimed ? (
                  <span className="text-[10px] font-semibold tabular-nums text-price-up">+{task.reward}</span>
                ) : canClaim ? (
                  <Button
                    size="sm"
                    disabled={isClaiming}
                    onClick={() => handleClaimTask(task.id)}
                    className="h-6 gap-0.5 rounded-full border border-primary/20 bg-primary/10 px-2 text-[10px] font-semibold text-primary hover:bg-primary/20"
                  >
                    <Gift className="size-2.5" />
                    {isClaiming ? "..." : `+${task.reward}`}
                  </Button>
                ) : isManual && !task.done ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onShare(task.id)}
                    className="h-6 gap-0.5 rounded-full px-2 text-[10px]"
                  >
                    <Share2 className="size-2.5" />
                    +{task.reward}
                  </Button>
                ) : (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                    <Lock className="size-2.5" /> +{task.reward}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Perfect Day inline bar */}
      <div className={cn(
        "flex items-center gap-2.5 border-t px-3 py-2",
        bonusClaimed && "bg-price-up/5",
      )}>
        <div className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
          bonusClaimed
            ? "bg-price-up/15 text-price-up"
            : allDone && allClaimed
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
        )}>
          {bonusClaimed ? <CheckCircle2 className="size-3.5" /> : <Sparkles className="size-3" />}
        </div>

        <p className={cn(
          "min-w-0 flex-1 text-[11px] font-medium",
          bonusClaimed && "text-muted-foreground line-through",
        )}>
          {t(lang, "missionPerfectDay")}
        </p>

        <div className="shrink-0">
          {bonusClaimed ? (
            <span className="text-[10px] font-semibold tabular-nums text-price-up">+{perfectDayBonus}</span>
          ) : allDone && allClaimed ? (
            <Button
              size="sm"
              disabled={claimingBonus}
              onClick={handleClaimBonus}
              className="h-6 gap-0.5 rounded-full border border-price-up/20 bg-price-up/10 px-2 text-[10px] font-semibold text-price-up hover:bg-price-up/20"
            >
              <Gift className="size-2.5" />
              {claimingBonus ? "..." : `+${perfectDayBonus}`}
            </Button>
          ) : (
            <span className="flex items-center gap-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
              <Lock className="size-2.5" /> +{perfectDayBonus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
