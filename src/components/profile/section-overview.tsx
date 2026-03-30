"use client";

import Link from "next/link";
import {
  Award,
  Bell,
  Calendar,
  Eye,
  Flame,
  Layers,
  Star,
  Store,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatByCurrency } from "@/lib/utils/currency";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ProfileStats, HoneyData } from "./profile-types";

type Props = {
  stats: ProfileStats;
  honey: HoneyData;
  userId: string;
  sellerRating: number | null;
  sellerReviewCount: number;
  checkinLoading: boolean;
  onCheckin: () => void;
};

export function SectionOverview({
  stats,
  honey,
  userId,
  sellerRating,
  sellerReviewCount,
  checkinLoading,
  onCheckin,
}: Props) {
  const lang = useUIStore((s) => s.language);
  const currency = useUIStore((s) => s.currency);
  const portfolioFormatted = formatByCurrency(stats.portfolioTotalValueJpy, currency);

  const activityItems = [
    { icon: Wallet, label: t(lang, "portfolios"), count: stats.portfolioCount, href: "/portfolio" },
    { icon: Eye, label: t(lang, "watchlist"), count: stats.watchlistCount, href: "/portfolio" },
    { icon: Bell, label: t(lang, "priceAlerts"), count: stats.priceAlertCount, href: "/portfolio" },
    { icon: Layers, label: t(lang, "decks"), count: stats.deckCount, href: "/deck-calculator" },
    { icon: Store, label: t(lang, "activeListings"), count: stats.activeListingCount, href: "/marketplace" },
    { icon: Star, label: t(lang, "reviewsReceived"), count: stats.reviewCount, href: `/profile/${userId}` },
  ];

  return (
    <div className="space-y-5">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link
          href="/portfolio"
          className="rounded-xl border border-border/40 bg-card p-4 transition-colors hover:border-primary/30"
        >
          <p className="text-muted-foreground text-xs">{t(lang, "profilePortfolioValue")}</p>
          <p className="font-price mt-1 text-lg font-semibold tracking-tight">
            {portfolioFormatted.primary}
          </p>
          <p className="text-muted-foreground text-xs">
            {stats.portfolioCardCount} {t(lang, "cardsCount")}
          </p>
        </Link>

        <Link
          href="/honey"
          className="rounded-xl border border-border/40 bg-card p-4 transition-colors hover:border-amber-500/30"
        >
          <p className="text-muted-foreground text-xs">{t(lang, "profileHoney")}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-amber-500">
            🍯 {honey.points.toLocaleString()}
          </p>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Flame className="size-3 text-orange-500" />
            {honey.streak} {t(lang, "days")} {t(lang, "profileStreak")}
          </div>
        </Link>

        <Link
          href={`/profile/${userId}`}
          className="rounded-xl border border-border/40 bg-card p-4 transition-colors hover:border-yellow-500/30"
        >
          <p className="text-muted-foreground text-xs">{t(lang, "profileSellerRating")}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">
            {sellerRating != null ? (
              <>
                <span className="text-yellow-500">★</span> {sellerRating.toFixed(1)}
              </>
            ) : (
              <span className="text-muted-foreground text-sm">{t(lang, "noRating")}</span>
            )}
          </p>
          <p className="text-muted-foreground text-xs">
            {sellerReviewCount} {t(lang, "reviewsReceived")}
          </p>
        </Link>

        <Link
          href="/portfolio"
          className="rounded-xl border border-border/40 bg-card p-4 transition-colors hover:border-primary/30"
        >
          <p className="text-muted-foreground text-xs">{t(lang, "profileCardsTracked")}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">{stats.watchlistCount}</p>
          <p className="text-muted-foreground text-xs">
            {stats.priceAlertCount} {t(lang, "priceAlerts")}
          </p>
        </Link>
      </div>

      {/* Honey check-in */}
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-400/5 to-orange-400/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="size-4 text-amber-500" />
            <h2 className="text-sm font-semibold">{t(lang, "honeyPoints")}</h2>
          </div>
          <Link
            href="/honey"
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            {t(lang, "viewAll")} →
          </Link>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-amber-500">🍯 {honey.points.toLocaleString()}</p>
            <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
              <Flame className="size-3 text-orange-500" />
              {honey.streak} {t(lang, "days")}
            </div>
          </div>
          <Button
            size="sm"
            disabled={!honey.canCheckin || checkinLoading}
            onClick={onCheckin}
            className={cn(
              honey.canCheckin ? "bg-amber-500 hover:bg-amber-600 text-white" : "opacity-60",
            )}
          >
            <Calendar className="mr-1.5 size-3.5" />
            {honey.canCheckin ? t(lang, "profileCheckin") : t(lang, "profileCheckedIn")}
          </Button>
        </div>
      </div>

      {/* Activity grid */}
      <div className="rounded-xl border border-border/40 bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t(lang, "activityOverview")}</h2>
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
          {activityItems.map(({ icon: Icon, label, count, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-1 rounded-lg p-2.5 text-center transition-colors hover:bg-muted/50"
            >
              <Icon className="size-5 text-muted-foreground" />
              <span className="text-lg font-semibold">{count}</span>
              <span className="text-muted-foreground text-[10px] leading-tight sm:text-xs">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
