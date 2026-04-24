"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { invalidateSettings } from "@/hooks/use-settings";
import type {
  HoneyTx,
  ShopItem,
  LeaderboardUser,
  MissionData,
  HoneyLevel,
  ActiveEvent,
  RaffleData,
  RaffleWinner,
  AchievementItem,
  RaffleMissionsData,
} from "../types";

export function useHoneyData() {
  const lang = useUIStore((s) => s.language);

  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [canCheckin, setCanCheckin] = useState(false);
  const [transactions, setTransactions] = useState<HoneyTx[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [mission, setMission] = useState<MissionData | null>(null);
  const [level, setLevel] = useState<HoneyLevel | null>(null);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [machines, setMachines] = useState<RaffleData[]>([]);
  const [myTickets, setMyTickets] = useState<Record<number, number>>({});
  const [ticketBalance, setTicketBalance] = useState(0);
  const [canClaimFree, setCanClaimFree] = useState(false);
  const [lastWinners, setLastWinners] = useState<RaffleWinner[]>([]);
  const [raffleMissions, setRaffleMissions] = useState<RaffleMissionsData | null>(null);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [referralUrl, setReferralUrl] = useState("");
  const [referralTotalClicks, setReferralTotalClicks] = useState(0);
  const [referralTodayClicks, setReferralTodayClicks] = useState(0);
  const [referralConversions, setReferralConversions] = useState(0);
  const [referralEarned, setReferralEarned] = useState(0);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [honeyRes, shopRes, lbRes, missionsRes, achRes, raffleRes, refRes, rmRes] = await Promise.all([
        fetch("/api/honey"),
        fetch("/api/honey/shop"),
        fetch("/api/honey/leaderboard"),
        fetch("/api/honey/missions"),
        fetch("/api/honey/achievements"),
        fetch("/api/honey/raffle"),
        fetch("/api/honey/referral"),
        fetch("/api/honey/raffle-missions"),
      ]);
      if (honeyRes.ok) {
        const data = await honeyRes.json();
        setPoints(data.honeyPoints);
        setStreak(data.checkinStreak);
        setCanCheckin(data.canCheckin);
        setTransactions(data.recentTransactions);
        if (data.level) setLevel(data.level);
        if (typeof data.lifetimeEarned === "number") setLifetimeEarned(data.lifetimeEarned);
        if (data.activeEvent) setActiveEvent(data.activeEvent);
        if (data.onboardingCompleted === false) {
          fetch("/api/honey/onboarding", { method: "POST" })
            .then((r) => r.json())
            .then((d) => {
              if (d.earned) {
                setPoints(d.total);
                setMessage(t(lang, "onboardingReward"));
              }
            })
            .catch(() => {});
        }
      } else if (honeyRes.status === 401) {
        invalidateSettings();
        const supabase = createClient();
        await supabase.auth.signOut();
        return;
      }
      if (shopRes.ok) setShopItems((await shopRes.json()).items);
      if (lbRes.ok) setLeaderboard((await lbRes.json()).leaderboard);
      if (missionsRes.ok) setMission((await missionsRes.json()).mission);
      if (achRes.ok) setAchievements((await achRes.json()).achievements);
      if (raffleRes.ok) {
        const data = await raffleRes.json();
        setMachines(data.machines ?? []);
        setMyTickets(data.myTickets ?? {});
        setTicketBalance(data.ticketBalance ?? 0);
        setCanClaimFree(data.canClaimFree ?? false);
        setLastWinners(data.lastWinners ?? []);
      }
      if (refRes.ok) {
        const data = await refRes.json();
        setReferralUrl(data.referralUrl ?? "");
        setReferralTotalClicks(data.totalClicks ?? 0);
        setReferralTodayClicks(data.todayClicks ?? 0);
        setReferralConversions(data.totalConversions ?? 0);
        setReferralEarned(data.totalEarned ?? 0);
      }
      if (rmRes.ok) {
        const data = await rmRes.json();
        setRaffleMissions(data.missions ?? null);
      }
    } catch (err) {
      console.error("Failed to load honey data:", err);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => { load(); }, [load]);

  /* ── Actions ── */

  const checkin = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin" }),
      });
      const data = await res.json();
      if (res.ok) {
        setPoints(data.total);
        setStreak(data.streak);
        setCanCheckin(false);
        setMessage(`${t(lang, "checkinSuccess")} +${data.earned}`);
      } else setMessage(data.error);
    } catch {
      setMessage(t(lang, "checkinFailed"));
    }
  };

  const redeem = async (itemId: number) => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", itemId }),
      });
      const data = await res.json();
      if (res.ok) { setPoints(data.total); setMessage(t(lang, "redeemSuccess")); load(); }
      else setMessage(data.error);
    } catch { setMessage(t(lang, "redeemFailed")); }
  };

  const buyTicket = async (raffleId: number) => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey/raffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buy", raffleId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMyTickets((prev) => ({ ...prev, [raffleId]: (prev[raffleId] ?? 0) + 1 }));
        if (data.ticketBalance != null) setTicketBalance(data.ticketBalance);
        setMessage(t(lang, "raffleBought"));
        load();
      } else setMessage(data.error);
    } catch { setMessage(t(lang, "redeemFailed")); }
  };

  const claimFreeTicket = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey/raffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim-free" }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.ticketBalance != null) setTicketBalance(data.ticketBalance);
        setCanClaimFree(false);
        setMessage(t(lang, "raffleFreeTicket"));
      } else setMessage(data.error);
    } catch { setMessage(t(lang, "redeemFailed")); }
  };

  const claimTask = async (taskId: string) => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim-task", taskId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMission(data.mission);
        setMessage(`${t(lang, "claimReward")} +${data.earned}`);
        load();
      } else setMessage(data.error);
    } catch { setMessage(t(lang, "checkinFailed")); }
  };

  const claimBonus = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim-bonus" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMission(data.mission);
        setMessage(`${t(lang, "missionPerfectDay")} +${data.earned}`);
        load();
      } else setMessage(data.error);
    } catch { setMessage(t(lang, "checkinFailed")); }
  };

  const trackManualMission = async (taskId: string) => {
    try {
      const res = await fetch("/api/honey/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "track", task: taskId, shareCompleted: true }),
      });
      const data = await res.json();
      if (res.ok) setMission(data.mission);
    } catch { /* silent */ }
  };

  const trackRaffleMission = async (missionId: string) => {
    try {
      const res = await fetch("/api/honey/raffle-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "track", missionId }),
      });
      const data = await res.json();
      if (res.ok) setRaffleMissions(data.missions ?? null);
    } catch { /* silent */ }
  };

  const claimRaffleMission = async (missionId: string) => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey/raffle-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", missionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setRaffleMissions(data.missions ?? null);
        const parts: string[] = [];
        if (data.earned) parts.push(`+${data.earned} Honey`);
        if (data.ticketAwarded) parts.push("+1 Ticket");
        if (parts.length) setMessage(parts.join(" & "));
        load();
      } else setMessage(data.error);
    } catch { setMessage(t(lang, "redeemFailed")); }
  };

  const claimRaffleMissionBonusAction = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey/raffle-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim-bonus" }),
      });
      const data = await res.json();
      if (res.ok) {
        setRaffleMissions(data.missions ?? null);
        if (data.ticketAwarded) setMessage("+1 Free Ticket!");
        load();
      } else setMessage(data.error);
    } catch { setMessage(t(lang, "redeemFailed")); }
  };

  return {
    lang,
    points, streak, canCheckin, transactions, shopItems, leaderboard,
    mission, level, lifetimeEarned, achievements,
    machines, myTickets, ticketBalance, canClaimFree, lastWinners,
    raffleMissions,
    activeEvent,
    referralUrl, referralTotalClicks, referralTodayClicks, referralConversions, referralEarned,
    loading, message, setMessage,
    actions: { checkin, redeem, buyTicket, claimFreeTicket, claimTask, claimBonus, trackManualMission, trackRaffleMission, claimRaffleMission, claimRaffleMissionBonusAction },
  };
}
