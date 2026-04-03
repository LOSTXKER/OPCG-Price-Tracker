"use client";

import Link from "next/link";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  LayoutDashboard,
  Store,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

export const PROFILE_TABS = [
  "overview",
  "subscription",
  "notifications",
  "marketplace",
  "export",
  "account",
] as const;

export type ProfileTab = (typeof PROFILE_TABS)[number];

const TAB_CONFIG: Record<
  ProfileTab,
  { icon: typeof LayoutDashboard; labelKey: Parameters<typeof t>[1] }
> = {
  overview: { icon: LayoutDashboard, labelKey: "profileTabOverview" },
  subscription: { icon: CreditCard, labelKey: "profileTabSubscription" },
  notifications: { icon: Bell, labelKey: "profileTabNotifications" },
  marketplace: { icon: Store, labelKey: "profileTabMarketplace" },
  export: { icon: Download, labelKey: "profileTabExport" },
  account: { icon: UserCog, labelKey: "profileTabAccount" },
};

export const TAB_HREF: Record<ProfileTab, string> = {
  overview: "/profile",
  subscription: "/profile/subscription",
  notifications: "/profile/notifications",
  marketplace: "/profile/marketplace",
  export: "/profile/export",
  account: "/profile/account",
};

type SidebarProps = {
  activeTab: ProfileTab;
};

export function ProfileSidebar({ activeTab }: SidebarProps) {
  const lang = useUIStore((s) => s.language);

  return (
    <nav className="hidden w-56 shrink-0 md:block">
      <div className="sticky top-24 space-y-1">
        {PROFILE_TABS.map((tab) => {
          const { icon: Icon, labelKey } = TAB_CONFIG[tab];
          const active = activeTab === tab;
          return (
            <Link
              key={tab}
              href={TAB_HREF[tab]}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {t(lang, labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function ProfileMobileMenu() {
  const lang = useUIStore((s) => s.language);

  return (
    <div className="divide-y divide-border/40">
      {PROFILE_TABS.map((tab) => {
        const { icon: Icon, labelKey } = TAB_CONFIG[tab];
        const href = tab === "overview" ? "/profile/overview" : TAB_HREF[tab];
        return (
          <Link
            key={tab}
            href={href}
            className="flex w-full items-center gap-3.5 px-1 py-3.5 text-sm font-medium text-foreground transition-colors active:bg-muted/50"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted/60">
              <Icon className="size-4.5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left">{t(lang, labelKey)}</span>
            <ChevronRight className="size-4 text-muted-foreground/60" />
          </Link>
        );
      })}
    </div>
  );
}

type MobileHeaderProps = {
  activeTab: ProfileTab;
};

export function ProfileMobileSectionHeader({ activeTab }: MobileHeaderProps) {
  const lang = useUIStore((s) => s.language);
  const { labelKey } = TAB_CONFIG[activeTab];

  return (
    <div className="flex items-center gap-2 pb-2">
      <Link
        href="/profile"
        className="-ml-1 flex items-center gap-1 text-sm font-medium text-primary transition-opacity active:opacity-70"
      >
        <ChevronLeft className="size-5" />
        <span>{t(lang, "back")}</span>
      </Link>
      <span className="ml-auto text-sm font-semibold text-foreground">
        {t(lang, labelKey)}
      </span>
    </div>
  );
}
