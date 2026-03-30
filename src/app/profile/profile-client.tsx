"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { AuthPreviewGate } from "@/components/shared/login-gate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ProfileSidebar,
  ProfileMobileMenu,
  ProfileMobileSectionHeader,
  type ProfileTab,
  PROFILE_TABS,
} from "@/components/profile/profile-sidebar";
import { SectionOverview } from "@/components/profile/section-overview";
import { SectionSubscription } from "@/components/profile/section-subscription";
import { SectionNotifications } from "@/components/profile/section-notifications";
import { SectionMarketplace } from "@/components/profile/section-marketplace";
import { SectionExport } from "@/components/profile/section-export";
import { SectionAccount } from "@/components/profile/section-account";
import {
  getTierConfig,
  type ProfileData,
  type SettingsData,
  type DbUser,
} from "@/components/profile/profile-types";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = useUIStore((s) => s.language);

  const tabParam = searchParams.get("tab") as ProfileTab | null;
  const hasExplicitTab = tabParam && PROFILE_TABS.includes(tabParam);
  const activeTab: ProfileTab = hasExplicitTab ? tabParam : "overview";

  const [data, setData] = useState<ProfileData | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleTabChange = (tab: ProfileTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/profile?${params.toString()}`, { scroll: false });
  };

  const handleMobileBack = () => {
    router.push("/profile", { scroll: false });
  };

  const handleCheckin = async () => {
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
  };

  const handleUserUpdate = (updatedUser: DbUser) => {
    setData((prev) => (prev ? { ...prev, user: { ...prev.user, ...updatedUser } } : prev));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex gap-8">
          <div className="hidden md:block w-56 shrink-0 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-14 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-56 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-muted-foreground text-sm">{error ?? "User not found"}</p>
        <Link
          href="/login"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          {t(lang, "login")}
        </Link>
      </div>
    );
  }

  const { user, listings, stats, honey, subscription } = data;
  const tierCfg = getTierConfig(subscription.tier);

  const renderSection = () => {
    switch (activeTab) {
      case "overview":
        return (
          <SectionOverview
            stats={stats}
            honey={honey}
            userId={user.id}
            sellerRating={user.sellerRating}
            sellerReviewCount={user.sellerReviewCount}
            checkinLoading={checkinLoading}
            onCheckin={() => void handleCheckin()}
          />
        );
      case "subscription":
        return <SectionSubscription subscription={subscription} />;
      case "notifications":
        return settings ? (
          <SectionNotifications settings={settings} onReload={() => void load()} />
        ) : (
          <p className="text-muted-foreground text-sm">{t(lang, "loading")}</p>
        );
      case "marketplace":
        return <SectionMarketplace listings={listings} userId={user.id} />;
      case "export":
        return <SectionExport />;
      case "account":
        return <SectionAccount user={user} onUserUpdate={handleUserUpdate} />;
    }
  };

  const profileCard = (
    <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card p-4">
      <Avatar className={cn("size-12 ring-2", tierCfg.ring)}>
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
        <AvatarFallback className="text-sm font-semibold">
          {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight truncate">
            {user.displayName ?? "User"}
          </h1>
          <Badge className={cn("text-[10px] font-semibold shrink-0", tierCfg.color)}>
            {tierCfg.label}
          </Badge>
        </div>
        <p className="text-muted-foreground truncate text-xs">{user.email}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-amber-500 text-sm font-semibold">🍯 {honey.points.toLocaleString()}</p>
        <p className="text-muted-foreground text-[10px]">
          {t(lang, "memberSince")}{" "}
          {new Date(user.createdAt).toLocaleDateString(
            lang === "TH" ? "th-TH" : lang === "JP" ? "ja-JP" : "en-US",
            { year: "numeric", month: "short" },
          )}
        </p>
      </div>
    </div>
  );

  // Mobile: no tab param → show menu list; with tab → show section with back button
  // Desktop: always sidebar + section content
  const showMobileMenu = !hasExplicitTab;

  return (
    <div className="mx-auto max-w-5xl px-4 py-2 md:py-6">
      {/* ── Desktop layout: sidebar + content ── */}
      <div className="hidden md:flex gap-8">
        <ProfileSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="min-w-0 flex-1 space-y-5">
          {activeTab === "overview" && profileCard}
          {renderSection()}
        </div>
      </div>

      {/* ── Mobile layout: menu list OR section drill-down ── */}
      <div className="md:hidden">
        {showMobileMenu ? (
          <div className="space-y-4">
            {profileCard}
            <ProfileMobileMenu onTabChange={handleTabChange} />
          </div>
        ) : (
          <div className="space-y-4">
            <ProfileMobileSectionHeader activeTab={activeTab} onBack={handleMobileBack} />
            {renderSection()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfileClient() {
  const { authed } = useAuthState();
  const lang = useUIStore((s) => s.language);

  if (authed === null) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="size-14 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-56 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (authed === false) {
    return <AuthPreviewGate preview={<ProfileMockPreview lang={lang} />} />;
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

function ProfileMockPreview({ lang }: { lang: Language }) {
  const sidebarItems = [
    { label: t(lang, "overview"), active: true },
    { label: t(lang, "yourPlan") },
    { label: t(lang, "notifications") },
    { label: t(lang, "marketplace") },
    { label: t(lang, "export") },
    { label: t(lang, "account") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-2 md:py-6">
      <div className="flex gap-8">
        <div className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  item.active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <div className="size-4 rounded bg-muted-foreground/20" />
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card p-4">
            <div className="size-12 rounded-full bg-muted ring-2 ring-border flex items-center justify-center">
              <span className="text-sm font-semibold text-muted-foreground">U</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">CardTracker User</h1>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Free</span>
              </div>
              <p className="text-muted-foreground text-xs">user@example.com</p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-amber-500 text-sm font-semibold">🍯 250</p>
              <p className="text-muted-foreground text-[10px]">{t(lang, "memberSince")} Jan 2025</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t(lang, "portfolios"), value: "2" },
              { label: t(lang, "watchlist"), value: "8" },
              { label: t(lang, "priceAlerts"), value: "3" },
              { label: t(lang, "decks"), value: "1" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/40 bg-card p-4 text-center">
                <p className="text-2xl font-semibold">{s.value}</p>
                <p className="text-muted-foreground text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/40 bg-card p-4">
              <p className="text-sm font-semibold">{t(lang, "yourPlan")}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Free</span>
              </div>
              <div className="mt-3 h-9 rounded-md bg-primary/10" />
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-400/5 to-orange-400/5 p-4">
              <p className="text-sm font-semibold">{t(lang, "honeyPoints")}</p>
              <p className="mt-2 text-2xl font-bold text-amber-500">🍯 250</p>
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                🔥 3 {t(lang, "days")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
