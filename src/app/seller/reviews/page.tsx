"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

const RATING_FILTERS = [
  { key: null, label: "ทั้งหมด" },
  { key: 5, label: "5 ดาว" },
  { key: 4, label: "4 ดาว" },
  { key: 3, label: "3 ดาว" },
  { key: 2, label: "2 ดาว" },
  { key: 1, label: "1 ดาว" },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < count
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function SellerReviewsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRating, setActiveRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (activeRating) params.set("rating", String(activeRating));

      const res = await fetch(`/api/seller/reviews?${params}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeRating, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleRatingFilter = (rating: number | null) => {
    setActiveRating(rating);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">รีวิว</h1>
        <p className="text-sm text-muted-foreground">
          ดูรีวิวจากผู้ซื้อ
        </p>
      </div>

      {/* Rating summary */}
      {data && (
        <div className="panel flex flex-wrap items-center gap-6 rounded-xl p-5">
          <div className="text-center">
            <p className="text-4xl font-bold">
              {data.avgRating != null ? data.avgRating.toFixed(1) : "—"}
            </p>
            <div className="mt-1 flex justify-center">
              <Stars count={Math.round(data.avgRating ?? 0)} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.totalReviews} รีวิว
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
                    {r} ดาว
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
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
      )}

      {/* Rating filter tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1">
        {RATING_FILTERS.map((filter) => {
          const count =
            filter.key === null
              ? (data?.totalReviews ?? 0)
              : (data?.ratingCounts[filter.key] ?? 0);
          return (
            <button
              key={filter.label}
              type="button"
              onClick={() => handleRatingFilter(filter.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeRating === filter.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter.label}
              {count > 0 && (
                <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Review list */}
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <MessageSquare className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">ยังไม่มีรีวิว</p>
          <p className="text-sm">รีวิวจากผู้ซื้อจะปรากฏที่นี่</p>
        </div>
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
                      {review.reviewer.displayName ?? "ผู้ใช้"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Stars count={review.rating} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("th-TH")}
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
                ก่อนหน้า
              </Button>
              <span className="text-sm text-muted-foreground">
                หน้า {data.page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                ถัดไป
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
