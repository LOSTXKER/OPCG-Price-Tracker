"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Clock } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { useCountdown } from "../hooks/use-countdown";
import type { HoneyLevel, MissionData, RaffleMissionsData, ShopItem } from "../types";
import { CheckinStreakSection } from "./checkin-streak-section";
import { DailyMissions } from "./daily-missions";
import { MonthlyMissionsPanel } from "./monthly-missions";
import { NextGoalHint } from "./next-goal-hint";

export function MissionsTab({
  lang,
  mission,
  raffleMissions,
  streak,
  canCheckin,
  canClaimFree,
  checkinLoading,
  claimFreeLoading,
  points,
  level,
  shopItems,
  onCheckin,
  onClaimFreeTicket,
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
  streak: number;
  canCheckin: boolean;
  canClaimFree: boolean;
  checkinLoading: boolean;
  claimFreeLoading: boolean;
  points: number;
  level: HoneyLevel | null;
  shopItems: ShopItem[];
  onCheckin: () => void;
  onClaimFreeTicket: () => void;
  onClaimTask: (taskId: string) => void;
  onClaimBonus: () => void;
  onShare: (taskId: string) => void;
  onTrackRaffleMission: (missionId: string) => void;
  onClaimRaffleMission: (missionId: string) => void;
  onClaimRaffleMissionBonus: () => void;
}) {
  const countdown = useCountdown();
  const [collapsed, setCollapsed] = useState(false);
  const prevAllComplete = useRef(false);

  const checkinSection = (
    <CheckinStreakSection
      lang={lang}
      streak={streak}
      canCheckin={canCheckin}
      canClaimFree={canClaimFree}
      checkinLoading={checkinLoading}
      claimFreeLoading={claimFreeLoading}
      onCheckin={onCheckin}
      onClaimFreeTicket={onClaimFreeTicket}
    />
  );

  const allCompleteForEffect = mission
    ? mission.tasks.every((tk) => tk.claimed) && mission.bonusClaimed
    : false;

  useEffect(() => {
    if (allCompleteForEffect && !prevAllComplete.current) {
      setCollapsed(true);
    }
    prevAllComplete.current = allCompleteForEffect;
  }, [allCompleteForEffect]);

  if (!mission) {
    return (
      <div className="space-y-6">
        {checkinSection}
        <div className="panel p-6">
          <p className="text-sm text-muted-foreground">{t(lang, "missionAutoHint")}</p>
        </div>
      </div>
    );
  }

  const { tasks, bonusClaimed, perfectDayBonus } = mission;
  const earnedReward = tasks.filter((tk) => tk.claimed).reduce((s, tk) => s + tk.reward, 0) + (bonusClaimed ? perfectDayBonus : 0);
  const completedCount = tasks.filter((tk) => tk.claimed).length;
  const allClaimed = tasks.every((tk) => tk.claimed);
  const allComplete = allClaimed && bonusClaimed;

  if (allComplete && collapsed) {
    return (
      <div className="space-y-6">
        {checkinSection}
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
            <p className="text-meta">
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
    <div className="space-y-6">
      {checkinSection}
      <NextGoalHint
        lang={lang}
        shopItems={shopItems}
        points={points}
        level={level}
      />
      <DailyMissions
        lang={lang}
        mission={mission}
        onClaimTask={onClaimTask}
        onClaimBonus={onClaimBonus}
        onShare={onShare}
      />
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
