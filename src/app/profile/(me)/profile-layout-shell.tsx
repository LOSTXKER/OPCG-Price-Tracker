"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { AuthPreviewGate } from "@/components/shared/login-gate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ProfileSidebar,
  ProfileMobileSectionHeader,
  type ProfileTab,
} from "@/components/profile/profile-sidebar";
import {
  ProfileDataProvider,
  useProfileData,
} from "@/components/profile/profile-data-context";
import { getTierConfig } from "@/components/profile/profile-types";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TAB_TO_PATH: Record<ProfileTab, string> = {
  overview: "/profile",
  subscription: "/profile/subscription",
  notifications: "/profile/notifications",
  marketplace: "/profile/marketplace",
  export: "/profile/export",
  account: "/profile/account",
};

function pathToTab(pathname: string): ProfileTab {
  const segment = pathname.replace(/^\/profile\/?/, "").split("/")[0];
  if (segment && segment in TAB_TO_PATH) return segment as ProfileTab;
  return "overview";
}

function ProfileLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/profile";
  const lang = useUIStore((s) => s.language);
  const { data, loading, error } = useProfileData();

  const activeTab = pathToTab(pathname);
  const isRootProfile = pathname === "/profile" || pathname === "/profile/";

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex gap-8">
          <div className="hidden w-56 shrink-0 space-y-2 md:block">
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
        <p className="text-sm text-muted-foreground">{error ?? "User not found"}</p>
        <Link
          href="/login"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t(lang, "login")}
        </Link>
      </div>
    );
  }

  const { user, honey, subscription } = data;
  const tierCfg = getTierConfig(subscription.tier);

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
          <h1 className="truncate text-lg font-bold tracking-tight">
            {user.displayName ?? "User"}
          </h1>
          <Badge className={cn("shrink-0 text-[10px] font-semibold", tierCfg.color)}>
            {tierCfg.label}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-amber-500">🍯 {honey.points.toLocaleString()} pt</p>
        <p className="text-[10px] text-muted-foreground">
          {t(lang, "memberSince")}{" "}
          {new Date(user.createdAt).toLocaleDateString(
            lang === "TH" ? "th-TH" : lang === "JP" ? "ja-JP" : "en-US",
            { year: "numeric", month: "short" },
          )}
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-2 md:py-6">
      {/* Desktop layout: sidebar + content */}
      <div className="hidden gap-8 md:flex">
        <ProfileSidebar activeTab={activeTab} />
        <div className="min-w-0 flex-1 space-y-5">
          {activeTab === "overview" && profileCard}
          {children}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden">
        {isRootProfile ? (
          <div className="space-y-4">
            {profileCard}
            {children}
          </div>
        ) : (
          <div className="space-y-4">
            <ProfileMobileSectionHeader activeTab={activeTab} />
            {children}
          </div>
        )}
      </div>
    </div>
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
                    : "text-muted-foreground",
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
            <div className="flex size-12 items-center justify-center rounded-full bg-muted ring-2 ring-border">
              <span className="text-sm font-semibold text-muted-foreground">U</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">CardTracker User</h1>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Free
                </span>
              </div>
              <p className="text-xs text-muted-foreground">user@example.com</p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-amber-500">🍯 250</p>
              <p className="text-[10px] text-muted-foreground">
                {t(lang, "memberSince")} Jan 2025
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t(lang, "portfolios"), value: "2" },
              { label: t(lang, "watchlist"), value: "8" },
              { label: t(lang, "priceAlerts"), value: "3" },
              { label: t(lang, "decks"), value: "1" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border/40 bg-card p-4 text-center"
              >
                <p className="text-2xl font-semibold">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/40 bg-card p-4">
              <p className="text-sm font-semibold">{t(lang, "yourPlan")}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  Free
                </span>
              </div>
              <div className="mt-3 h-9 rounded-md bg-primary/10" />
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-400/5 to-orange-400/5 p-4">
              <p className="text-sm font-semibold">{t(lang, "honeyPoints")}</p>
              <p className="mt-2 text-2xl font-bold text-amber-500">🍯 250 pt</p>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                🔥 3 {t(lang, "days")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileLayoutShell({ children }: { children: ReactNode }) {
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
    <ProfileDataProvider>
      <ProfileLayoutInner>{children}</ProfileLayoutInner>
    </ProfileDataProvider>
  );
}
