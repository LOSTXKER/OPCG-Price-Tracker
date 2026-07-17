"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

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

const TABS: { key: WatchlistTab; labelKey: TranslationKey }[] = [
  { key: "cards", labelKey: "watchlistTabCards" },
  { key: "alerts", labelKey: "watchlistTabAlerts" },
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
      {/* Header: large title + ONE clear primary (honey) CTA. The CTA follows
          the active tab — add a card vs create an alert. */}
      <PageHeader
        title={t(lang, "watchlistNav")}
        className="mb-4 md:mb-5"
        actions={
          showHeaderAction ? (
            <Button
              onClick={() =>
                tab === "cards" ? setAddOpen(true) : setCreateAlertOpen(true)
              }
              className="gap-1.5 min-h-11 md:min-h-10"
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
        {/* Text-only tabs with real breathing room above the content. */}
        <TabsList
          variant="line"
          aria-label={t(lang, "watchlistNav")}
          className="w-full justify-start gap-1 border-b border-hair p-0 group-data-horizontal/tabs:h-11 md:group-data-horizontal/tabs:h-10"
        >
          {TABS.map(({ key, labelKey }) => {
            const state = key === "cards" ? cardsState : alertsState;
            const showCount = state.status === "ready" && state.itemCount > 0;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="min-h-11 flex-none px-3.5 group-data-horizontal/tabs:after:bottom-0 md:min-h-10"
              >
                {t(lang, labelKey)}
                {/* จำนวนของแท็บอยู่บนแท็บ — แทนที่บรรทัด "ติดตาม N ใบ" เดิม */}
                {showCount && (
                  <span className="text-micro tabular-nums opacity-60">
                    {state.itemCount.toLocaleString()}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="cards" className="pt-4 md:pt-5">
          <WatchlistClient
            addOpen={addOpen}
            onAddOpenChange={setAddOpen}
            onPageStateChange={setCardsState}
          />
        </TabsContent>
        <TabsContent value="alerts" className="pt-4 md:pt-5">
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
