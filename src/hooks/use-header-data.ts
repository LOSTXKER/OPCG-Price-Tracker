"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiTry } from "@/lib/api/client";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSettings, invalidateSettings, refetchSettings } from "@/hooks/use-settings";
import { useUIStore } from "@/stores/ui-store";
import { isAuthBypassed } from "@/lib/env";
import type { AuthUser, UserTierValue, MarketStats } from "@/components/layout/header-constants";

// Dev bypass is env-driven, so it is identical on server and client — safe
// to resolve in the lazy initializers without a hydration mismatch.
function bypassUser(): AuthUser | null {
  return isAuthBypassed()
    ? ({ id: "dev-bypass", email: "dev@localhost" } as import("@supabase/supabase-js").User)
    : null;
}

export function useHeaderData() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(bypassUser);
  const [authLoaded, setAuthLoaded] = useState(() => isAuthBypassed());
  const [stats, setStats] = useState<MarketStats>({
    totalCards: 0,
    totalValue: 0,
    exchangeRate: 0.296,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const setUnreadGlobal = useUIStore((s) => s.setUnreadMessages);
  const mounted = useHydrated();

  const { settings } = useSettings();

  useEffect(() => {
    if (isAuthBypassed()) return;
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

  // Logged-out unread count is derived (see return) — the effect only syncs
  // the zustand mirror and fetches when a user is present.
  useEffect(() => {
    if (!authUser) {
      setUnreadGlobal(0);
      return;
    }
    void apiTry(apiGet<{ count?: number }>("/api/messages/unread-count")).then((data) => {
      if (typeof data?.count === "number") {
        setUnreadCount(data.count);
        setUnreadGlobal(data.count);
      }
    });
  }, [authUser, setUnreadGlobal]);

  useEffect(() => {
    async function fetchStats() {
      const [rateData, cardsData] = await Promise.all([
        apiTry(apiGet<{ rate?: number }>("/api/exchange-rate")),
        apiTry(apiGet<{ total?: number; totalValue?: number }>("/api/cards?limit=1")),
      ]);
      setStats((prev) => ({
        totalCards: cardsData?.total ?? prev.totalCards,
        totalValue: cardsData?.totalValue ?? prev.totalValue,
        exchangeRate: rateData?.rate ?? prev.exchangeRate,
      }));
    }
    void fetchStats();
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
    unreadMessages: authUser ? unreadCount : 0,
    userId,
    userName,
    userAvatar,
    mounted,
    handleLogout,
  };
}
