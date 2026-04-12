"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSettings, invalidateSettings, refetchSettings } from "@/hooks/use-settings";
import type { AuthUser, UserTierValue, MarketStats } from "@/components/layout/header-constants";

export function useHeaderData() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [stats, setStats] = useState<MarketStats>({
    totalCards: 0,
    totalValue: 0,
    exchangeRate: 0.296,
    topMover: { code: "OP13-118-P", name: "Monkey.D.Luffy", change: 5.8 },
  });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mounted, setMounted] = useState(false);

  const { settings, loaded: settingsLoaded } = useSettings();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
      setAuthUser({ id: "dev-bypass", email: "dev@localhost" } as import("@supabase/supabase-js").User);
      setAuthLoaded(true);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser()
      .then(({ data }) => {
        setAuthUser(data.user ?? null);
        setAuthLoaded(true);
      })
      .catch(() => {
        setAuthLoaded(true);
      });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthLoaded(true);
      if (session?.user) {
        refetchSettings();
      } else {
        invalidateSettings();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) {
      setUnreadMessages(0);
      return;
    }
    fetch("/api/messages/unread-count")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (typeof data?.count === "number") setUnreadMessages(data.count); })
      .catch(() => {});
  }, [authUser]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [rateRes, statsRes] = await Promise.all([
          fetch("/api/exchange-rate"),
          fetch("/api/cards?limit=1&sort=priceChange24h&order=desc"),
        ]);
        const rateData = rateRes.ok ? await rateRes.json() : null;
        const cardsData = statsRes.ok ? await statsRes.json() : null;

        const top = cardsData?.cards?.[0];
        setStats((prev) => ({
          totalCards: cardsData?.total ?? prev.totalCards,
          totalValue: cardsData?.totalValue ?? prev.totalValue,
          exchangeRate: rateData?.rate ?? prev.exchangeRate,
          topMover: top
            ? {
                code: top.cardCode,
                name: top.nameEn ?? top.nameJp ?? top.cardCode,
                change: top.priceChange24h ?? 0,
              }
            : prev.topMover,
        }));
      } catch {
        /* non-critical */
      }
    }
    fetchStats();
  }, []);

  const handleLogout = async () => {
    invalidateSettings();
    const supabase = createClient();
    supabase.auth.signOut().catch(() => {});
  };

  const userTier = (settings?.tier as UserTierValue) ?? "FREE";
  const honeyPoints = settings?.honeyPoints ?? 0;
  const honeyLifetime = settings?.honeyLifetimeEarned ?? 0;
  const honeyPendingActions = settings?.honeyPendingActions ?? false;
  const userId = settings?.id ?? null;
  const appDisplayName = settings?.displayName ?? null;
  const appAvatarUrl = settings?.avatarUrl ?? null;

  const userName = appDisplayName ?? authUser?.user_metadata?.full_name ?? authUser?.email?.split("@")[0] ?? "User";
  const userAvatar = appAvatarUrl ?? authUser?.user_metadata?.avatar_url ?? null;

  return {
    authUser,
    authLoaded,
    stats,
    userTier,
    honeyPoints,
    honeyLifetime,
    honeyPendingActions,
    unreadMessages,
    userId,
    userName,
    userAvatar,
    mounted,
    handleLogout,
  };
}
