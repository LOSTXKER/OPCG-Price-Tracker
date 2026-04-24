"use client";

import { useEffect, useRef, useState } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Check,
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
  Ticket,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCountdown, useMonthCountdown } from "../hooks/use-countdown";
import type { MissionData, RaffleMissionsData } from "../types";

const MONTHLY_ICON_MAP: Record<string, typeof Award> = {
  Share2,
  Layers,
  Search,
  TrendingUp,
};

const ICON_MAP: Record<string, typeof Award> = {
  Search, TrendingUp, Package, Layers, ShoppingBag, BarChart3, Circle, Share2, Link,
  BookOpen, Wallet, Eye,
};


export function MissionsTab({
  lang,
  mission,
  raffleMissions,
  onClaimTask,
  onClaimBonus,
  onShare,
  onTrackRaffleMission,
  onClaimRaffleMission,
  onClaimRaffleMissionBonus,
}: {
  lang: Language;
  mission: MissionData | null;
  raffleMissions: RaffleMissionsData | null;
  onClaimTask: (taskId: string) => void;
  onClaimBonus: () => void;
  onShare: (taskId: string) => void;
  onTrackRaffleMission: (missionId: string) => void;
  onClaimRaffleMission: (missionId: string) => void;
  onClaimRaffleMissionBonus: () => void;
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
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const allComplete = allClaimed && bonusClaimed;

  useEffect(() => {
    if (allComplete && !prevAllComplete.current) {
      setCollapsed(true);
    }
    prevAllComplete.current = allComplete;
  }, [allComplete]);

  if (allComplete && collapsed) {
    return (
      <div className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              +{earnedReward} 🍯{" "}
              {lang === "TH" ? "วันนี้" : lang === "JP" ? "今日" : "today"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="size-3" />
              <span className="font-mono tabular-nums">{countdown}</span>
            </div>
            <ChevronDown className="size-4" />
          </div>
        </button>
        {raffleMissions && (
          <MonthlyMissionsPanel
            lang={lang}
            data={raffleMissions}
            onTrack={onTrackRaffleMission}
            onClaim={onClaimRaffleMission}
            onClaimBonus={onClaimRaffleMissionBonus}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Daily Missions — grouped container */}
      <div className="overflow-hidden rounded-xl border">
        {/* Header + Bonus */}
        <div className="border-b">
          <div className="flex items-start justify-between gap-2 px-4 py-3.5">
            <div>
              <h2 className="text-lg font-semibold">{t(lang, "dailyMissions")}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {lang === "TH" ? "ทำภารกิจเพื่อรับ Honey ฟรีทุกวัน" : lang === "JP" ? "毎日ミッションをクリアしてHoneyを獲得" : "Complete missions to earn free Honey daily"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span className="font-mono tabular-nums">{countdown}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t bg-muted/10 p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              {bonusClaimed ? <CheckCircle2 className="size-5" /> : <Award className="size-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">
                {t(lang, "missionBonusDesc")}
                <span className="ml-1.5 text-xs font-semibold tabular-nums text-muted-foreground">
                  ({completedCount}/{tasks.length})
                </span>
              </p>
              <RewardBadges lang={lang} honey={perfectDayBonus} ticket={0} muted={bonusClaimed} />
              {!bonusClaimed && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0">
              {bonusClaimed ? (
                <CheckCircle2 className="size-4 text-muted-foreground" />
              ) : allDone && allClaimed ? (
                <Button
                  size="sm"
                  disabled={claimingBonus}
                  onClick={handleClaimBonus}
                  className="relative h-8 gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                >
                  <span className="absolute -right-1 -top-1 flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
                  </span>
                  <Gift className="size-3.5" />
                  {claimingBonus ? "..." : t(lang, "claimTaskReward")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled
                  className="h-8 gap-1.5 rounded-lg bg-muted px-3 text-xs font-bold text-muted-foreground"
                >
                  {t(lang, "claimTaskReward")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Task cards nested inside the same container */}
        <div className="grid grid-cols-1 gap-px bg-border/40 sm:grid-cols-2">
          {tasks.map((task) => {
              const Icon = ICON_MAP[task.icon] ?? Circle;
              const isManual = task.trackType === "manual";
              const canClaim = task.done && !task.claimed;
              const isClaiming = claimingId === task.id;

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3.5 bg-background p-4 transition-all"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    {task.claimed ? <CheckCircle2 className="size-4.5" /> : <Icon className="size-4.5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-xs font-semibold",
                      task.claimed && "text-muted-foreground line-through",
                    )}>
                      {t(lang, task.labelKey as TranslationKey)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {t(lang, task.hintKey as TranslationKey)}
                    </p>
                    <RewardBadges lang={lang} honey={task.reward} ticket={0} muted={task.claimed} />
                    {isManual && !task.claimed && !task.done && (
                      <button onClick={() => onShare(task.id)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
                        <Share2 className="size-3" />
                        {lang === "TH" ? "แชร์" : lang === "JP" ? "シェア" : "Share"}
                      </button>
                    )}
                  </div>

                  <div className="shrink-0">
                    {task.claimed ? (
                      <CheckCircle2 className="size-4 text-muted-foreground" />
                    ) : canClaim ? (
                      <Button
                        size="sm"
                        disabled={isClaiming}
                        onClick={() => handleClaimTask(task.id)}
                        className="relative h-8 gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                      >
                        <span className="absolute -right-1 -top-1 flex size-2.5">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
                        </span>
                        <Gift className="size-3.5" />
                        {isClaiming ? "..." : t(lang, "claimTaskReward")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled
                        className="h-8 gap-1.5 rounded-lg bg-muted px-3 text-xs font-bold text-muted-foreground"
                      >
                        {t(lang, "claimTaskReward")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Monthly special missions */}
      {raffleMissions && (
        <MonthlyMissionsPanel
          lang={lang}
          data={raffleMissions}
          onTrack={onTrackRaffleMission}
          onClaim={onClaimRaffleMission}
          onClaimBonus={onClaimRaffleMissionBonus}
        />
      )}
    </div>
  );
}

/* ── Monthly Missions Panel ── */


function RewardLabel({ honey, ticket }: { honey: number; ticket: number }) {
  if (ticket > 0) return <><Ticket className="size-3" /> +{ticket}</>;
  return <><span className="text-xs leading-none">🍯</span> +{honey}</>;
}

function RewardBadges({ lang, honey, ticket, muted }: { lang: Language; honey: number; ticket: number; muted?: boolean }) {
  return (
    <div className={cn("mt-1.5 flex items-center gap-1.5", muted && "opacity-40")}>
      <span className="text-xs text-muted-foreground">{t(lang, "rewardPrefix")}</span>
      {honey > 0 && (
        <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
          <span className="text-xs leading-none">🍯</span>
          <span className="tabular-nums">x{honey}</span>
        </span>
      )}
      {ticket > 0 && (
        <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
          <Ticket className="size-3 text-primary" />
          <span className="tabular-nums">x{ticket}</span>
        </span>
      )}
    </div>
  );
}

function MonthlyMissionsPanel({
  lang,
  data,
  onTrack,
  onClaim,
  onClaimBonus,
}: {
  lang: Language;
  data: RaffleMissionsData;
  onTrack: (missionId: string) => void;
  onClaim: (missionId: string) => void;
  onClaimBonus: () => void;
}) {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const monthLeft = useMonthCountdown();

  const handleShare = async () => {
    const url = window.location.origin + "/honey";
    try {
      if (navigator.share) {
        await navigator.share({ title: "OPCG Raffle", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      onTrack("share_raffle");
    } catch { /* user cancelled */ }
  };

  const handleClaim = async (taskId: string) => {
    setClaimingId(taskId);
    await onClaim(taskId);
    setClaimingId(null);
  };

  const handleClaimBonus = async () => {
    setClaimingBonus(true);
    await onClaimBonus();
    setClaimingBonus(false);
  };

  const monthCountdownText = t(lang, "monthlyMissionDaysLeft")
    .replace("{days}", String(monthLeft.days))
    .replace("{hours}", String(monthLeft.hours));

  const completedPct = data.totalCount > 0
    ? Math.round((data.completedCount / data.totalCount) * 100)
    : 0;
  const { bonus } = data;
  const canClaimBonus = bonus.done && !bonus.claimed;

  return (
    <div className="overflow-hidden rounded-xl border bg-muted/[0.02]">
      {/* Header + Bonus */}
      <div className="border-b">
          <div className="flex items-start justify-between gap-2 px-4 py-3.5">
          <div>
            <h2 className="text-lg font-semibold">{t(lang, "raffleSpecialMissions")}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t(lang, "raffleSpecialMissionsDesc")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            <span className="tabular-nums">{monthCountdownText}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t bg-muted/10 p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            {bonus.claimed ? <CheckCircle2 className="size-5" /> : <Award className="size-5" />}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">
              {t(lang, "missionBonusDesc")}
              <span className="ml-1.5 text-xs font-semibold tabular-nums text-muted-foreground">
                ({data.completedCount}/{data.totalCount})
              </span>
            </p>
            <RewardBadges lang={lang} honey={bonus.reward.honey} ticket={bonus.reward.ticket} muted={bonus.claimed} />
            {!bonus.claimed && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${completedPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0">
            {bonus.claimed ? (
              <CheckCircle2 className="size-4 text-muted-foreground" />
            ) : canClaimBonus ? (
              <Button
                size="sm"
                disabled={claimingBonus}
                onClick={handleClaimBonus}
                className="relative h-8 gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90"
              >
                <span className="absolute -right-1 -top-1 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
                </span>
                <Gift className="size-3.5" />
                {claimingBonus ? "..." : t(lang, "claimTaskReward")}
              </Button>
            ) : (
              <Button
                size="sm"
                disabled
                className="h-8 gap-1.5 rounded-lg bg-muted px-3 text-xs font-bold text-muted-foreground"
              >
                {t(lang, "claimTaskReward")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Task cards nested inside the same container */}
      <div className="grid grid-cols-1 gap-px bg-border/40 sm:grid-cols-2">
        {data.tasks.map((task) => {
            const Icon = MONTHLY_ICON_MAP[task.icon] ?? Gift;
            const canClaim = task.done && !task.claimed;
            const isClaiming = claimingId === task.id;
            const hintText = t(lang, task.hintKey as TranslationKey)
              .replace("{target}", String(task.target));

            return (
              <div
                key={task.id}
                className="flex items-center gap-3.5 bg-background p-4 transition-all"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  {task.claimed ? <CheckCircle2 className="size-4.5" /> : <Icon className="size-4.5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-xs font-semibold",
                    task.claimed && "text-muted-foreground line-through",
                  )}>
                    {t(lang, task.labelKey as TranslationKey)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {hintText}
                    {task.target > 1 && (
                      <span className="ml-1 font-semibold tabular-nums">({task.progress}/{task.target})</span>
                    )}
                  </p>
                  <RewardBadges lang={lang} honey={task.reward.honey} ticket={task.reward.ticket} muted={task.claimed} />
                  {task.trackType === "manual" && !task.claimed && !task.done && (
                    <button onClick={handleShare} className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80">
                      <Share2 className="size-2.5" />
                      {lang === "TH" ? "แชร์" : lang === "JP" ? "シェア" : "Share"}
                    </button>
                  )}
                </div>

                <div className="shrink-0">
                  {task.claimed ? (
                    <CheckCircle2 className="size-4 text-muted-foreground" />
                  ) : canClaim ? (
                    <Button
                      size="sm"
                      disabled={isClaiming}
                      onClick={() => handleClaim(task.id)}
                      className="relative h-8 gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                    >
                      <span className="absolute -right-1 -top-1 flex size-2.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
                      </span>
                      <Gift className="size-3.5" />
                      {isClaiming ? "..." : t(lang, "claimTaskReward")}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled
                      className="h-8 gap-1.5 rounded-lg bg-muted px-3 text-xs font-bold text-muted-foreground"
                    >
                      {t(lang, "claimTaskReward")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
