"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ApiError, apiGet, apiPost, apiTry } from "@/lib/api/client";
import { useUIStore } from "@/stores/ui-store";
import { t, type TranslationKey } from "@/lib/i18n";
import { invalidateSettings, useSettings } from "@/hooks/use-settings";
import { effectiveTier, getLimits } from "@/lib/billing";
import type { UserTier } from "@/generated/prisma/client";
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
} from "@/app/honey/types";

export function useHoneyData() {
  const lang = useUIStore((s) => s.language);
  const { settings } = useSettings();
  // Mirror server logic in `getHoneyMultiplier` (lib/honey/index.ts) so the UI
  // pill matches what the earn pipeline actually applies.
  const tierMultiplier = (() => {
    if (!settings) return 1;
    const rawTier = (settings.tier ?? "FREE") as UserTier;
    const expiresAt = settings.tierExpiresAt ? new Date(settings.tierExpiresAt) : null;
    return getLimits(effectiveTier(rawTier, expiresAt)).honeyMultiplier;
  })();

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
      const [honey, shop, lb, missions, ach, raffle, ref, rm] = await Promise.all([
        apiGet<{
          honeyPoints: number;
          checkinStreak: number;
          canCheckin: boolean;
          recentTransactions: HoneyTx[];
          level?: HoneyLevel;
          lifetimeEarned?: number;
          activeEvent?: ActiveEvent;
          onboardingCompleted?: boolean;
        }>("/api/honey").catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 401) return "unauthorized" as const;
          return null;
        }),
        apiTry(apiGet<{ items: ShopItem[] }>("/api/honey/shop")),
        apiTry(apiGet<{ leaderboard: LeaderboardUser[] }>("/api/honey/leaderboard")),
        apiTry(apiGet<{ mission: MissionData | null }>("/api/honey/missions")),
        apiTry(apiGet<{ achievements: AchievementItem[] }>("/api/honey/achievements")),
        apiTry(apiGet<{
          machines?: RaffleData[];
          myTickets?: Record<number, number>;
          ticketBalance?: number;
          canClaimFree?: boolean;
          lastWinners?: RaffleWinner[];
        }>("/api/honey/raffle")),
        apiTry(apiGet<{
          referralUrl?: string;
          totalClicks?: number;
          todayClicks?: number;
          totalConversions?: number;
          totalEarned?: number;
        }>("/api/honey/referral")),
        apiTry(apiGet<{ missions?: RaffleMissionsData | null }>("/api/honey/raffle-missions")),
      ]);
      if (honey === "unauthorized") {
        invalidateSettings();
        const supabase = createClient();
        await supabase.auth.signOut();
        return;
      }
      if (honey) {
        setPoints(honey.honeyPoints);
        setStreak(honey.checkinStreak);
        setCanCheckin(honey.canCheckin);
        setTransactions(honey.recentTransactions);
        if (honey.level) setLevel(honey.level);
        if (typeof honey.lifetimeEarned === "number") setLifetimeEarned(honey.lifetimeEarned);
        if (honey.activeEvent) setActiveEvent(honey.activeEvent);
        if (honey.onboardingCompleted === false) {
          void apiTry(apiPost<{ earned?: number; total: number }>("/api/honey/onboarding")).then((d) => {
            if (d?.earned) {
              setPoints(d.total);
              setMessage(t(lang, "onboardingReward"));
            }
          });
        }
      }
      if (shop) setShopItems(shop.items);
      if (lb) setLeaderboard(lb.leaderboard);
      if (missions) setMission(missions.mission);
      if (ach) setAchievements(ach.achievements);
      if (raffle) {
        setMachines(raffle.machines ?? []);
        setMyTickets(raffle.myTickets ?? {});
        setTicketBalance(raffle.ticketBalance ?? 0);
        setCanClaimFree(raffle.canClaimFree ?? false);
        setLastWinners(raffle.lastWinners ?? []);
      }
      if (ref) {
        setReferralUrl(ref.referralUrl ?? "");
        setReferralTotalClicks(ref.totalClicks ?? 0);
        setReferralTodayClicks(ref.todayClicks ?? 0);
        setReferralConversions(ref.totalConversions ?? 0);
        setReferralEarned(ref.totalEarned ?? 0);
      }
      if (rm) setRaffleMissions(rm.missions ?? null);
    } catch (err) {
      console.error("Failed to load honey data:", err);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => { load(); }, [load]);

  /* ── Actions ── */

  /** Show the server's `{ error }` message when present, else a translated fallback. */
  const showActionError = useCallback((err: unknown, fallbackKey: TranslationKey) => {
    setMessage(err instanceof ApiError ? err.message : t(lang, fallbackKey));
  }, [lang]);

  const checkin = async () => {
    setMessage(null);
    try {
      const data = await apiPost<{ total: number; streak: number; earned: number }>(
        "/api/honey", { action: "checkin" });
      setPoints(data.total);
      setStreak(data.streak);
      setCanCheckin(false);
      setMessage(`${t(lang, "checkinSuccess")} +${data.earned}`);
    } catch (err) {
      showActionError(err, "checkinFailed");
    }
  };

  const redeem = async (itemId: number) => {
    setMessage(null);
    try {
      const data = await apiPost<{ total: number }>("/api/honey", { action: "redeem", itemId });
      setPoints(data.total);
      setMessage(t(lang, "redeemSuccess"));
      load();
    } catch (err) {
      showActionError(err, "redeemFailed");
    }
  };

  const buyTicket = async (raffleId: number) => {
    setMessage(null);
    try {
      const data = await apiPost<{ ticketBalance?: number }>(
        "/api/honey/raffle", { action: "buy", raffleId });
      setMyTickets((prev) => ({ ...prev, [raffleId]: (prev[raffleId] ?? 0) + 1 }));
      if (data.ticketBalance != null) setTicketBalance(data.ticketBalance);
      setMessage(t(lang, "raffleBought"));
      load();
    } catch (err) {
      showActionError(err, "redeemFailed");
    }
  };

  const claimFreeTicket = async () => {
    setMessage(null);
    try {
      const data = await apiPost<{ ticketBalance?: number }>(
        "/api/honey/raffle", { action: "claim-free" });
      if (data.ticketBalance != null) setTicketBalance(data.ticketBalance);
      setCanClaimFree(false);
      setMessage(t(lang, "raffleFreeTicket"));
    } catch (err) {
      showActionError(err, "redeemFailed");
    }
  };

  const claimTask = async (taskId: string) => {
    setMessage(null);
    try {
      const data = await apiPost<{ mission: MissionData; earned: number }>(
        "/api/honey/missions", { action: "claim-task", taskId });
      setMission(data.mission);
      setMessage(`${t(lang, "claimReward")} +${data.earned}`);
      load();
    } catch (err) {
      showActionError(err, "checkinFailed");
    }
  };

  const claimBonus = async () => {
    setMessage(null);
    try {
      const data = await apiPost<{ mission: MissionData; earned: number }>(
        "/api/honey/missions", { action: "claim-bonus" });
      setMission(data.mission);
      setMessage(`${t(lang, "missionPerfectDay")} +${data.earned}`);
      load();
    } catch (err) {
      showActionError(err, "checkinFailed");
    }
  };

  const trackManualMission = async (taskId: string) => {
    const data = await apiTry(apiPost<{ mission: MissionData }>(
      "/api/honey/missions", { action: "track", task: taskId, shareCompleted: true }));
    if (data) setMission(data.mission);
  };

  const trackRaffleMission = async (missionId: string) => {
    const data = await apiTry(apiPost<{ missions?: RaffleMissionsData | null }>(
      "/api/honey/raffle-missions", { action: "track", missionId }));
    if (data) setRaffleMissions(data.missions ?? null);
  };

  const claimRaffleMission = async (missionId: string) => {
    setMessage(null);
    try {
      const data = await apiPost<{
        missions?: RaffleMissionsData | null;
        earned?: number;
        ticketsAwarded?: number;
        ticketAwarded?: boolean;
      }>("/api/honey/raffle-missions", { action: "claim", missionId });
      setRaffleMissions(data.missions ?? null);
      const parts: string[] = [];
      if (data.earned) parts.push(`+${data.earned} Honey`);
      const tickets = data.ticketsAwarded ?? (data.ticketAwarded ? 1 : 0);
      if (tickets > 0) parts.push(tickets === 1 ? "+1 Ticket" : `+${tickets} Tickets`);
      if (parts.length) setMessage(parts.join(" & "));
      load();
    } catch (err) {
      showActionError(err, "redeemFailed");
    }
  };

  const claimRaffleMissionBonusAction = async () => {
    setMessage(null);
    try {
      const data = await apiPost<{
        missions?: RaffleMissionsData | null;
        ticketsAwarded?: number;
        ticketAwarded?: boolean;
      }>("/api/honey/raffle-missions", { action: "claim-bonus" });
      setRaffleMissions(data.missions ?? null);
      const tickets = data.ticketsAwarded ?? (data.ticketAwarded ? 1 : 0);
      if (tickets > 0) setMessage(tickets === 1 ? "+1 Free Ticket!" : `+${tickets} Free Tickets!`);
      load();
    } catch (err) {
      showActionError(err, "redeemFailed");
    }
  };

  return {
    lang,
    points, streak, canCheckin, transactions, shopItems, leaderboard,
    mission, level, lifetimeEarned, achievements,
    machines, myTickets, ticketBalance, canClaimFree, lastWinners,
    raffleMissions,
    activeEvent,
    tierMultiplier,
    referralUrl, referralTotalClicks, referralTodayClicks, referralConversions, referralEarned,
    loading, message, setMessage,
    actions: { checkin, redeem, buyTicket, claimFreeTicket, claimTask, claimBonus, trackManualMission, trackRaffleMission, claimRaffleMission, claimRaffleMissionBonusAction },
  };
}
