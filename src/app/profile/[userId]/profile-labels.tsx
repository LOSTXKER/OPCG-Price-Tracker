"use client";

import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

export function SellerName({ name }: { name: string | null }) {
  const lang = useUIStore((s) => s.language);
  return <>{name ?? t(lang, "sellerListings")}</>;
}

export function SellerRating({ rating, reviewCount }: { rating: number | null; reviewCount: number }) {
  const lang = useUIStore((s) => s.language);
  const ratingText = rating != null ? `★ ${rating.toFixed(1)}` : t(lang, "noRating");
  return <>{ratingText} · {reviewCount} {t(lang, "reviews")}</>;
}

export function SellerListingsHeader() {
  const lang = useUIStore((s) => s.language);
  return <h2 className="text-lg font-semibold">{t(lang, "sellerListings")}</h2>;
}

export function NoOpenListingsMsg() {
  const lang = useUIStore((s) => s.language);
  return <p className="text-muted-foreground text-sm">{t(lang, "noOpenListings")}</p>;
}

export function ViewDetailsLink() {
  const lang = useUIStore((s) => s.language);
  return <>{t(lang, "viewAll")}</>;
}

export function ReviewsHeader() {
  const lang = useUIStore((s) => s.language);
  return <h2 className="text-lg font-semibold">{t(lang, "reviews")}</h2>;
}

export function NoReviewsMsg() {
  const lang = useUIStore((s) => s.language);
  return <p className="text-muted-foreground text-sm">{t(lang, "noReviews")}</p>;
}

export function ReviewerName({ name }: { name: string | null }) {
  const lang = useUIStore((s) => s.language);
  return <p className="font-medium">{name ?? t(lang, "profileLabel")}</p>;
}
