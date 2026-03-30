"use client";

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

type SidebarProps = {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
};

export function ProfileSidebar({ activeTab, onTabChange }: SidebarProps) {
  const lang = useUIStore((s) => s.language);

  return (
    <nav className="hidden md:block w-56 shrink-0">
      <div className="sticky top-24 space-y-1">
        {PROFILE_TABS.map((tab) => {
          const { icon: Icon, labelKey } = TAB_CONFIG[tab];
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {t(lang, labelKey)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

type MobileMenuProps = {
  onTabChange: (tab: ProfileTab) => void;
};

export function ProfileMobileMenu({ onTabChange }: MobileMenuProps) {
  const lang = useUIStore((s) => s.language);

  return (
    <div className="divide-y divide-border/40">
      {PROFILE_TABS.map((tab) => {
        const { icon: Icon, labelKey } = TAB_CONFIG[tab];
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className="flex w-full items-center gap-3.5 px-1 py-3.5 text-sm font-medium text-foreground active:bg-muted/50 transition-colors"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted/60">
              <Icon className="size-4.5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left">{t(lang, labelKey)}</span>
            <ChevronRight className="size-4 text-muted-foreground/60" />
          </button>
        );
      })}
    </div>
  );
}

type MobileHeaderProps = {
  activeTab: ProfileTab;
  onBack: () => void;
};

export function ProfileMobileSectionHeader({ activeTab, onBack }: MobileHeaderProps) {
  const lang = useUIStore((s) => s.language);
  const { labelKey } = TAB_CONFIG[activeTab];

  return (
    <div className="flex items-center gap-2 pb-2">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-primary active:opacity-70 transition-opacity -ml-1"
      >
        <ChevronLeft className="size-5" />
        <span>{t(lang, "back")}</span>
      </button>
      <span className="text-sm font-semibold text-foreground ml-auto">
        {t(lang, labelKey)}
      </span>
    </div>
  );
}
