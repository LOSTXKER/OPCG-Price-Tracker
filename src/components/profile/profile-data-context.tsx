"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
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
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [meRes, settingsRes] = await Promise.all([
      fetch("/api/me"),
      fetch("/api/settings"),
    ]);
    if (!meRes.ok) {
      setLoading(false);
      setError(t(lang, "loadFailed"));
      return;
    }
    const meJson = (await meRes.json()) as ProfileData;
    setData(meJson);
    if (settingsRes.ok) {
      const settingsJson = (await settingsRes.json()) as SettingsData;
      setSettings(settingsJson);
    }
    setLoading(false);
  }, [lang]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCheckin = useCallback(async () => {
    setCheckinLoading(true);
    try {
      const res = await fetch("/api/honey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin" }),
      });
      if (res.ok) {
        const json = await res.json();
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
