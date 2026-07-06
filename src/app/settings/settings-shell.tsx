"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  MapPin,
  Receipt,
  Shield,
  Store,
  UserCog,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { Breadcrumb, type BreadcrumbItem } from "@/components/shared/breadcrumb";
import { BackButton } from "@/components/shared/back-button";
import { ProfileDataProvider, useProfileData } from "@/components/profile/profile-data-context";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { PageContainer } from "@/components/layout/page-container";
import { getTierConfig } from "@/components/profile/profile-types";
import { useAuthState } from "@/hooks/use-auth-state";
import { usePublicConfig } from "@/hooks/use-public-config";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const SETTINGS_SECTIONS = [
  { id: "account", href: "/settings/account", icon: UserCog, labelKey: "profileTabAccount" as const, group: "general" as const },
  { id: "privacy", href: "/settings/privacy", icon: Eye, labelKey: "privacy" as const, group: "general" as const },
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
          <PageContainer inShell width="reading" className="py-6">
            <Surface variant="outline" padding="xl" className="text-center">
              <p className="text-sm text-muted-foreground">Sign in to manage your settings</p>
            </Surface>
          </PageContainer>
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

  const { config: publicConfig } = usePublicConfig();
  const sectionSlug = pathname.split("/")[2];
  const isIndex = !sectionSlug;
  const activeSectionMeta = SETTINGS_SECTIONS.find((s) => s.id === sectionSlug);

  // Hide marketplace settings while the marketplace flag is off — SPEC §4 says
  // every marketplace surface must be invisible then (this was the last leak).
  const visibleSections = SETTINGS_SECTIONS.filter(
    (s) =>
      !(s.id === "notifications" && !settings) &&
      !(s.id === "marketplace" && !publicConfig.marketplaceEnabled),
  );

  if (loading) return <SettingsLoadingSkeleton />;

  if (!data) {
    return (
      <PageContainer inShell className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">{error ?? "User not found"}</p>
        <Link
          href="/login"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t(lang, "login")}
        </Link>
      </PageContainer>
    );
  }

  const { user, subscription } = data;
  const tierCfg = getTierConfig(subscription.tier);

  // Same Breadcrumb component as the rest of the app — sub-pages get the shared
  // circular back button on mobile (pointing to /settings) and the full trail on
  // desktop, instead of a bespoke text link labelled with the current page.
  const crumbs: BreadcrumbItem[] = isIndex
    ? [{ label: "Home", href: "/" }, { label: t(lang, "profileSettings") }]
    : [
        { label: "Home", href: "/" },
        { label: t(lang, "profileSettings"), href: "/settings" },
        { label: activeSectionMeta ? t(lang, activeSectionMeta.labelKey) : t(lang, "profileSettings") },
      ];
  const mobileTitle = isIndex
    ? t(lang, "profileSettings")
    : activeSectionMeta
      ? t(lang, activeSectionMeta.labelKey)
      : t(lang, "profileSettings");

  return (
    <PageContainer inShell className="py-2 md:py-6">
      {/* Desktop: full breadcrumb trail */}
      <div className="hidden md:block">
        <Breadcrumb items={crumbs} />
      </div>
      {/* Mobile: prominent back button beside the page title (the section pages
          hide their own h2 on mobile so this is the single title). Index →
          /more (its parent hub), sub-pages → /settings. */}
      <div className="mb-5 flex items-center gap-3 md:hidden">
        <BackButton
          href={isIndex ? "/more" : "/settings"}
          label={isIndex ? t(lang, "more") : t(lang, "profileSettings")}
        />
        <h1 className="text-large-title">{mobileTitle}</h1>
      </div>

      <div className="flex gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div>
            {/* Identity row — single-line, click to public profile */}
            <Link
              href={`/profile/${user.id}`}
              aria-label={t(lang, "viewPublicProfile")}
              title={t(lang, "viewPublicProfile")}
              className="group ease-chrome mb-6 flex items-center gap-3 rounded-lg border border-transparent dark:border-hair bg-muted/40 px-3 py-2.5 transition-colors hover:border-hair hover:bg-muted/70"
            >
              <Avatar className={cn("size-9 shrink-0 ring-2 ring-offset-2 ring-offset-background", tierCfg.ring)}>
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                <AvatarFallback className="text-sm font-bold">
                  {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{user.displayName ?? "User"}</p>
                  <Badge className={cn("h-4 shrink-0 px-1.5 text-micro", tierCfg.color)}>
                    {tierCfg.label}
                  </Badge>
                </div>
                <p className="text-meta inline-flex items-center gap-1 motion-base group-hover:text-foreground">
                  {t(lang, "viewPublicProfile")}
                  <ExternalLink className="size-3" />
                </p>
              </div>
            </Link>

            <nav className="space-y-5">
              {(() => {
                const groups = ["general", "more"] as const;
                const groupLabels = { general: "settingsGroupGeneral" as const, more: "settingsGroupMore" as const };
                return groups.map((group) => {
                  const items = visibleSections.filter((s) => s.group === group);
                  if (items.length === 0) return null;
                  return (
                    <div key={group} className="space-y-0.5">
                      <p className="mb-1.5 px-3 text-eyebrow text-muted-foreground/70">
                        {t(lang, groupLabels[group])}
                      </p>
                      {items.map(({ id, href, icon: Icon, labelKey }) => {
                        const active = isIndex ? id === "account" : sectionSlug === id;
                        return (
                          <Link
                            key={id}
                            href={href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "ease-chrome relative flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm",
                              active
                                ? "font-medium text-primary before:absolute before:inset-y-1 before:-left-0.5 before:w-0.5 before:rounded-full before:bg-primary"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                            )}
                          >
                            <Icon
                              className={cn(
                                "size-4 shrink-0 motion-base",
                                active && "text-primary",
                              )}
                            />
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
    </PageContainer>
  );
}

function SettingsLoadingSkeleton() {
  return (
    <PageContainer inShell className="py-6">
      {/* Mobile skeleton */}
      <div className="space-y-5 md:hidden">
        <Skeleton className="h-7 w-32" />
        <Surface variant="outline" padding="md" className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </Surface>
        {[7, 3].map((count, g) => (
          <div key={g} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Surface variant="outline" className="overflow-hidden">
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5",
                    i > 0 && "border-t border-hair",
                  )}
                >
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </Surface>
          </div>
        ))}
      </div>

      {/* Desktop skeleton */}
      <div className="hidden gap-10 md:flex">
        <div className="w-56 shrink-0">
          <div className="space-y-5">
            <div className="flex items-center gap-3 px-2 py-2">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
            {[7, 3].map((count, g) => (
              <div key={g} className="space-y-1.5">
                <Skeleton className="ml-3 h-3 w-12" />
                {Array.from({ length: count }).map((_, i) => (
                  <Skeleton key={i} className="h-8 rounded-lg" />
                ))}
              </div>
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
    </PageContainer>
  );
}
