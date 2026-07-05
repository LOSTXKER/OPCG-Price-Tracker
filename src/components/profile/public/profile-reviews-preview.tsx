"use client";

import { ChevronRight, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating-stars";
import { Surface } from "@/components/ui/surface";
import { t, type Language } from "@/lib/i18n";
import { formatRelativeAgo } from "@/lib/utils/relative-time";

import type { ProfileTab, SerializedReview } from "./types";

const PREVIEW_LIMIT = 2;
const SHOWCASE_THRESHOLD = 3; // need at least 3 reviews to be worth previewing

/**
 * Compact "social proof" preview that lives between the stats strip and the
 * tab navigation. Surfaces the seller's rating + a couple of best reviews
 * so a visitor can build trust without ever switching tabs.
 *
 * We deliberately:
 *   - Hide the panel entirely when there aren't enough reviews to brag
 *     about (≤2) — a tiny sample looks worse than no panel at all
 *   - Pick the reviews with the longest comments rather than just the
 *     top-rated ones, since "5★ no comment" is much weaker proof than
 *     "5★ + a paragraph of praise"
 *   - Keep the visual deliberately quiet (no big heading) so the tabs
 *     still anchor the page
 */
export function ProfileReviewsPreview({
  reviews,
  rating,
  reviewCount,
  lang,
  onJump,
}: {
  reviews: SerializedReview[];
  rating: number | null;
  reviewCount: number;
  lang: Language;
  onJump?: (tab: ProfileTab) => void;
}) {
  if (reviewCount < SHOWCASE_THRESHOLD || rating == null) return null;

  // Pick the most "showcase-worthy" reviews: high rating + meaty comment.
  // We sort by a composite score so a 5★ with no comment loses to a 4★
  // with a real explanation.
  const featured = reviews
    .filter((r) => r.rating >= 4)
    .map((r) => ({
      review: r,
      score: r.rating * 10 + Math.min(20, (r.comment?.length ?? 0) / 10),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, PREVIEW_LIMIT)
    .map((x) => x.review);

  if (featured.length === 0) return null;

  return (
    <section className="mt-8" aria-label={t(lang, "tabReviews")}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="inline-flex items-baseline gap-2">
          <h2 className="text-h4">{t(lang, "tabReviews")}</h2>
          <span className="inline-flex items-center gap-1 text-meta">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold tabular-nums text-foreground/80">
              {rating.toFixed(1)}
            </span>
            <span>· {reviewCount.toLocaleString()}</span>
          </span>
        </div>
        {onJump && (
          <button
            type="button"
            onClick={() => onJump("reviews")}
            className="text-body-sm inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
          >
            {t(lang, "showcaseViewAll")}
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {featured.map((r) => (
          <ReviewCard key={r.id} review={r} lang={lang} />
        ))}
      </div>
    </section>
  );
}

function ReviewCard({ review, lang }: { review: SerializedReview; lang: Language }) {
  return (
    <Surface variant="outline" as="article" className="p-3.5 transition-colors hover:border-border">
      <header className="flex items-center gap-2">
        <Avatar className="size-7 shrink-0">
          {review.reviewer.avatarUrl ? (
            <AvatarImage src={review.reviewer.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback className="text-overlay">
            {(review.reviewer.displayName ?? "?").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-semibold">
            {review.reviewer.displayName ?? "User"}
          </p>
          <p className="text-meta">
            {formatRelativeAgo(review.createdAt, lang)}
          </p>
        </div>
        <RatingStars value={review.rating} size="sm" className="shrink-0" />
      </header>
      {review.comment && (
        <p className="mt-2 line-clamp-3 text-body-sm text-foreground/80">
          {review.comment}
        </p>
      )}
    </Surface>
  );
}
