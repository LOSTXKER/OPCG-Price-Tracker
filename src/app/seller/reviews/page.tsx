"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Surface } from "@/components/ui/surface";
import { t, getLocale } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { apiGet, apiTry } from "@/lib/api/client";

type ReviewItem = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

type ApiResponse = {
  reviews: ReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  avgRating: number | null;
  totalReviews: number;
  ratingCounts: Record<number, number>;
};

const RATING_FILTERS: ReadonlyArray<{ key: number | null }> = [
  { key: null },
  { key: 5 },
  { key: 4 },
  { key: 3 },
  { key: 2 },
  { key: 1 },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < count
              ? "fill-primary text-primary"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function SellerReviewsPage() {
  const lang = useUIStore((s) => s.language);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRating, setActiveRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (activeRating) params.set("rating", String(activeRating));

    const j = await apiTry(apiGet<ApiResponse>(`/api/seller/reviews?${params}`));
    setData(j);
    setLoading(false);
  }, [activeRating, page]);

  useEffect(() => {
    const t = setTimeout(() => void fetchReviews(), 0);
    return () => clearTimeout(t);
  }, [fetchReviews]);

  const handleRatingFilter = (rating: number | null) => {
    setActiveRating(rating);
    setPage(1);
  };

  const filterOptions = RATING_FILTERS.map((filter) => {
    const count =
      filter.key === null
        ? (data?.totalReviews ?? 0)
        : (data?.ratingCounts[filter.key] ?? 0);
    const value = filter.key === null ? "ALL" : String(filter.key);
    const label =
      filter.key === null
        ? t(lang, "orderStatusAll")
        : t(lang, "starsCount").replace("{n}", String(filter.key));
    return {
      value,
      label,
      badge:
        count > 0 ? (
          <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
            {count}
          </span>
        ) : undefined,
    };
  });
  const activeFilterValue = activeRating === null ? "ALL" : String(activeRating);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "sellerReviewsTitle")}
        description={t(lang, "sellerReviewsDesc")}
      />

      {/* Rating summary */}
      {data && (
        <Surface variant="panel" padding="lg">
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <p className="text-display">
                {data.avgRating != null ? data.avgRating.toFixed(1) : "โ€”"}
              </p>
              <div className="mt-1 flex justify-center">
                <Stars count={Math.round(data.avgRating ?? 0)} />
              </div>
              <p className="mt-1 text-meta text-muted-foreground">
                {t(lang, "reviewsCount").replace("{n}", String(data.totalReviews))}
              </p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((r) => {
                const count = data.ratingCounts[r] ?? 0;
                const pct =
                  data.totalReviews > 0
                    ? (count / data.totalReviews) * 100
                    : 0;
                return (
                  <div key={r} className="flex items-center gap-2 text-sm">
                    <span className="w-12 text-right text-muted-foreground">
                      {t(lang, "starsCount").replace("{n}", String(r))}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-xs tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Surface>
      )}

      {/* Rating filter tabs */}
      <div className="overflow-x-auto">
        <SegmentedControl
          options={filterOptions}
          value={activeFilterValue}
          onChange={(v) => handleRatingFilter(v === "ALL" ? null : Number(v))}
          ariaLabel="Filter reviews by rating"
        />
      </div>

      {/* Review list */}
      {loading ? (
        <LoadingState variant="spinner" />
      ) : !data || data.reviews.length === 0 ? (
        <EmptyState
          variant="dashed"
          icon={MessageSquare}
          title={t(lang, "noReviewsYet")}
          description={t(lang, "reviewsAppearHereDesc")}
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.reviews.map((review) => (
              <div
                key={review.id}
                className="panel rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {review.reviewer.avatarUrl && (
                      <AvatarImage
                        src={review.reviewer.avatarUrl}
                        alt=""
                      />
                    )}
                    <AvatarFallback className="text-xs">
                      {(review.reviewer.displayName ?? "U")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {review.reviewer.displayName ?? t(lang, "user")}
                    </p>
                    <div className="flex items-center gap-2">
                      <Stars count={review.rating} />
                      <span className="text-meta">
                        {new Date(review.createdAt).toLocaleDateString(getLocale(lang))}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
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
