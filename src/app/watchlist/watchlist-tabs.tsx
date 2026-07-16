"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Heart, Plus } from "lucide-react";

import { AlertsManagerClient } from "@/app/settings/alerts/alerts-manager-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { t, type TranslationKey } from "@/lib/i18n";

import WatchlistClient from "./watchlist-client";
import {
  buildWatchlistTabHref,
  getWatchlistTab,
  type WatchlistTab,
} from "./watchlist-tab-query";
import type { WatchlistPanelState } from "./watchlist-types";

const TABS: { key: WatchlistTab; labelKey: TranslationKey; icon: typeof Heart }[] = [
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
  const [addOpen, setAddOpen] = useState(false);
  const [createAlertOpen, setCreateAlertOpen] = useState(false);
  const [cardsState, setCardsState] = useState<WatchlistPanelState>({
    status: "loading",
    itemCount: 0,
  });
  const [alertsState, setAlertsState] = useState<WatchlistPanelState>({
    status: "loading",
    itemCount: 0,
  });

  const tab = getWatchlistTab(params);

  const setTab = (next: WatchlistTab) => {
    router.replace(buildWatchlistTabHref(pathname, params, next), { scroll: false });
  };

  // Not signed in (or still resolving) → defer to the cards client, which owns
  // the loading skeleton and the sign-in preview gate. No tab chrome until
  // there's an account (both lenses require auth anyway).
  if (!authed) return <WatchlistClient />;

  const activeState = tab === "cards" ? cardsState : alertsState;
  const showHeaderAction =
    activeState.status === "ready" && activeState.itemCount > 0;

  return (
    <div>
      <PageHeader
        title={t(lang, "watchlistNav")}
        className="mb-2 md:mb-3"
        actions={
          showHeaderAction ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                tab === "cards" ? setAddOpen(true) : setCreateAlertOpen(true)
              }
              className="gap-1.5 sm:min-h-11 md:min-h-0"
            >
              <Plus className="size-4" />
              {tab === "cards" ? t(lang, "addCard") : t(lang, "createAlert")}
            </Button>
          ) : undefined
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value === "alerts" ? "alerts" : "cards")}
        className="gap-0"
      >
        <TabsList
          variant="line"
          aria-label={t(lang, "watchlistNav")}
          className="w-full justify-start border-b border-hair p-0 group-data-horizontal/tabs:h-11 md:group-data-horizontal/tabs:h-9"
        >
          {TABS.map(({ key, labelKey, icon: Icon }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="min-h-11 flex-none px-3 group-data-horizontal/tabs:after:bottom-0 md:min-h-9"
            >
              <Icon className="size-4" aria-hidden />
              {t(lang, labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="cards" className="pt-3 md:pt-2">
          <WatchlistClient
            addOpen={addOpen}
            onAddOpenChange={setAddOpen}
            onPageStateChange={setCardsState}
          />
        </TabsContent>
        <TabsContent value="alerts" className="pt-3 md:pt-2">
          <AlertsManagerClient
            createOpen={createAlertOpen}
            onCreateOpenChange={setCreateAlertOpen}
            onPageStateChange={setAlertsState}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
