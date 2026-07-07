"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Heart } from "lucide-react";

import { AlertsManagerClient } from "@/app/settings/alerts/alerts-manager-client";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { t, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import WatchlistClient from "./watchlist-client";

type TabKey = "cards" | "alerts";

const TABS: { key: TabKey; labelKey: TranslationKey; icon: typeof Heart }[] = [
  { key: "cards", labelKey: "watchlistTabCards", icon: Heart },
  { key: "alerts", labelKey: "watchlistTabAlerts", icon: Bell },
];

/**
 * `/watchlist` host — two lenses on "cards I track" under one destination: the
 * watched-cards list and the price-alerts manager (lifted out of Settings so it
 * lives next to the cards it fires on, instead of buried three taps deep). Tab
 * state lives in the URL (`?tab=alerts`) so deep-links from the row bell, the
 * More sheet, and notification settings all land on the right lens.
 */
export default function WatchlistTabs() {
  const { authed } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const lang = useUIStore((s) => s.language);

  const tab: TabKey = params.get("tab") === "alerts" ? "alerts" : "cards";

  const setTab = (next: TabKey) => {
    router.replace(next === "alerts" ? `${pathname}?tab=alerts` : pathname, {
      scroll: false,
    });
  };

  // Not signed in (or still resolving) → defer to the cards client, which owns
  // the loading skeleton and the sign-in preview gate. No tab chrome until
  // there's an account (both lenses require auth anyway).
  if (!authed) return <WatchlistClient />;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div
        role="tablist"
        aria-label={t(lang, "watchlistNav")}
        className="flex gap-1 border-b border-hair"
      >
        {TABS.map(({ key, labelKey, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={cn(
                "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium motion-base",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden />
              {t(lang, labelKey)}
            </button>
          );
        })}
      </div>

      {tab === "cards" ? <WatchlistClient /> : <AlertsManagerClient />}
    </div>
  );
}
