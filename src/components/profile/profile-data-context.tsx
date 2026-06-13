"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { ApiError, apiGet, apiPost, apiTry } from "@/lib/api/client";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { useSettings, invalidateSettings } from "@/hooks/use-settings";
import type {
  ProfileData,
  SettingsData,
  DbUser,
} from "./profile-types";

type ProfileDataCtx = {
  data: ProfileData | null;
  settings: SettingsData | null;
  loading: boolean;
  error: string | null;
  checkinLoading: boolean;
  handleCheckin: () => Promise<void>;
  handleUserUpdate: (user: DbUser) => void;
  reload: () => Promise<void>;
};

const Ctx = createContext<ProfileDataCtx | null>(null);

export function useProfileData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfileData must be used within ProfileDataProvider");
  return ctx;
}

export function ProfileDataProvider({ children }: { children: ReactNode }) {
  const lang = useUIStore((s) => s.language);
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const { settings: sharedSettings } = useSettings();
  const settings = sharedSettings as unknown as SettingsData | null;

  const load = useCallback(async () => {
    setError(null);
    try {
      const meJson = await apiGet<ProfileData>("/api/me");
      setData(meJson);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        invalidateSettings();
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      setError(t(lang, "loadFailed"));
    }
    setLoading(false);
  }, [lang]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCheckin = useCallback(async () => {
    setCheckinLoading(true);
    try {
      const json = await apiTry(
        apiPost<{ total: number; streak: number }>("/api/honey", { action: "checkin" }),
      );
      if (json) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                honey: { points: json.total, streak: json.streak, canCheckin: false },
              }
            : prev,
        );
      }
    } finally {
      setCheckinLoading(false);
    }
  }, []);

  const handleUserUpdate = useCallback((updatedUser: DbUser) => {
    setData((prev) => (prev ? { ...prev, user: { ...prev.user, ...updatedUser } } : prev));
  }, []);

  return (
    <Ctx.Provider
      value={{
        data,
        settings,
        loading,
        error,
        checkinLoading,
        handleCheckin,
        handleUserUpdate,
        reload: load,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
