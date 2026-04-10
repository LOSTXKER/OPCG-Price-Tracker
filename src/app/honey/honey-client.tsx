"use client";

import { useEffect, useRef, useState } from "react";
import { Award, CheckCircle2, Sparkles, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { useHoneyData } from "./hooks/use-honey-data";
import { t } from "@/lib/i18n";
import { HoneyStatusBar } from "./components/honey-sidebar";
import { MissionsTab } from "./components/missions-tab";
import { ActivityTab } from "./components/activity-tab";
import { AchievementsTab } from "./components/achievements-tab";
import { ShopTab } from "./components/shop-tab";
import { RaffleTab } from "./components/raffle-tab";
import { RankingsTab } from "./components/rankings-tab";
import { ReferralTab } from "./components/referral-tab";
import { HoneyMockPreview } from "./components/honey-mock-preview";
import { HONEY_TABS, type TabKey } from "./types";

export default function HoneyClient() {
  const { authed } = useAuthState();
  const lang = useUIStore((s) => s.language);

  if (authed === null) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (authed === false) {
    return <AuthPreviewGate preview={<HoneyMockPreview lang={lang} />} />;
  }

  return <HoneyContent />;
}

function HoneyContent() {
  const [tab, setTab] = useState<TabKey>("missions");
  const [checkinLoading, setCheckinLoading] = useState(false);

  const {
    lang,
    points, streak, canCheckin, transactions, shopItems, leaderboard,
    mission, level, lifetimeEarned, achievements,
    machines, myTickets, ticketBalance, canClaimFree, lastWinners,
    raffleMissions,
    activeEvent,
    referralUrl, referralTotalClicks, referralTodayClicks, referralConversions, referralEarned,
    loading, message, setMessage,
    actions,
  } = useHoneyData();

  const handleCheckin = async () => {
    setCheckinLoading(true);
    await actions.checkin();
    setCheckinLoading(false);
  };

  const handleShare = async (taskId: string) => {
    const url = taskId === "share_site"
      ? window.location.origin
      : window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: "OPCG Price Tracker", url });
        await actions.trackManualMission(taskId);
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      await actions.trackManualMission(taskId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const ticketsUsedThisMonth = Object.values(myTickets).reduce((s, n) => s + n, 0);

  const statusProps = {
    lang,
    points,
    ticketBalance,
    ticketsUsedThisMonth,
    streak,
    level,
    lifetimeEarned,
    activeEvent,
    canCheckin,
    checkinLoading,
    onCheckin: handleCheckin,
  } as const;

  const missionProps = {
    lang,
    mission,
    raffleMissions,
    onClaimTask: actions.claimTask,
    onClaimBonus: actions.claimBonus,
    onShare: handleShare,
    onTrackRaffleMission: actions.trackRaffleMission,
    onClaimRaffleMission: actions.claimRaffleMission,
    onClaimRaffleMissionBonus: actions.claimRaffleMissionBonusAction,
  } as const;

  const tabContent = (
    <>
      {tab === "missions" && (
        <MissionsTab {...missionProps} />
      )}
      {tab === "activity" && (
        <ActivityTab lang={lang} transactions={transactions} />
      )}
      {tab === "achievements" && (
        <AchievementsTab lang={lang} achievements={achievements} />
      )}
      {tab === "shop" && (
        <ShopTab lang={lang} shopItems={shopItems} points={points} onRedeem={actions.redeem} />
      )}
      {tab === "raffle" && (
        <RaffleTab
          lang={lang}
          machines={machines}
          myTickets={myTickets}
          ticketBalance={ticketBalance}
          canClaimFree={canClaimFree}
          lastWinners={lastWinners}
          onBuyTicket={actions.buyTicket}
          onClaimFreeTicket={actions.claimFreeTicket}
        />
      )}
      {tab === "rankings" && (
        <RankingsTab lang={lang} leaderboard={leaderboard} />
      )}
      {tab === "referral" && (
        <ReferralTab
          lang={lang}
          referralUrl={referralUrl}
          totalClicks={referralTotalClicks}
          todayClicks={referralTodayClicks}
          totalConversions={referralConversions}
          totalEarned={referralEarned}
        />
      )}
    </>
  );

  const tabBar = (
    <div className="flex gap-0.5 overflow-x-auto rounded-lg bg-muted/30 p-1 scrollbar-none">
      {HONEY_TABS.map((item) => {
        const Icon = item.icon;
        const active = tab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            title={t(lang, item.labelKey)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2.5 text-xs font-medium transition-all sm:px-4",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{t(lang, item.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <HoneyStatusBar {...statusProps} />
      {tabBar}
      {tabContent}
      <Toast message={message} onDismiss={() => setMessage(null)} />
    </div>
  );
}

function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!message) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timerRef.current);
  }, [message, onDismiss]);

  if (!message) return null;

  const lc = message.toLowerCase();
  const isMilestone = lc.includes("perfect") || lc.includes("level") || lc.includes("onboarding");
  const isEarn = lc.includes("check-in") || lc.includes("เช็คอิน") || lc.includes("mission") || lc.includes("ภารกิจ");

  const Icon = isMilestone ? Sparkles : isEarn ? CheckCircle2 : Award;
  const accent = isMilestone
    ? "border-amber-500/30 bg-amber-500/5"
    : isEarn
      ? "border-price-up/30 bg-price-up/5"
      : "border-primary/20 bg-background/95";
  const iconColor = isMilestone ? "text-amber-500" : isEarn ? "text-price-up" : "text-primary";

  return (
    <div className={cn(
      "fixed inset-x-0 bottom-[env(safe-area-inset-bottom,1rem)] z-50 mx-auto mb-4 flex w-fit max-w-[90vw] animate-in fade-in slide-in-from-bottom-2 items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm duration-200 sm:max-w-md",
      accent,
    )}>
      <Icon className={cn("size-4.5 shrink-0", iconColor)} />
      <span className="min-w-0 flex-1 break-words text-xs font-semibold text-foreground">{message}</span>
      <button onClick={onDismiss} className="shrink-0 text-muted-foreground hover:text-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  );
}
