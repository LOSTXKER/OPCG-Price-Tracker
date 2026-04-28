"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { useHoneyData } from "@/hooks/use-honey-data";
import { t } from "@/lib/i18n";
import { HoneyStatusBar } from "./components/honey-sidebar";
import { HoneyTabNav } from "./components/honey-tab-nav";
import { HoneyToast } from "./components/honey-toast";
import { MissionsTab } from "./components/missions-tab";
import { ActivityTab } from "./components/activity-tab";
import { AchievementsTab } from "./components/achievements-tab";
import { ShopTab } from "./components/shop-tab";
import { RaffleTab } from "./components/raffle-tab";
import { RankingsTab } from "./components/rankings-tab";
import { ReferralTab } from "./components/referral-tab";
import { HoneyMockPreview } from "./components/honey-mock-preview";
import { type TabKey } from "./types";

export default function HoneyClient() {
  const { authed } = useAuthState();
  const lang = useUIStore((s) => s.language);

  const header = (
    <PageHeader
      title={t(lang, "honeyPageTitle")}
      description={t(lang, "honeySubtitle")}
      breadcrumb={
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: t(lang, "honeyPageTitle") }]} />
      }
    />
  );

  if (authed === null) {
    return (
      <>
        {header}
        <div className="space-y-6">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </>
    );
  }

  if (authed === false) {
    return (
      <>
        {header}
        <AuthPreviewGate preview={<HoneyMockPreview lang={lang} />} />
      </>
    );
  }

  return (
    <>
      {header}
      <HoneyContent />
    </>
  );
}

function HoneyContent() {
  const [tab, setTab] = useState<TabKey>("missions");
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [claimFreeLoading, setClaimFreeLoading] = useState(false);

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

  const handleClaimFreeTicket = async () => {
    setClaimFreeLoading(true);
    await actions.claimFreeTicket();
    setClaimFreeLoading(false);
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
      <div className="space-y-6">
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
    shopItems,
    canCheckin,
    checkinLoading,
    onCheckin: handleCheckin,
  } as const;

  const missionProps = {
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
    onCheckin: handleCheckin,
    onClaimFreeTicket: handleClaimFreeTicket,
    onClaimTask: actions.claimTask,
    onClaimBonus: actions.claimBonus,
    onShare: handleShare,
    onTrackRaffleMission: actions.trackRaffleMission,
    onClaimRaffleMission: actions.claimRaffleMission,
    onClaimRaffleMissionBonus: actions.claimRaffleMissionBonusAction,
  } as const;

  const renderPanel = (key: TabKey, content: React.ReactNode) => (
    <div
      key={key}
      role="tabpanel"
      id={`honey-tabpanel-${key}`}
      aria-labelledby={`honey-tab-${key}`}
      hidden={tab !== key}
    >
      {tab === key ? content : null}
    </div>
  );

  const tabContent = (
    <>
      {renderPanel("missions", <MissionsTab {...missionProps} />)}
      {renderPanel("activity", <ActivityTab lang={lang} transactions={transactions} />)}
      {renderPanel("achievements", <AchievementsTab lang={lang} achievements={achievements} />)}
      {renderPanel("shop", <ShopTab lang={lang} shopItems={shopItems} points={points} onRedeem={actions.redeem} />)}
      {renderPanel(
        "raffle",
        <RaffleTab
          lang={lang}
          machines={machines}
          myTickets={myTickets}
          ticketBalance={ticketBalance}
          canClaimFree={canClaimFree}
          lastWinners={lastWinners}
          onBuyTicket={actions.buyTicket}
          onClaimFreeTicket={actions.claimFreeTicket}
        />,
      )}
      {renderPanel("rankings", <RankingsTab lang={lang} leaderboard={leaderboard} />)}
      {renderPanel(
        "referral",
        <ReferralTab
          lang={lang}
          referralUrl={referralUrl}
          totalClicks={referralTotalClicks}
          todayClicks={referralTodayClicks}
          totalConversions={referralConversions}
          totalEarned={referralEarned}
        />,
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <HoneyStatusBar {...statusProps} />
      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-8">
        <HoneyTabNav tab={tab} onTabChange={setTab} lang={lang} />
        <div className="mt-4 min-w-0 lg:mt-0">{tabContent}</div>
      </div>
      <HoneyToast message={message} onDismiss={() => setMessage(null)} />
    </div>
  );
}
