"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Package, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t, type Currency, type Language } from "@/lib/i18n";
import {
  formatDisplayValue,
  jpyToDisplayValue,
} from "@/lib/utils/currency";
import { useUIStore } from "@/stores/ui-store";

import { ProfileListingCard } from "../cards/profile-listing-card";
import type { SerializedListing } from "../types";
import { listingsGridClass } from "./grid-cols";
import { HintTile } from "./hint-tile";
import { TabSection } from "./tab-section";
import { TabToolbar, type FilterChip, type SortOption } from "./tab-toolbar";

type ListingFilter = "all" | "NM" | "LP" | "MP+";
type ListingSort = "recent" | "priceAsc" | "priceDesc" | "deal";

const TOOLBAR_THRESHOLD = 4;

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
  const currency = useUIStore((state) => state.currency);

  const filtered = useMemo(() => {
    let arr = listings.slice();
    if (filter === "NM") arr = arr.filter((l) => l.condition.toUpperCase() === "NM");
    else if (filter === "LP") arr = arr.filter((l) => l.condition.toUpperCase() === "LP");
    else if (filter === "MP+")
      arr = arr.filter((l) => ["MP", "HP", "DMG"].includes(l.condition.toUpperCase()));

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
      <TabSection title={t(lang, "tabListings")}>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
            <Store className="size-7 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {t(lang, "noListingsPublic")}
          </p>
          {isOwner && (
            <Link href="/marketplace/create">
              <Button size="sm" className="gap-1.5 rounded-full">
                <Package className="size-3.5" />
                {t(lang, "startSelling")}
              </Button>
            </Link>
          )}
        </div>
      </TabSection>
    );
  }

  // Build a single concise meta line under the title:
  //   "1 รายการ · 268,758 ฿" or the equivalent range in the selected currency.
  // We skip the meta entirely when there's a single listing because the tab
  // nav already tells you the count and the card itself shows the price —
  // repeating it as a panel header just adds visual noise.
  const metaLine =
    listings.length > 1
      ? buildListingsMeta(listings, lang, currency)
      : null;

  // Filtering only adds value when there's a real range to filter through.
  const showToolbar = listings.length >= TOOLBAR_THRESHOLD;

  const filters: FilterChip<ListingFilter>[] = [
    { value: "all", label: t(lang, "filterAll") },
    { value: "NM", label: "NM" },
    { value: "LP", label: "LP" },
    { value: "MP+", label: "MP+" },
  ];

  const sortOptions: SortOption<ListingSort>[] = [
    { value: "recent", label: t(lang, "sortRecent") },
    { value: "priceAsc", label: t(lang, "sortPriceAsc") },
    { value: "priceDesc", label: t(lang, "sortPriceDesc") },
    { value: "deal", label: t(lang, "sortDeal") },
  ];

  // The marketplace "view all" CTA lives in the section header's trailing
  // slot when the profile only loads the most recent slice — keeps the body
  // compact and gives visitors a clear "there's more" cue right at the top.
  const viewAllHref = `/marketplace?seller=${encodeURIComponent(sellerHandleOrId)}`;
  const showViewAll = listingTotal > listings.length;

  return (
    <TabSection
      // Title intentionally omitted — the tab nav already heads this section
      // ("รายการขาย 1"). Repeating it as a panel heading reads as triple-
      // labelled visual noise. The meta line carries the count + price
      // summary on its own and the trailing slot holds the "view all" link.
      meta={metaLine}
      trailing={
        showViewAll ? (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
          >
            {t(lang, "listingsViewAllOnMarket").replace("{n}", String(listingTotal))}
            <ChevronRight className="size-3.5" />
          </Link>
        ) : null
      }
    >
      {showToolbar && (
        <TabToolbar
          filters={filters}
          activeFilter={filter}
          onFilter={setFilter}
          sortOptions={sortOptions}
          activeSort={sort}
          onSort={setSort}
          lang={lang}
        />
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t(lang, "noListingsPublic")}
        </p>
      ) : (
        <div className={listingsGridClass(filtered.length)}>
          {filtered.map((l) => (
            <ProfileListingCard key={l.id} listing={l} lang={lang} />
          ))}
          {filtered.length === 1 && (
            <HintTile
              kind="listings"
              isOwner={isOwner}
              href={showViewAll ? viewAllHref : null}
              lang={lang}
            />
          )}
        </div>
      )}
    </TabSection>
  );
}

function buildListingsMeta(
  listings: SerializedListing[],
  lang: Language,
  currency: Currency,
): string {
  const prices = listings
    .map((listing) => {
      if (
        currency === "THB" &&
        listing.priceThb != null &&
        Number.isFinite(listing.priceThb) &&
        listing.priceThb > 0
      ) {
        return listing.priceThb;
      }

      return jpyToDisplayValue(listing.priceJpy, currency);
    })
    .filter((price) => Number.isFinite(price) && price > 0);
  const fmt = (price: number) => formatDisplayValue(price, currency);
  const countLabel = `${listings.length.toLocaleString()} ${t(lang, "tabListings").toLowerCase()}`;

  if (prices.length === 0) return countLabel;

  if (listings.length === 1 || prices.length === 1) {
    return `${countLabel} · ${fmt(prices[0])}`;
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const priceText = min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
  return `${countLabel} · ${priceText}`;
}

function dealDelta(l: SerializedListing): number {
  const market = l.card.latestPriceJpy;
  if (market == null || market <= 0) return 0;
  return ((l.priceJpy - market) / market) * 100;
}
