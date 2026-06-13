"use client";

import { useState } from "react";
import { Circle, Clock, Share2 } from "lucide-react";

import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { useCountdown } from "../hooks/use-countdown";
import type { MissionData } from "../types";
import { ICON_MAP } from "./missions-types";
import { ClaimButton, MissionCard } from "./mission-card";
import { BonusRow } from "./_shared/bonus-row";
import { HeaderPill, SectionHeader } from "./_shared/section-header";

function todayMissionsTitle(lang: Language): string {
  if (lang === "TH") return "ภารกิจวันนี้";
  if (lang === "JP") return "今日のミッション";
  return "Today's missions";
}

function todayMissionsDescription(lang: Language): string {
  if (lang === "TH") return "ทำภารกิจเพื่อรับ Honey และโบนัสรายวัน — รีเซ็ตทุกเที่ยงคืน";
  if (lang === "JP") return "ミッション達成で毎日Honeyとボーナスを獲得 — 深夜にリセット";
  return "Complete missions to earn Honey and a daily bonus — resets at midnight";
}

/* ------------------------------------------------------------------ */
/*  MissionsCard — daily missions checklist + perfect-day bonus        */
/* ------------------------------------------------------------------ */

export function MissionsCard({
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

  const header = (
    <SectionHeader
      title={todayMissionsTitle(lang)}
      description={todayMissionsDescription(lang)}
      pill={
        <HeaderPill icon={Clock} tone="primary">
          <span className="font-mono">{countdown}</span>
        </HeaderPill>
      }
    />
  );

  if (!mission) {
    return (
      <section className="space-y-3">
        {header}
        <div className="rounded-xl border bg-card px-4 py-6 text-center">
          <p className="text-meta">{t(lang, "missionAutoHint")}</p>
        </div>
      </section>
    );
  }

  const { tasks, bonusClaimed, perfectDayBonus } = mission;
  const completedCount = tasks.filter((tk) => tk.claimed).length;
  const allClaimed = tasks.every((tk) => tk.claimed);
  const allDone = tasks.every((tk) => tk.done);

  return (
    <section className="space-y-3">
      {header}

      <div className="overflow-hidden rounded-xl border bg-card">
        <BonusRow
          title={t(lang, "missionBonusDesc")}
          completed={completedCount}
          total={tasks.length}
          honey={perfectDayBonus}
          claimed={bonusClaimed}
          action={
            <ClaimButton
              lang={lang}
              claimed={bonusClaimed}
              canClaim={allDone && allClaimed && !bonusClaimed}
              isClaiming={claimingBonus}
              onClaim={handleClaimBonus}
            />
          }
        />
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
                      className="inline-flex h-8 items-center gap-1 rounded-lg border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
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
