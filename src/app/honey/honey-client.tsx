"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { useHoneyData } from "@/hooks/use-honey-data";
import { t } from "@/lib/i18n";
import { HoneyStatusBar } from "./components/honey-status-bar";
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

const TAB_KEYS: readonly TabKey[] = [
  "missions",
  "activity",
  "achievements",
  "shop",
  "raffle",
  "rankings",
  "referral",
];

function isTabKey(value: string | null): value is TabKey {
  return value !== null && (TAB_KEYS as readonly string[]).includes(value);
}

export default function HoneyClient() {
  const { authed } = useAuthState();
  const lang = useUIStore((s) => s.language);

  const header = (
    <PageHeader
      title={t(lang, "honeyPageTitle")}
      description={t(lang, "honeySubtitle")}
      breadcrumb={
        <Breadcrumb items={[{ label: t(lang, "home"), href: "/" }, { label: t(lang, "honeyPageTitle") }]} />
      }
    />
  );

  if (authed === null) {
    return (
      <>
        {header}
        <div className="space-y-6">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-48 rounded-xl shadow-[var(--panel-shadow)]" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-64 rounded-xl shadow-[var(--panel-shadow)]" />
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
      <Suspense fallback={<Skeleton className="h-64 rounded-xl shadow-[var(--panel-shadow)]" />}>
        <HoneyContent />
      </Suspense>
    </>
  );
}

function HoneyContent() {
  // Tab lives in the URL (`?tab=`) so deep-links (e.g. /honey?tab=shop from the
  // pricing page) land on the right tab and the back button steps between tabs.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab");
  const tab: TabKey = isTabKey(tabParam) ? tabParam : "missions";
  const setTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [claimFreeLoading, setClaimFreeLoading] = useState(false);

  const {
    lang,
    points, streak, canCheckin, transactions, shopItems, leaderboard,
    mission, level, lifetimeEarned, achievements,
    machines, myTickets, ticketBalance, canClaimFree, lastWinners,
    raffleMissions,
    activeEvent, tierMultiplier,
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
        <Skeleton className="h-48 rounded-xl shadow-[var(--panel-shadow)]" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-64 rounded-xl shadow-[var(--panel-shadow)]" />
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
    tierMultiplier,
    shopItems,
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
    onCheckin: handleCheckin,
    onClaimFreeTicket: handleClaimFreeTicket,
    onClaimTask: actions.claimTask,
    onClaimBonus: actions.claimBonus,
    onShare: handleShare,
    onTrackRaffleMission: actions.trackRaffleMission,
    onClaimRaffleMission: actions.claimRaffleMission,
    onClaimRaffleMissionBonus: actions.claimRaffleMissionBonusAction,
  } as const;

  const panelLabels: Record<TabKey, string> = {
    missions: t(lang, "dailyMissions"),
    achievements: t(lang, "achievements"),
    shop: t(lang, "honeyShop"),
    raffle: t(lang, "monthlyRaffle"),
    rankings: t(lang, "honeyLeaderboard"),
    referral: t(lang, "referralLink"),
    activity: t(lang, "activity"),
  };

  const renderPanel = (key: TabKey, content: React.ReactNode) => (
    <div
      key={key}
      role="tabpanel"
      id={`honey-tabpanel-${key}`}
      aria-label={panelLabels[key]}
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
