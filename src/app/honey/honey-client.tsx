"use client";

import { useEffect, useRef, useState } from "react";
import { Award, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useHoneyData } from "./hooks/use-honey-data";
import { HoneyHero } from "./components/honey-hero";
import { DailyMissionsCard } from "./components/daily-missions-card";
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
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
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
  const [tab, setTab] = useState<TabKey>("activity");
  const [checkinLoading, setCheckinLoading] = useState(false);

  const {
    lang,
    points, streak, canCheckin, transactions, shopItems, leaderboard,
    mission, predictions, level, achievements, raffle, myTickets,
    canClaimFree, activeEvent, loading, message, setMessage,
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
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero + Missions side-by-side on lg */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <HoneyHero
            lang={lang}
            points={points}
            streak={streak}
            level={level}
            activeEvent={activeEvent}
            canCheckin={canCheckin}
            checkinLoading={checkinLoading}
            onCheckin={handleCheckin}
          />
        </div>
        <div className="lg:col-span-3">
          <DailyMissionsCard
            lang={lang}
            mission={mission}
            onClaimTask={actions.claimTask}
            onClaimBonus={actions.claimBonus}
            onShare={handleShare}
          />
        </div>
      </div>

      {/* Tab Bar -- icon-only on mobile */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1 scrollbar-none">
        {HONEY_TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:px-4",
                active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{t(lang, item.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "activity" && (
        <ActivityTab lang={lang} transactions={transactions} />
      )}

      {tab === "achievements" && (
        <AchievementsTab lang={lang} predictions={predictions} achievements={achievements} />
      )}

      {tab === "shop" && (
        <ShopTab lang={lang} shopItems={shopItems} points={points} onRedeem={actions.redeem} />
      )}

      {tab === "raffle" && (
        <RaffleTab
          lang={lang}
          raffle={raffle}
          myTickets={myTickets}
          canClaimFree={canClaimFree}
          points={points}
          onBuyTicket={actions.buyTicket}
          onClaimFreeTicket={actions.claimFreeTicket}
        />
      )}

      {tab === "rankings" && (
        <RankingsTab lang={lang} leaderboard={leaderboard} transactions={transactions} />
      )}

      {tab === "referral" && (
        <ReferralTab lang={lang} />
      )}

      {/* Floating toast */}
      <Toast message={message} onDismiss={() => setMessage(null)} />
    </div>
  );
}

function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!message) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timerRef.current);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[90vw] items-center gap-2 rounded-xl border bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur-sm sm:max-w-md">
      <Award className="size-4 shrink-0 text-primary" />
      <span className="flex-1 text-xs font-semibold text-foreground">{message}</span>
      <button onClick={onDismiss} className="shrink-0 text-muted-foreground hover:text-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  );
}
