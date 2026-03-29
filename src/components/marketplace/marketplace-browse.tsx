"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { ListingCard } from "@/components/marketplace/listing-card";
import {
  FilterChips,
  type FilterDefinition,
} from "@/components/shared/filter-chips";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

export type MarketplaceBrowseListing = {
  id: number;
  priceJpy: number;
  priceThb: number | null;
  condition: string;
  shipping: string[];
  location: string | null;
  isFeatured: boolean;
  card: {
    cardCode: string;
    nameJp: string;
    rarity: string;
    imageUrl: string | null;
    latestPriceJpy: number | null;
  };
  user: {
    displayName: string | null;
    avatarUrl: string | null;
    sellerRating: number | null;
    sellerReviewCount: number;
  };
};


function priceBoundsFromSelection(selected: string[]): { min?: number; max?: number } {
  if (selected.length === 0) return {};
  let minJ: number | undefined;
  let maxJ: number | undefined;
  for (const key of selected) {
    if (key === "0-1000") {
      minJ = minJ === undefined ? 0 : Math.min(minJ, 0);
      maxJ = maxJ === undefined ? 1000 : Math.max(maxJ, 1000);
    } else if (key === "1000-3000") {
      minJ = minJ === undefined ? 1000 : Math.min(minJ, 1000);
      maxJ = maxJ === undefined ? 3000 : Math.max(maxJ, 3000);
    } else if (key === "3000-8000") {
      minJ = minJ === undefined ? 3000 : Math.min(minJ, 3000);
      maxJ = maxJ === undefined ? 8000 : Math.max(maxJ, 8000);
    } else if (key === "8000-") {
      minJ = minJ === undefined ? 8000 : Math.min(minJ, 8000);
    }
  }
  return { min: minJ, max: maxJ };
}

type BrowseResponse = {
  listings: MarketplaceBrowseListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function MarketplaceBrowse({
  initialListings,
  initialTotal,
  initialPage,
  pageSize,
}: {
  initialListings: MarketplaceBrowseListing[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
}) {
  const lang = useUIStore((s) => s.language);
  const filterDefs: FilterDefinition[] = [
    {
      key: "condition",
      label: t(lang, "condition"),
      options: [
        { value: "NM", label: "NM" },
        { value: "LP", label: "LP" },
        { value: "MP", label: "MP" },
        { value: "HP", label: "HP" },
        { value: "DMG", label: "DMG" },
      ],
    },
    {
      key: "price",
      label: t(lang, "priceRangeJpy"),
      options: [
        { value: "0-1000", label: `${t(lang, "below")} ¥1,000` },
        { value: "1000-3000", label: "¥1,000 – 3,000" },
        { value: "3000-8000", label: "¥3,000 – 8,000" },
        { value: "8000-", label: "¥8,000+" },
      ],
    },
  ];

  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(initialPage);
  const [listings, setListings] = useState(initialListings);
  const [total, setTotal] = useState(initialTotal);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const skipNextFetch = useRef(true);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const onFilterChange = useCallback((key: string, values: string[]) => {
    setSelected((prev) => ({ ...prev, [key]: values }));
    setPage(1);
  }, []);

  const fetchPage = useCallback(
    (pageNum: number, sel: Record<string, string[]>) => {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", String(pageSize));
      const conds = sel.condition ?? [];
      if (conds.length === 1) params.set("condition", conds[0]!);
      const { min, max } = priceBoundsFromSelection(sel.price ?? []);
      if (min !== undefined) params.set("minPriceJpy", String(min));
      if (max !== undefined) params.set("maxPriceJpy", String(max));
      return fetch(`/api/listings?${params.toString()}`).then(async (res) => {
        if (!res.ok) throw new Error(t(lang, "loadFailed"));
        return res.json() as Promise<BrowseResponse>;
      });
    },
    [pageSize, lang]
  );

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    startTransition(() => {
      void fetchPage(page, selected)
        .then((data) => {
          setListings(data.listings);
          setTotal(data.total);
          setError(null);
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : t(lang, "loadFailed"));
        });
    });
  }, [page, selected, fetchPage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <FilterChips filters={filterDefs} selected={selected} onChange={onFilterChange} />
        </div>
        <Link
          href="/marketplace/create"
          className={cn(buttonVariants(), "shrink-0")}
        >
          {t(lang, "listCard")}
        </Link>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className={cn(isPending && "pointer-events-none opacity-50 transition-opacity")}>
        {listings.length === 0 && !isPending ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <p className="text-muted-foreground text-sm">
              {t(lang, "noListingsYet")}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                id={l.id}
                card={{
                  cardCode: l.card.cardCode,
                  nameJp: l.card.nameJp,
                  rarity: l.card.rarity,
                  imageUrl: l.card.imageUrl,
                  latestPriceJpy: l.card.latestPriceJpy,
                }}
                priceJpy={l.priceJpy}
                priceThb={l.priceThb}
                condition={l.condition}
                seller={{
                  displayName: l.user.displayName,
                  avatarUrl: l.user.avatarUrl,
                  sellerRating: l.user.sellerRating,
                  sellerReviewCount: l.user.sellerReviewCount,
                }}
                shipping={l.shipping}
                location={l.location}
                isFeatured={l.isFeatured}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1 || isPending}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </Button>
        <span className="text-muted-foreground text-sm tabular-nums">
          {t(lang, "pageOf")} {page} / {totalPages} ({total} {t(lang, "itemsCount")})
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isPending}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function MarketplacePageHeader() {
  const lang = useUIStore((s) => s.language);
  return (
    <div>
      <h1 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">{t(lang, "marketplace")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(lang, "marketplaceDesc")}
      </p>
    </div>
  );
}
