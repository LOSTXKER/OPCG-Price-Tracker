"use client";

import { useCallback, useEffect, useState } from "react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import type {
  HoneyTx,
  ShopItem,
  LeaderboardUser,
  MissionData,
  HoneyLevel,
  ActiveEvent,
  RaffleData,
  AchievementItem,
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
  const [raffle, setRaffle] = useState<RaffleData | null>(null);
  const [myTickets, setMyTickets] = useState(0);
  const [canClaimFree, setCanClaimFree] = useState(false);
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
      const [honeyRes, shopRes, lbRes, missionsRes, achRes, raffleRes, refRes] = await Promise.all([
        fetch("/api/honey"),
        fetch("/api/honey/shop"),
        fetch("/api/honey/leaderboard"),
        fetch("/api/honey/missions"),
        fetch("/api/honey/achievements"),
        fetch("/api/honey/raffle"),
        fetch("/api/honey/referral"),
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
      }
      if (shopRes.ok) setShopItems((await shopRes.json()).items);
      if (lbRes.ok) setLeaderboard((await lbRes.json()).leaderboard);
      if (missionsRes.ok) setMission((await missionsRes.json()).mission);
      if (achRes.ok) setAchievements((await achRes.json()).achievements);
      if (raffleRes.ok) {
        const data = await raffleRes.json();
        if (data.raffle) {
          setRaffle(data.raffle);
          setMyTickets(data.myTickets);
          setCanClaimFree(data.canClaimFree);
        }
      }
      if (refRes.ok) {
        const data = await refRes.json();
        setReferralUrl(data.referralUrl ?? "");
        setReferralTotalClicks(data.totalClicks ?? 0);
        setReferralTodayClicks(data.todayClicks ?? 0);
        setReferralConversions(data.totalConversions ?? 0);
        setReferralEarned(data.totalEarned ?? 0);
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

  const buyTicket = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/honey/raffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buy" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMyTickets((p) => p + 1);
        if (data.total != null) setPoints(data.total);
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
      if (res.ok) { setMyTickets((p) => p + 1); setCanClaimFree(false); setMessage(t(lang, "raffleFreeTicket")); }
      else setMessage(data.error);
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

  return {
    lang,
    points, streak, canCheckin, transactions, shopItems, leaderboard,
    mission, level, lifetimeEarned, achievements, raffle, myTickets,
    canClaimFree, activeEvent,
    referralUrl, referralTotalClicks, referralTodayClicks, referralConversions, referralEarned,
    loading, message, setMessage,
    actions: { checkin, redeem, buyTicket, claimFreeTicket, claimTask, claimBonus, trackManualMission },
  };
}
