"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Grid3x3, List, Search, SlidersHorizontal } from "lucide-react";

import { ListingCard, type ListingCardProps } from "@/components/marketplace/listing-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    nameEn?: string | null;
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

type BrowseResponse = {
  listings: MarketplaceBrowseListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const;
const RARITIES = ["L", "SEC", "SR", "R", "UC", "C", "P", "SP"] as const;
const SORT_OPTIONS = [
  { value: "newest", label: "ใหม่ล่าสุด" },
  { value: "price_jpy_asc", label: "ราคาต่ำ → สูง" },
  { value: "price_jpy_desc", label: "ราคาสูง → ต่ำ" },
  { value: "price_thb_asc", label: "ราคา ฿ ต่ำ → สูง" },
  { value: "price_thb_desc", label: "ราคา ฿ สูง → ต่ำ" },
] as const;

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
  const [listings, setListings] = useState(initialListings);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const skipNextFetch = useRef(true);

  // Filters
  const [search, setSearch] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [rarities, setRarities] = useState<string[]>([]);
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleFilter = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const buildParams = useCallback(
    (pageNum: number) => {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", String(pageSize));
      if (sort !== "newest") params.set("sort", sort);
      if (conditions.length === 1) params.set("condition", conditions[0]!);
      if (rarities.length > 0) params.set("rarity", rarities.join(","));
      if (search.trim()) params.set("q", search.trim());
      return params;
    },
    [pageSize, sort, conditions, rarities, search]
  );

  const fetchPage = useCallback(
    async (pageNum: number) => {
      const params = buildParams(pageNum);
      const res = await fetch(`/api/listings?${params.toString()}`);
      if (!res.ok) throw new Error(t(lang, "loadFailed"));
      return res.json() as Promise<BrowseResponse>;
    },
    [buildParams, lang]
  );

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    startTransition(() => {
      void fetchPage(page)
        .then((data) => {
          setListings(data.listings);
          setTotal(data.total);
          setError(null);
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : t(lang, "loadFailed"));
        });
    });
  }, [page, sort, conditions, rarities, fetchPage]);

  const handleSearch = useCallback(() => {
    setPage(1);
    skipNextFetch.current = false;
    startTransition(() => {
      void fetchPage(1)
        .then((data) => {
          setListings(data.listings);
          setTotal(data.total);
          setError(null);
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : t(lang, "loadFailed"));
        });
    });
  }, [fetchPage, lang]);

  return (
    <div className="space-y-4">
      {/* Search + controls bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="ค้นหาการ์ด, code, ชื่อ..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="size-3.5" />
            ตัวกรอง
            {(conditions.length > 0 || rarities.length > 0) && (
              <Badge className="ml-1 size-4 rounded-full p-0 text-xs">
                {conditions.length + rarities.length}
              </Badge>
            )}
          </Button>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-xs outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border border-input">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex size-8 items-center justify-center rounded-l-lg transition-colors",
                viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <Grid3x3 className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex size-8 items-center justify-center rounded-r-lg transition-colors",
                viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <List className="size-3.5" />
            </button>
          </div>
          <Link href="/marketplace/create" className={cn(buttonVariants({ size: "sm" }), "shrink-0")}>
            {t(lang, "listCard")}
          </Link>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">สภาพการ์ด</p>
            <div className="flex flex-wrap gap-1.5">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setConditions((prev) => toggleFilter(prev, c));
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    conditions.includes(c)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">ความหายาก</p>
            <div className="flex flex-wrap gap-1.5">
              {RARITIES.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRarities((prev) => toggleFilter(prev, r));
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    rarities.includes(r)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {(conditions.length > 0 || rarities.length > 0) && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setConditions([]);
                setRarities([]);
                setPage(1);
              }}
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{total.toLocaleString()} รายการ</span>
        {conditions.length > 0 && (
          <>
            <span>·</span>
            <span>{conditions.join(", ")}</span>
          </>
        )}
        {rarities.length > 0 && (
          <>
            <span>·</span>
            <span>{rarities.join(", ")}</span>
          </>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Listings grid/list */}
      <div className={cn(isPending && "pointer-events-none opacity-50 transition-opacity")}>
        {listings.length === 0 && !isPending ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <p className="text-muted-foreground text-sm">{t(lang, "noListingsYet")}</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                id={l.id}
                card={{
                  cardCode: l.card.cardCode,
                  nameJp: l.card.nameJp,
                  nameEn: l.card.nameEn,
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
        ) : (
          <div className="space-y-2">
            {listings.map((l) => (
              <ListingCardListView
                key={l.id}
                listing={l}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1 || isPending}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          {t(lang, "prev")}
        </Button>
        <span className="text-muted-foreground text-sm tabular-nums">
          {t(lang, "pageOf")} {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isPending}
          onClick={() => setPage((p) => p + 1)}
        >
          {t(lang, "next")}
        </Button>
      </div>
    </div>
  );
}

function ListingCardListView({ listing: l }: { listing: MarketplaceBrowseListing }) {
  const market = l.card.latestPriceJpy;
  const diffPct =
    market != null && market > 0 ? ((l.priceJpy - market) / market) * 100 : null;
  const isDeal = diffPct != null && diffPct <= -10;

  return (
    <Link
      href={`/marketplace/${l.id}`}
      className="flex items-center gap-4 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40"
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {l.card.imageUrl ? (
          <img src={l.card.imageUrl} alt="" className="size-full object-contain" />
        ) : (
          <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
            N/A
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{l.card.nameEn ?? l.card.nameJp}</p>
          {isDeal && (
            <Badge className="bg-price-up/90 text-white border-0 text-xs">Best Deal</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{l.card.cardCode} · {l.card.rarity} · {l.condition}</p>
        <p className="text-xs text-muted-foreground">
          {l.user.displayName ?? "Seller"}
          {l.user.sellerRating != null && ` · ★${l.user.sellerRating.toFixed(1)}`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold tabular-nums">¥{l.priceJpy.toLocaleString()}</p>
        {l.priceThb != null && (
          <p className="text-xs text-muted-foreground tabular-nums">
            ฿{l.priceThb.toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  );
}

export function MarketplacePageHeader() {
  const lang = useUIStore((s) => s.language);
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(lang, "marketplace")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(lang, "marketplaceDesc")}
      </p>
    </div>
  );
}
