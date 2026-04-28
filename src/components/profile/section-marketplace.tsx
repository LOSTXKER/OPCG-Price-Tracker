"use client";

import Link from "next/link";
import { ExternalLink, Package, Plus, ShieldCheck, Star, Store } from "lucide-react";
import { PriceDisplay } from "@/components/shared/price-display";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ListingBrief } from "./profile-types";

type Props = {
  listings: ListingBrief[];
  userId: string;
  sellerRating?: number | null;
  sellerReviewCount?: number;
};

export function SectionMarketplace({ listings, userId, sellerRating, sellerReviewCount = 0 }: Props) {
  const lang = useUIStore((s) => s.language);

  const dashboardStats = [
    {
      icon: Package,
      label: t(lang, "activeListings"),
      value: listings.length,
      color: "bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400",
    },
    {
      icon: Star,
      label: t(lang, "profileSellerRating"),
      value: sellerRating != null ? `★ ${sellerRating.toFixed(1)}` : "—",
      color: "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    },
    {
      icon: ShieldCheck,
      label: t(lang, "reviewsReceived"),
      value: sellerReviewCount,
      color: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-h3">
          <Store className="size-5" />
          {t(lang, "sellerDashboard")}
        </h2>
        <Link href="/marketplace/create">
          <Button size="sm" className="gap-1.5 rounded-full">
            <Plus className="size-3.5" />
            {t(lang, "listCard")}
          </Button>
        </Link>
      </div>

      {/* Seller stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {dashboardStats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-card p-4 text-center">
            <div className={cn("flex size-9 items-center justify-center rounded-lg", color)}>
              <Icon className="size-4.5" />
            </div>
            <span className="text-xl font-bold leading-none tabular-nums">{value}</span>
            <span className="text-xs leading-tight text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Active listings */}
      <div className="rounded-xl border border-border/40 bg-card">
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
          <h3 className="text-sm font-semibold">{t(lang, "myListings")}</h3>
          <Link
            href={`/profile/${userId}`}
            className="flex items-center gap-1 text-meta transition-colors hover:text-foreground"
          >
            {t(lang, "viewPublicProfile")}
            <ExternalLink className="size-3" />
          </Link>
        </div>
        <div className="p-5">
          {listings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <Store className="size-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">{t(lang, "noListings")}</p>
              <Link href="/marketplace/create">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="size-3.5" />
                  {t(lang, "listCard")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {listings.map((l) => (
                <Link
                  key={l.id}
                  href={`/marketplace/${l.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/30 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">
                      {lang === "EN" ? l.card.nameEn ?? l.card.nameJp : l.card.nameJp}
                    </span>
                    <span className="ml-2 text-meta">{l.card.cardCode}</span>
                  </div>
                  <PriceDisplay
                    priceJpy={l.priceJpy}
                    priceThb={l.priceThb ?? undefined}
                    showChange={false}
                    size="sm"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reputation */}
      <div className="rounded-xl border border-border/40 bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-500/10">
              <ShieldCheck className="size-4.5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t(lang, "reputationTitle")}</h3>
              <p className="text-meta">
                {sellerReviewCount} {t(lang, "reviewsReceived")}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-5",
                  sellerRating != null && i < Math.round(sellerRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/20",
                )}
              />
            ))}
            {sellerRating != null && (
              <span className="ml-2 text-sm font-semibold">{sellerRating.toFixed(1)}</span>
            )}
          </div>
          <Link
            href={`/profile/${userId}`}
            className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {t(lang, "viewPublicProfile")}
            <ExternalLink className="size-3" />
          </Link>
        </div>
    </div>
  );
}
