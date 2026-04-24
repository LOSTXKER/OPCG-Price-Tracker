"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  CreditCard,
  Download,
  ExternalLink,
  MapPin,
  Receipt,
  Shield,
  Store,
  UserCog,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileDataProvider, useProfileData } from "@/components/profile/profile-data-context";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { getTierConfig } from "@/components/profile/profile-types";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const SETTINGS_SECTIONS = [
  { id: "account", href: "/settings/account", icon: UserCog, labelKey: "profileTabAccount" as const, group: "general" as const },
  { id: "subscription", href: "/settings/subscription", icon: CreditCard, labelKey: "subscription" as const, group: "general" as const },
  { id: "billing", href: "/settings/billing", icon: Receipt, labelKey: "billingHistory" as const, group: "general" as const },
  { id: "security", href: "/settings/security", icon: Shield, labelKey: "security" as const, group: "general" as const },
  { id: "notifications", href: "/settings/notifications", icon: Bell, labelKey: "notifications" as const, group: "general" as const },
  { id: "marketplace", href: "/settings/marketplace", icon: Store, labelKey: "marketplace" as const, group: "more" as const },
  { id: "addresses", href: "/settings/addresses", icon: MapPin, labelKey: "addresses" as const, group: "more" as const },
  { id: "export", href: "/settings/export", icon: Download, labelKey: "goToExport" as const, group: "more" as const },
];

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const { authed } = useAuthState();

  if (authed === null) return <SettingsLoadingSkeleton />;
  if (authed === false) {
    return (
      <AuthPreviewGate
        preview={
          <div className="mx-auto max-w-2xl px-4 py-6">
            <div className="rounded-xl border border-border/40 bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Sign in to manage your settings</p>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <ProfileDataProvider>
      <SettingsShellInner>{children}</SettingsShellInner>
    </ProfileDataProvider>
  );
}

function SettingsShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lang = useUIStore((s) => s.language);
  const { data, settings, loading, error } = useProfileData();

  const sectionSlug = pathname.split("/")[2];
  const isIndex = !sectionSlug;
  const activeSectionMeta = SETTINGS_SECTIONS.find((s) => s.id === sectionSlug);

  const visibleSections = SETTINGS_SECTIONS.filter(
    (s) => !(s.id === "notifications" && !settings),
  );

  if (loading) return <SettingsLoadingSkeleton />;

  if (!data) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-16 text-center md:px-6 lg:px-8">
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

  const { user, subscription } = data;
  const tierCfg = getTierConfig(subscription.tier);

  return (
    <div className="mx-auto max-w-7xl px-4 py-2 md:px-6 md:py-6 lg:px-8">
      {/* Mobile: back button on sub-routes */}
      {!isIndex && (
        <div className="mb-4 md:hidden">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors active:text-primary/70"
          >
            <ChevronLeft className="size-4" />
            {activeSectionMeta ? t(lang, activeSectionMeta.labelKey) : t(lang, "profileSettings")}
          </Link>
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="panel sticky top-24 space-y-4 p-4">
            <div className="flex items-center gap-3">
              <Avatar className={cn("size-10 ring-2 ring-offset-2 ring-offset-background", tierCfg.ring)}>
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                <AvatarFallback className="text-sm font-bold">
                  {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.displayName ?? "User"}</p>
                <Badge className={cn("mt-0.5 text-xs font-semibold", tierCfg.color)}>
                  {tierCfg.label}
                </Badge>
              </div>
            </div>

            <Link
              href={`/profile/${user.id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(lang, "viewPublicProfile")}
              <ExternalLink className="size-3" />
            </Link>

            <div className="h-px bg-border/40" />

            <nav className="space-y-0.5">
              {(() => {
                const groups = ["general", "more"] as const;
                const groupLabels = { general: "settingsGroupGeneral" as const, more: "settingsGroupMore" as const };
                return groups.map((group) => {
                  const items = visibleSections.filter((s) => s.group === group);
                  if (items.length === 0) return null;
                  return (
                    <div key={group}>
                      {group !== "general" && <div className="my-2 h-px bg-border/40" />}
                      <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                        {t(lang, groupLabels[group])}
                      </p>
                      {items.map(({ id, href, icon: Icon, labelKey }) => {
                        const active = isIndex ? id === "account" : sectionSlug === id;
                        return (
                          <Link
                            key={id}
                            href={href}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
                              active
                                ? "bg-primary/10 font-medium text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <Icon className="size-4 shrink-0" />
                            {t(lang, labelKey)}
                          </Link>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 pb-16">
          {children}
        </div>
      </div>
    </div>
  );
}

function SettingsLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      {/* Mobile skeleton */}
      <div className="space-y-5 md:hidden">
        <Skeleton className="h-7 w-32" />
        <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card p-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        {[6, 3].map((count, g) => (
          <div key={g} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <div className="overflow-hidden rounded-xl border border-border/40 bg-card">
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5",
                    i > 0 && "border-t border-border/30",
                  )}
                >
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop skeleton */}
      <div className="hidden gap-8 md:flex">
        <div className="w-56 shrink-0">
          <div className="panel space-y-4 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="h-px bg-border/40" />
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-5">
          <Skeleton className="h-7 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
