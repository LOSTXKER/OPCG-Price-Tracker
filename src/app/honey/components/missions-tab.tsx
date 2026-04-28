"use client";

import { type Language } from "@/lib/i18n";
import type { MissionData, RaffleMissionsData } from "../types";
import { MissionsCard, StreakCard } from "./today-card";
import { MonthlyMissionsPanel } from "./monthly-missions";

export function MissionsTab({
  lang,
  mission,
  raffleMissions,
  streak,
  canCheckin,
  canClaimFree,
  checkinLoading,
  claimFreeLoading,
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
  onCheckin: () => void;
  onClaimFreeTicket: () => void;
  onClaimTask: (taskId: string) => void;
  onClaimBonus: () => void;
  onShare: (taskId: string) => void;
  onTrackRaffleMission: (missionId: string) => void;
  onClaimRaffleMission: (missionId: string) => void;
  onClaimRaffleMissionBonus: () => void;
}) {
  return (
    <div className="space-y-6">
      <StreakCard
        lang={lang}
        streak={streak}
        canCheckin={canCheckin}
        canClaimFree={canClaimFree}
        checkinLoading={checkinLoading}
        claimFreeLoading={claimFreeLoading}
        onCheckin={onCheckin}
        onClaimFreeTicket={onClaimFreeTicket}
      />
      <MissionsCard
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
