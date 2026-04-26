"use client";

import { useState } from "react";
import { Award, Calendar, CheckCircle2, Gift, Share2 } from "lucide-react";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { useMonthCountdown } from "../hooks/use-countdown";
import type { RaffleMissionsData } from "../types";
import { MONTHLY_ICON_MAP } from "./missions-types";
import { ClaimButton, MissionCard, RewardBadges } from "./mission-card";

export function MonthlyMissionsPanel({
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
            <ClaimButton
              lang={lang}
              claimed={bonus.claimed}
              canClaim={bonus.done && !bonus.claimed}
              isClaiming={claimingBonus}
              onClaim={handleClaimBonus}
            />
          </div>
        </div>
      </div>

      {/* Task cards */}
      <div className="grid grid-cols-1 gap-px bg-border/40 sm:grid-cols-2">
        {data.tasks.map((task) => {
          const Icon = MONTHLY_ICON_MAP[task.icon] ?? Gift;
          const hintText = t(lang, task.hintKey as TranslationKey)
            .replace("{target}", String(task.target));

          return (
            <MissionCard
              key={task.id}
              lang={lang}
              icon={Icon}
              labelKey={task.labelKey}
              hintText={hintText}
              honey={task.reward.honey}
              ticket={task.reward.ticket}
              claimed={task.claimed}
              canClaim={task.done && !task.claimed}
              isClaiming={claimingId === task.id}
              onClaim={() => handleClaim(task.id)}
              progress={task.progress}
              target={task.target}
              shareButton={
                task.trackType === "manual" && !task.claimed && !task.done ? (
                  <button onClick={handleShare} className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80">
                    <Share2 className="size-2.5" />
                    {lang === "TH" ? "แชร์" : lang === "JP" ? "シェア" : "Share"}
                  </button>
                ) : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
