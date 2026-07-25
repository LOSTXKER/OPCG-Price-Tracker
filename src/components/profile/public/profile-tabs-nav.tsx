"use client";

import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

import { formatTabBadge } from "./tier-banner";
import type { ProfileTab } from "./types";

export type TabDescriptor = {
  key: ProfileTab;
  labelKey: Parameters<typeof t>[1];
  count?: number;
};

/**
 * Public-profile tab bar.
 *
 *   - Sticks to the top of the viewport while scrolling so visitors never
 *     lose the navigation when browsing long listing/collection grids.
 *     Offsets account for both the mobile (h-14 = 56px) and desktop (~86px)
 *     site headers so tabs land flush under whichever header is showing.
 *   - Uses the canonical tabs primitive for the WAI-ARIA relationship,
 *     roving focus, and ←/→/Home/End keyboard navigation.
 *   - Active tab uses one clear underline instead of stacked indicators.
 */
export function ProfileTabsNav({
  tabs,
  lang,
}: {
  tabs: TabDescriptor[];
  lang: Language;
}) {
  if (tabs.length === 0) return null;

  return (
    <div
      className={cn(
        // Sticky directly under the global header. The container is wider
        // than its parent on either side so the active-tab underline + bg
        // fill the viewport edge-to-edge instead of stopping at the page
        // padding. We deliberately omit a bottom border here — the tab
        // section panel below docks against the nav and provides its own
        // visual edge, so a border-b would just create a double divider.
        "sticky z-30 -mx-5 mt-8 bg-background px-5",
        "top-[var(--chrome-h)] md:-mx-6 md:px-6 lg:-mx-8 lg:px-8",
      )}
    >
      <TabsList
        variant="line"
        aria-label="Profile sections"
        className="-mb-px flex w-full justify-start gap-1 overflow-x-auto rounded-none bg-background p-0 pb-px scrollbar-none group-data-horizontal/tabs:h-auto"
      >
        {tabs.map(({ key, labelKey, count }) => (
          <TabsTrigger
            key={key}
            value={key}
            className={cn(
              "group/tab min-h-11 flex-none rounded-none px-3 py-3 text-sm sm:px-4",
              "group-data-horizontal/tabs:after:bottom-0",
            )}
          >
            {t(lang, labelKey)}
            {count != null && count > 0 && (
              <span className="rounded-full bg-muted/60 px-1.5 text-micro tabular-nums text-muted-foreground group-data-[active]/tab:bg-primary/15 group-data-[active]/tab:text-primary">
                {formatTabBadge(count)}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}
