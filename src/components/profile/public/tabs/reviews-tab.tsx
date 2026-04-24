"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatRelativeAgo } from "@/lib/utils/relative-time";

import type { SerializedReview } from "../types";
import { TabToolbar, type FilterChip, type SortOption } from "./tab-toolbar";

type ReviewFilter = "all" | "5" | "4" | "3-";
type ReviewSort = "recent" | "highest" | "lowest";

const PAGE_SIZE = 8;

export function ReviewsTabContent({
  reviews,
  lang,
}: {
  reviews: SerializedReview[];
  lang: Language;
}) {
  const total = reviews.length;
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Aggregates use the *unfiltered* list so the headline rating doesn't lie
  // when someone is just browsing 1-star reviews.
  const avg = total === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / total;
  const dist = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((r) => r.rating === star).length;
        return { star, count, pct: total > 0 ? (count / total) * 100 : 0 };
      }),
    [reviews, total],
  );

  const filteredSorted = useMemo(() => {
    let arr = reviews.slice();
    if (filter === "5") arr = arr.filter((r) => r.rating === 5);
    else if (filter === "4") arr = arr.filter((r) => r.rating === 4);
    else if (filter === "3-") arr = arr.filter((r) => r.rating <= 3);

    switch (sort) {
      case "highest":
        arr.sort((a, b) => b.rating - a.rating || +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      case "lowest":
        arr.sort((a, b) => a.rating - b.rating || +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      case "recent":
      default:
        arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
    }
    return arr;
  }, [reviews, filter, sort]);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
          <Star className="size-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{t(lang, "noReviews")}</p>
      </div>
    );
  }

  // "Showcase-worthy" rating header only when the seller actually has a
  // strong score. For new/weak ratings, fall back to a subtle line so 1.0★
  // doesn't get a giant headline.
  const showcase = avg >= 4 && total >= 3;

  const filters: FilterChip<ReviewFilter>[] = [
    { value: "all", label: t(lang, "filterAll") },
    { value: "5", label: t(lang, "filterFiveStar") },
    { value: "4", label: t(lang, "filterFourStar") },
    { value: "3-", label: t(lang, "filterThreeStarBelow") },
  ];

  const sortOptions: SortOption<ReviewSort>[] = [
    { value: "recent", label: t(lang, "sortRecent") },
    { value: "highest", label: t(lang, "sortHighest") },
    { value: "lowest", label: t(lang, "sortLowest") },
  ];

  const visible = filteredSorted.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSorted.length;

  return (
    <div className="space-y-5">
      {showcase ? (
        <div className="flex flex-col gap-5 rounded-2xl border border-border/40 bg-card/40 p-5 sm:flex-row sm:items-center">
          <div className="flex shrink-0 flex-col items-center gap-1 sm:w-32">
            <p className="text-4xl font-bold tabular-nums leading-none">
              {avg.toFixed(1)}
            </p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-3.5",
                    i <= Math.round(avg)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/20",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {total} {t(lang, "tabReviews").toLowerCase()}
            </p>
          </div>
          {total >= 5 && (
            <div className="flex-1 space-y-1.5">
              {dist.map(({ star, pct, count }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 tabular-nums text-muted-foreground">{star}</span>
                  <Star className="size-3 fill-amber-400/70 text-amber-400/70" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-amber-400/80"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground/80 tabular-nums">
              {avg.toFixed(1)}
            </span>
          </span>
          <span className="ml-1.5">
            · {total} {t(lang, "tabReviews").toLowerCase()}
          </span>
        </p>
      )}

      <TabToolbar
        filters={filters}
        activeFilter={filter}
        onFilter={(v) => {
          setFilter(v);
          setVisibleCount(PAGE_SIZE);
        }}
        sortOptions={sortOptions}
        activeSort={sort}
        onSort={(v) => {
          setSort(v);
          setVisibleCount(PAGE_SIZE);
        }}
        lang={lang}
      />

      {filteredSorted.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t(lang, "noReviews")}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="flex gap-2.5">
              <Avatar className="size-9 shrink-0">
                {r.reviewer.avatarUrl ? (
                  <AvatarImage src={r.reviewer.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback className="text-xs">
                  {(r.reviewer.displayName ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl bg-muted/40 px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {r.reviewer.displayName ?? "User"}
                    </span>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-3",
                            i < r.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/20",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="mt-1 break-words text-sm text-foreground/85">
                      {r.comment}
                    </p>
                  )}
                </div>
                <p className="mt-1 px-3.5 text-[11px] text-muted-foreground">
                  {formatRelativeAgo(r.createdAt, lang)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          >
            {t(lang, "loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
