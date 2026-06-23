"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Bookmark, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useUIStore } from "@/stores/ui-store";
import { ApiError, apiGet, apiPost, apiTry } from "@/lib/api/client";
import { formatJpy, formatThb } from "@/lib/utils/currency";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type SavedItem = {
  id: number;
  createdAt: string;
  listing: {
    id: number;
    priceJpy: number;
    priceThb: number | null;
    condition: string;
    status: string;
    card: {
      cardCode: string;
      nameJp: string;
      nameEn: string | null;
      rarity: string;
      imageUrl: string | null;
      set: { code: string; name: string };
    };
    user: {
      displayName: string | null;
      avatarUrl: string | null;
    };
  };
};

type ApiResponse = {
  saved: SavedItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function SavedListingsPage() {
  const lang = useUIStore((s) => s.language);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [removing, setRemoving] = useState<number | null>(null);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiGet<ApiResponse>(`/api/saved?page=${page}&limit=20`);
      setData(json);
    } catch (err) {
      setData(null);
      // read lang imperatively so this fetch callback doesn't re-run on every
      // language toggle just for the error-fallback string
      setError(err instanceof ApiError ? err.message : t(useUIStore.getState().language, "failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleRemove = async (listingId: number) => {
    setRemoving(listingId);
    try {
      const ok = await apiTry(apiPost(`/api/listings/${listingId}/save`));
      if (ok !== null) await fetchSaved();
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "savedListingsTitle")}
        description={t(lang, "savedListingsDesc").replace("{n}", String(data?.total ?? 0))}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "savedListings") },
            ]}
          />
        }
      />

      {loading ? (
        <LoadingState variant="spinner" label={t(lang, "loading")} />
      ) : error ? (
        <EmptyState
          variant="error"
          icon={Bookmark}
          title={error}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                void fetchSaved();
              }}
            >
              {t(lang, "retry")}
            </Button>
          }
        />
      ) : !data || data.saved.length === 0 ? (
        <KumaEmptyState
          variant="dashed"
          icon={Bookmark}
          title={t(lang, "savedEmptyTitle")}
          description={t(lang, "savedEmptyDesc")}
          action={
            <Button variant="outline" render={<Link href="/marketplace" />}>
              {t(lang, "browseMarketplace")}
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.saved.map((item) => {
              const { listing } = item;
              const cardName =
                listing.card.nameEn ?? listing.card.nameJp;
              const isActive = listing.status === "ACTIVE";

              return (
                <div
                  key={item.id}
                  className="panel group relative overflow-hidden rounded-xl ease-chrome transition-colors hover:bg-muted/70"
                >
                  <Link href={`/marketplace/${listing.id}`} className="block">
                    {/* Image — clean, no overlays. Sold/inactive listings desaturate. */}
                    <div
                      className={cn(
                        "relative aspect-[3/4] w-full overflow-hidden bg-muted transition",
                        !isActive && "grayscale opacity-70",
                      )}
                    >
                      {listing.card.imageUrl ? (
                        <Image
                          src={listing.card.imageUrl}
                          alt={cardName}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {!isActive && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                            {listing.status === "SOLD"
                              ? t(lang, "listingSold")
                              : t(lang, "listingNotAvailable")}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">
                        {cardName}
                      </p>
                      <p className="text-meta">
                        {listing.card.cardCode} • {listing.card.rarity}
                      </p>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="font-bold">
                          {formatJpy(listing.priceJpy)}
                        </span>
                        {listing.priceThb != null && (
                          <span className="text-meta">
                            {formatThb(listing.priceThb)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-meta">
                        {listing.user.displayName ?? t(lang, "seller")} •{" "}
                        {listing.condition}
                      </p>
                    </div>
                  </Link>

                  {/* Action row — sits below the tile, never overlays the art */}
                  <div className="flex items-center justify-end gap-1 border-t border-[var(--p-hair)] px-2 py-1">
                    <button
                      type="button"
                      onClick={() => handleRemove(listing.id)}
                      disabled={removing === listing.id}
                      aria-label={t(lang, "remove")}
                      className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground ease-chrome transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
                    >
                      {removing === listing.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                {t(lang, "previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t(lang, "paginationPageOf").replace("{page}", String(data.page)).replace("{total}", String(data.totalPages))}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t(lang, "next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
