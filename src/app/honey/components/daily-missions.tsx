"use client";

import { useState } from "react";
import { Award, CheckCircle2, Circle, Clock, Share2 } from "lucide-react";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCountdown } from "../hooks/use-countdown";
import type { MissionData } from "../types";
import { ICON_MAP } from "./missions-types";
import { ClaimButton, MissionCard, RewardBadges } from "./mission-card";

function parseHours(countdown: string): number {
  const h = parseInt(countdown.slice(0, 2), 10);
  return Number.isFinite(h) ? h : 24;
}

export function DailyMissions({
  lang,
  mission,
  onClaimTask,
  onClaimBonus,
  onShare,
}: {
  lang: Language;
  mission: MissionData;
  onClaimTask: (taskId: string) => void;
  onClaimBonus: () => void;
  onShare: (taskId: string) => void;
}) {
  const countdown = useCountdown();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimingBonus, setClaimingBonus] = useState(false);

  const { tasks, bonusClaimed, perfectDayBonus } = mission;
  const completedCount = tasks.filter((tk) => tk.claimed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const allDone = tasks.every((tk) => tk.done);
  const allClaimed = tasks.every((tk) => tk.claimed);

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

  const countdownUrgent = parseHours(countdown) < 1;

  return (
    <section className="space-y-3">
      {/* Section header — flat, no panel; lets the bonus card below stand alone */}
      <div className="flex items-start justify-between gap-2 px-1">
        <div>
          <p className="text-eyebrow">
            {lang === "TH" ? "รายวัน" : lang === "JP" ? "デイリー" : "Daily"}
          </p>
          <h2 className="mt-0.5 text-h3">{t(lang, "dailyMissions")}</h2>
          <p className="mt-0.5 text-meta">
            {lang === "TH" ? "ทำภารกิจเพื่อรับ Honey ฟรีทุกวัน" : lang === "JP" ? "毎日ミッションをクリアしてHoneyを獲得" : "Complete missions to earn free Honey daily"}
          </p>
        </div>
        <div className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold",
          countdownUrgent
            ? "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
            : "bg-muted/50 text-muted-foreground",
        )}>
          <Clock className="size-3.5" />
          <span className="font-mono tabular-nums">{countdown}</span>
        </div>
      </div>

      {/* Bonus card — standard card surface with a thin left accent stripe so it
          reads as a highlighted summary row, not a glowing standalone block */}
      <div className="relative flex items-center gap-3 overflow-hidden rounded-xl border bg-card p-3.5">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-amber-500/70 dark:bg-amber-400/80" />

        <div className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          bonusClaimed
            ? "bg-price-up/15 text-price-up"
            : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
        )}>
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
            <div className="mt-1.5 h-1 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-500/80 transition-all dark:bg-amber-400/80"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>

        <div className="shrink-0">
          <ClaimButton
            lang={lang}
            claimed={bonusClaimed}
            canClaim={allDone && allClaimed && !bonusClaimed}
            isClaiming={claimingBonus}
            onClaim={handleClaimBonus}
          />
        </div>
      </div>

      {/* Mission grid — own panel, clean grid of tiles */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-1 gap-px bg-border/40 sm:grid-cols-2">
          {tasks.map((task) => {
            const Icon = ICON_MAP[task.icon] ?? Circle;
            return (
              <MissionCard
                key={task.id}
                lang={lang}
                icon={Icon}
                task={task}
                labelKey={task.labelKey}
                hintText={t(lang, task.hintKey as TranslationKey)}
                honey={task.reward}
                ticket={0}
                claimed={task.claimed}
                canClaim={task.done && !task.claimed}
                isClaiming={claimingId === task.id}
                onClaim={() => handleClaimTask(task.id)}
                ctaPath={task.ctaPath}
                shareButton={
                  task.trackType === "manual" && !task.claimed && !task.done ? (
                    <button
                      onClick={() => onShare(task.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border bg-background px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                    >
                      <Share2 className="size-3" />
                      {lang === "TH" ? "แชร์" : lang === "JP" ? "シェア" : "Share"}
                    </button>
                  ) : undefined
                }
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
