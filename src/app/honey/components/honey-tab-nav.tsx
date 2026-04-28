"use client";

import { ClipboardList, History, Link2, Medal, ShoppingBag, Ticket, Trophy } from "lucide-react";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { TabKey } from "../types";

type GroupDef = {
  id: string;
  labelKey: TranslationKey;
  items: { key: TabKey; icon: typeof Trophy; labelKey: TranslationKey }[];
};

/**
 * Grouped navigation for /honey. Three sections that map to user intent:
 *   - Earn / ทำภารกิจ: missions, achievements
 *   - Rewards / รางวัล: shop, raffle
 *   - Community / ชุมชน: rankings, referral, activity
 *
 * On lg+ this renders as a vertical sidebar.
 * On smaller screens it renders as a horizontally-scrolling tab bar (flat).
 */
const GROUPS: GroupDef[] = [
  {
    id: "earn",
    labelKey: "tabGroupEarn",
    items: [
      { key: "missions", icon: ClipboardList, labelKey: "dailyMissions" },
      { key: "achievements", icon: Medal, labelKey: "achievements" },
    ],
  },
  {
    id: "rewards",
    labelKey: "tabGroupRewards",
    items: [
      { key: "shop", icon: ShoppingBag, labelKey: "honeyShop" },
      { key: "raffle", icon: Ticket, labelKey: "monthlyRaffle" },
    ],
  },
  {
    id: "community",
    labelKey: "tabGroupCommunity",
    items: [
      { key: "rankings", icon: Trophy, labelKey: "honeyLeaderboard" },
      { key: "referral", icon: Link2, labelKey: "referralLink" },
      { key: "activity", icon: History, labelKey: "activity" },
    ],
  },
];

export function HoneyTabNav({
  tab,
  onTabChange,
  lang,
}: {
  tab: TabKey;
  onTabChange: (next: TabKey) => void;
  lang: Language;
}) {
  return (
    <>
      <DesktopSidebarNav tab={tab} onTabChange={onTabChange} lang={lang} />
      <MobileTabBar tab={tab} onTabChange={onTabChange} lang={lang} />
    </>
  );
}

function DesktopSidebarNav({
  tab,
  onTabChange,
  lang,
}: {
  tab: TabKey;
  onTabChange: (next: TabKey) => void;
  lang: Language;
}) {
  return (
    <nav
      role="tablist"
      aria-orientation="vertical"
      aria-label={t(lang, "honeyPageTitle")}
      className="hidden lg:sticky lg:top-20 lg:block lg:h-fit lg:space-y-5"
    >
      {GROUPS.map((group) => (
        <div key={group.id} className="space-y-1">
          <p className="px-2 text-eyebrow">{t(lang, group.labelKey)}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  role="tab"
                  aria-selected={active}
                  aria-controls={`honey-tabpanel-${item.key}`}
                  id={`honey-tab-${item.key}`}
                  onClick={() => onTabChange(item.key)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
                  <span className="min-w-0 flex-1 truncate">{t(lang, item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function MobileTabBar({
  tab,
  onTabChange,
  lang,
}: {
  tab: TabKey;
  onTabChange: (next: TabKey) => void;
  lang: Language;
}) {
  const allItems = GROUPS.flatMap((g) => g.items);
  return (
    <div
      role="tablist"
      aria-label={t(lang, "honeyPageTitle")}
      className="flex gap-0.5 overflow-x-auto rounded-lg bg-muted/30 p-1 scrollbar-none lg:hidden"
    >
      {allItems.map((item) => {
        const Icon = item.icon;
        const active = tab === item.key;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={active}
            aria-controls={`honey-tabpanel-${item.key}`}
            id={`honey-tab-mobile-${item.key}`}
            onClick={() => onTabChange(item.key)}
            title={t(lang, item.labelKey)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2.5 text-xs font-medium transition-all sm:px-4",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{t(lang, item.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
