"use client";

import type { ComponentType, SVGProps } from "react";
import {
  CalendarDays,
  Clock,
  Layers,
  Package,
  Star,
  Users,
} from "lucide-react";

import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatJoinedRelative } from "@/lib/utils/relative-time";
import type {
  CollectionStats,
  SellerStats,
} from "@/lib/profile/load-public-profile";

import type { ProfileStats, ProfileTab, ProfileUser } from "./types";

type StatItem = {
  key: string;
  label: string;
  value: string;
  sublabel?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  jumpTo?: ProfileTab;
  accent?: string;
};

/**
 * GitHub-style key metrics row that lives directly under the hero. Pulls
 * from data already loaded by the page — adds zero queries. Each tile is a
 * button: tapping it switches to the most relevant tab so visitors can drill
 * into the number they care about.
 */
export function ProfileStatsStrip({
  user,
  stats,
  sellerStats,
  collectionStats,
  lang,
  onJump,
}: {
  user: ProfileUser;
  stats: ProfileStats;
  sellerStats: SellerStats;
  collectionStats: CollectionStats;
  lang: Language;
  onJump?: (tab: ProfileTab) => void;
}) {
  const items: StatItem[] = [
    {
      key: "listings",
      label: t(lang, "statsListings"),
      value: stats.listingCount.toLocaleString(),
      icon: Package,
      jumpTo: "listings",
    },
    {
      key: "rating",
      label: t(lang, "statsRating"),
      value: sellerStats.rating != null ? sellerStats.rating.toFixed(1) : "—",
      sublabel:
        stats.reviewCount > 0
          ? `${stats.reviewCount.toLocaleString()} ${t(lang, "tabReviews").toLowerCase()}`
          : undefined,
      icon: Star,
      jumpTo: "reviews",
      accent: "text-amber-500",
    },
    {
      key: "cards",
      label: t(lang, "statsCards"),
      value: stats.portfolioCardCount.toLocaleString(),
      sublabel:
        collectionStats.uniqueCards > 0
          ? `${collectionStats.uniqueCards.toLocaleString()} unique`
          : undefined,
      icon: Layers,
      jumpTo: "collection",
    },
    {
      key: "sets",
      label: t(lang, "statsSets"),
      value: collectionStats.setsCollected.toLocaleString(),
      icon: Users,
      jumpTo: "collection",
    },
    {
      key: "response",
      label: t(lang, "statsResponse"),
      value: formatResponse(lang, sellerStats.responseHours),
      icon: Clock,
    },
    {
      key: "joined",
      label: t(lang, "statsJoined"),
      value: formatJoinedRelative(user.createdAt, lang),
      icon: CalendarDays,
    },
  ];

  return (
    <div
      className={cn(
        // Mobile: horizontal snap-scroll so we don't truncate any tile.
        // Desktop: 6-up grid that shrinks gracefully to 3-up at md.
        "mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:grid sm:gap-3 sm:overflow-visible sm:px-0",
        "sm:grid-cols-3 md:grid-cols-6 sm:mx-0",
        "scrollbar-none snap-x snap-mandatory",
      )}
      role="list"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const interactive = item.jumpTo != null && onJump != null;
        const cls = cn(
          "group/stat snap-start min-w-[120px] sm:min-w-0",
          "flex flex-col items-start gap-1 rounded-xl border border-border/50 bg-card/60 px-3 py-2.5 text-left",
          "transition-all duration-150",
          interactive &&
            "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        );
        const inner = (
          <>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Icon className={cn("size-3", item.accent)} />
              {item.label}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular-nums leading-none">
                {item.value}
              </span>
              {item.sublabel && (
                <span className="text-[10px] text-muted-foreground">
                  {item.sublabel}
                </span>
              )}
            </div>
          </>
        );
        if (interactive) {
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onJump?.(item.jumpTo!)}
              className={cls}
              role="listitem"
            >
              {inner}
            </button>
          );
        }
        return (
          <div key={item.key} className={cls} role="listitem">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

function formatResponse(lang: Language, hours: number | null): string {
  if (hours == null) return t(lang, "statsResponseNoData");
  if (hours < 1) return t(lang, "statsResponseFast");
  if (hours < 24) return t(lang, "statsResponseHours").replace("{h}", String(Math.round(hours)));
  const days = Math.max(1, Math.round(hours / 24));
  return t(lang, "statsResponseDays").replace("{d}", String(days));
}
