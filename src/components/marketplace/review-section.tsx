import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { Star, MessageSquare } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { formatRelativeAgoShort } from "@/lib/utils/relative-time";

interface ReviewData {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewer: {
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface ReviewSectionProps {
  reviews: ReviewData[];
  averageRating: number | null;
  totalCount: number;
  lang: Language;
  className?: string;
}

function StarRow({
  rating,
  max = 5,
  size = "sm",
}: {
  rating: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const s = size === "md" ? "size-5" : "size-3.5";
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            s,
            i < Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </span>
  );
}

export function ReviewSection({
  reviews,
  averageRating,
  totalCount,
  lang,
  className,
}: ReviewSectionProps) {
  if (totalCount === 0) {
    return (
      <Surface variant="panel" className={cn("flex flex-col items-center gap-3 p-8 text-center", className)}>
        <MessageSquare className="text-muted-foreground size-10" />
        <div>
          <p className="font-medium">{t(lang, "mktDetailNoReviews")}</p>
          <p className="text-muted-foreground text-sm">
            {t(lang, "mktReviewEmptyDesc")}
          </p>
        </div>
      </Surface>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      <Surface variant="panel" className="flex items-center gap-5 p-5">
        <div className="text-center">
          <p className="text-display">
            {(averageRating ?? 0).toFixed(1)}
          </p>
          <StarRow rating={averageRating ?? 0} size="md" />
        </div>
        <div className="text-muted-foreground text-sm">
          <p>{t(lang, "mktReviewTotalCount").replace("{n}", String(totalCount))}</p>
        </div>
      </Surface>

      <div className="space-y-3">
        {reviews.map((review) => {
          const name = review.reviewer.displayName ?? t(lang, "buyer");
          return (
            <Surface key={review.id} variant="panel" className="space-y-2 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  {review.reviewer.avatarUrl ? (
                    <AvatarImage src={review.reviewer.avatarUrl} alt={name} />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <div className="flex items-center gap-2">
                    <StarRow rating={review.rating} />
                    <span className="text-muted-foreground text-xs">
                      {formatRelativeAgoShort(review.createdAt, lang)}
                    </span>
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm leading-relaxed">{review.comment}</p>
              )}
            </Surface>
          );
        })}
      </div>
    </div>
  );
}
