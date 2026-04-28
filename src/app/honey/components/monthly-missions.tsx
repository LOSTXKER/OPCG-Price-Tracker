"use client";

import { useState } from "react";
import { Award, Calendar, CheckCircle2, Gift, Share2 } from "lucide-react";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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
    <section className="space-y-3">
      {/* Section header — flat */}
      <div className="flex items-start justify-between gap-2 px-1">
        <div>
          <p className="text-eyebrow text-primary/80">
            {lang === "TH" ? "ประจำเดือน · ตั๋ว" : lang === "JP" ? "月間 · チケット" : "Monthly · Tickets"}
          </p>
          <h2 className="mt-0.5 text-h3">{t(lang, "raffleSpecialMissions")}</h2>
          <p className="mt-0.5 text-meta">
            {t(lang, "raffleSpecialMissionsDesc")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
          <Calendar className="size-3.5" />
          <span className="tabular-nums">{monthCountdownText}</span>
        </div>
      </div>

      {/* Bonus card — standard surface with a thin left accent stripe in primary */}
      <div className="relative flex items-center gap-3 overflow-hidden rounded-xl border bg-card p-3.5">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-primary/70" />

        <div className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          bonus.claimed
            ? "bg-price-up/15 text-price-up"
            : "bg-primary/15 text-primary",
        )}>
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
            <div className="mt-1.5 h-1 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/80 transition-all"
                style={{ width: `${completedPct}%` }}
              />
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

      {/* Mission grid */}
      <div className="overflow-hidden rounded-xl border bg-card">
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
                task={task}
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
                ctaPath={task.ctaPath ?? null}
                shareButton={
                  task.trackType === "manual" && !task.claimed && !task.done ? (
                    <button
                      onClick={handleShare}
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
