"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Package, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { ProfileListingCard } from "../cards/profile-listing-card";
import type { SerializedListing } from "../types";
import { TabToolbar, type FilterChip, type SortOption } from "./tab-toolbar";

type ListingFilter = "all" | "NM" | "LP" | "MP+" | "deal";
type ListingSort = "recent" | "priceAsc" | "priceDesc" | "deal";

const DEAL_THRESHOLD_PCT = -10; // ≥ 10% below market = deal

export function ListingsTabContent({
  listings,
  listingTotal,
  sellerHandleOrId,
  isOwner,
  lang,
}: {
  listings: SerializedListing[];
  listingTotal: number;
  sellerHandleOrId: string;
  isOwner: boolean;
  lang: Language;
}) {
  const [filter, setFilter] = useState<ListingFilter>("all");
  const [sort, setSort] = useState<ListingSort>("recent");

  const filtered = useMemo(() => {
    let arr = listings.slice();
    if (filter === "NM") arr = arr.filter((l) => l.condition.toUpperCase() === "NM");
    else if (filter === "LP") arr = arr.filter((l) => l.condition.toUpperCase() === "LP");
    else if (filter === "MP+")
      arr = arr.filter((l) => ["MP", "HP", "DMG"].includes(l.condition.toUpperCase()));
    else if (filter === "deal") arr = arr.filter((l) => isDeal(l));

    switch (sort) {
      case "priceAsc":
        arr.sort((a, b) => a.priceJpy - b.priceJpy);
        break;
      case "priceDesc":
        arr.sort((a, b) => b.priceJpy - a.priceJpy);
        break;
      case "deal":
        arr.sort((a, b) => dealDelta(a) - dealDelta(b));
        break;
      case "recent":
      default:
        arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
    }
    return arr;
  }, [listings, filter, sort]);

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
          <Store className="size-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{t(lang, "noListingsPublic")}</p>
        {isOwner && (
          <Link href="/marketplace/create">
            <Button size="sm" className="gap-1.5 rounded-full">
              <Package className="size-3.5" />
              {t(lang, "startSelling")}
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Subtle inline meta — only worth showing if we have a real range to brag
  // about. For a single listing the tab badge already shows the count.
  let metaLine: string | null = null;
  if (listings.length >= 2) {
    const prices = listings
      .map((l) => l.priceThb)
      .filter((p): p is number => typeof p === "number" && p > 0);
    if (prices.length >= 2) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const fmt = (n: number) => `฿${Math.round(n).toLocaleString()}`;
      metaLine = min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
    }
  }

  const filters: FilterChip<ListingFilter>[] = [
    { value: "all", label: t(lang, "filterAll") },
    { value: "NM", label: "NM" },
    { value: "LP", label: "LP" },
    { value: "MP+", label: "MP+" },
    { value: "deal", label: `⚡ ${t(lang, "sortDeal")}` },
  ];

  const sortOptions: SortOption<ListingSort>[] = [
    { value: "recent", label: t(lang, "sortRecent") },
    { value: "priceAsc", label: t(lang, "sortPriceAsc") },
    { value: "priceDesc", label: t(lang, "sortPriceDesc") },
    { value: "deal", label: t(lang, "sortDeal") },
  ];

  return (
    <div className="space-y-5">
      <TabToolbar
        filters={filters}
        activeFilter={filter}
        onFilter={setFilter}
        sortOptions={sortOptions}
        activeSort={sort}
        onSort={setSort}
        lang={lang}
      />

      {metaLine && (
        <p className="text-sm text-muted-foreground">{metaLine}</p>
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t(lang, "noListingsPublic")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((l) => (
            <ProfileListingCard key={l.id} listing={l} lang={lang} />
          ))}
        </div>
      )}

      {/* Invite visitors to keep browsing the seller's full catalog on the
          marketplace (the profile only loads the most recent 24). */}
      {listingTotal > listings.length && (
        <div className="flex justify-center pt-2">
          <Link
            href={`/marketplace?seller=${encodeURIComponent(sellerHandleOrId)}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
            )}
          >
            <Store className="size-4" />
            {t(lang, "listingsViewAllOnMarket").replace("{n}", String(listingTotal))}
          </Link>
        </div>
      )}
    </div>
  );
}

function dealDelta(l: SerializedListing): number {
  const market = l.card.latestPriceJpy;
  if (market == null || market <= 0) return 0;
  return ((l.priceJpy - market) / market) * 100;
}

function isDeal(l: SerializedListing): boolean {
  const d = dealDelta(l);
  return d <= DEAL_THRESHOLD_PCT;
}
