"use client";

import { useState } from "react";
import { Award, CheckCircle2, Circle, Clock, Share2 } from "lucide-react";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { useCountdown } from "../hooks/use-countdown";
import type { MissionData } from "../types";
import { ICON_MAP } from "./missions-types";
import { ClaimButton, MissionCard, RewardBadges } from "./mission-card";

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

  return (
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
            <ClaimButton
              lang={lang}
              claimed={bonusClaimed}
              canClaim={allDone && allClaimed && !bonusClaimed}
              isClaiming={claimingBonus}
              onClaim={handleClaimBonus}
            />
          </div>
        </div>
      </div>

      {/* Task cards */}
      <div className="grid grid-cols-1 gap-px bg-border/40 sm:grid-cols-2">
        {tasks.map((task) => {
          const Icon = ICON_MAP[task.icon] ?? Circle;
          return (
            <MissionCard
              key={task.id}
              lang={lang}
              icon={Icon}
              labelKey={task.labelKey}
              hintText={t(lang, task.hintKey as TranslationKey)}
              honey={task.reward}
              ticket={0}
              claimed={task.claimed}
              canClaim={task.done && !task.claimed}
              isClaiming={claimingId === task.id}
              onClaim={() => handleClaimTask(task.id)}
              shareButton={
                task.trackType === "manual" && !task.claimed && !task.done ? (
                  <button onClick={() => onShare(task.id)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
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
  );
}
