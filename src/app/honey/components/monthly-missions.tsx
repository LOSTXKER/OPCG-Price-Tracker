"use client";

import { useState } from "react";
import { Calendar, Gift, Share2 } from "lucide-react";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { useMonthCountdown } from "../hooks/use-countdown";
import type { RaffleMissionsData } from "../types";
import { MONTHLY_ICON_MAP } from "./missions-types";
import { ClaimButton, MissionCard } from "./mission-card";
import { BonusRow } from "./_shared/bonus-row";
import { HeaderPill, SectionHeader } from "./_shared/section-header";

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

  const { bonus } = data;

  return (
    <section className="space-y-3">
      <SectionHeader
        title={t(lang, "raffleSpecialMissions")}
        description={t(lang, "raffleSpecialMissionsDesc")}
        pill={
          <HeaderPill icon={Calendar} tone="primary">
            {monthCountdownText}
          </HeaderPill>
        }
      />

      <div className="overflow-hidden rounded-xl border bg-card">
        <BonusRow
          title={t(lang, "missionBonusDesc")}
          completed={data.completedCount}
          total={data.totalCount}
          honey={bonus.reward.honey}
          ticket={bonus.reward.ticket}
          claimed={bonus.claimed}
          action={
            <ClaimButton
              lang={lang}
              claimed={bonus.claimed}
              canClaim={bonus.done && !bonus.claimed}
              isClaiming={claimingBonus}
              onClaim={handleClaimBonus}
            />
          }
        />
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
                      className="inline-flex h-8 items-center gap-1 rounded-lg border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <Share2 className="size-3" />
                      {t(lang, "missionShareLabel")}
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
