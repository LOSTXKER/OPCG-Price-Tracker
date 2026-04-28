"use client";

import { useId, useRef } from "react";

import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
 *   - Implements the WAI-ARIA tabs pattern (`role="tablist"`,
 *     `aria-selected`, full keyboard navigation with ←/→/Home/End) so
 *     screen-reader users can scan tabs without picking up extra noise.
 *   - Active tab gets a soft pill background plus the underline for
 *     "obviously selected even at a glance".
 */
export function ProfileTabsNav({
  tabs,
  active,
  onChange,
  lang,
}: {
  tabs: TabDescriptor[];
  active: ProfileTab;
  onChange: (key: ProfileTab) => void;
  lang: Language;
}) {
  const navId = useId();
  const buttonsRef = useRef<Map<ProfileTab, HTMLButtonElement | null>>(new Map());

  if (tabs.length === 0) return null;

  const focusTab = (key: ProfileTab) => {
    const el = buttonsRef.current.get(key);
    el?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    const target = tabs[next].key;
    onChange(target);
    focusTab(target);
  };

  return (
    <div
      className={cn(
        // Sticky directly under the global header. The container is wider
        // than its parent on either side so the active-tab underline + bg
        // fill the viewport edge-to-edge instead of stopping at the page
        // padding. We deliberately omit a bottom border here — the tab
        // section panel below docks against the nav and provides its own
        // visual edge, so a border-b would just create a double divider.
        "sticky z-30 -mx-4 mt-8 bg-background/85 px-4 backdrop-blur",
        "supports-[backdrop-filter]:bg-background/70",
        "top-14 md:top-[86px] md:-mx-6 md:px-6 lg:-mx-8 lg:px-8",
      )}
    >
      <nav
        id={navId}
        role="tablist"
        aria-label="Profile sections"
        className="-mb-px flex gap-1 overflow-x-auto pb-px scrollbar-none"
      >
        {tabs.map(({ key, labelKey, count }, idx) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              ref={(el) => {
                buttonsRef.current.set(key, el);
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${navId}-panel-${key}`}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, idx)}
              onClick={() => onChange(key)}
              className={cn(
                "group/tab relative inline-flex shrink-0 items-center gap-1.5 border-b-[3px] px-3 py-3 text-sm font-medium transition-colors sm:px-4",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-md",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {/* Brand-tinted pill behind the active tab — replaces the old
                  near-invisible primary/8 wash with a confident primary/10
                  band so the selected tab reads at a glance. */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-x-1 inset-y-1.5 -z-10 rounded-md bg-primary/10"
                />
              )}
              {t(lang, labelKey)}
              {count != null && count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-micro tabular-nums",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/70 text-muted-foreground",
                  )}
                >
                  {formatTabBadge(count)}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
