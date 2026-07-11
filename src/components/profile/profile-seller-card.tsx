"use client";

import {
  Clock,
  MessageSquareQuote,
  Package,
  PackageCheck,
  Star,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating-stars";
import { Surface } from "@/components/ui/surface";
import { useUIStore } from "@/stores/ui-store";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { SellerStats } from "@/lib/profile/load-public-profile";

function formatResponse(lang: Language, hours: number | null): string {
  if (hours == null) return "—";
  if (hours < 1) return t(lang, "responseUnderHour");
  if (hours < 24) return t(lang, "responseUnderDay");
  const days = Math.round(hours / 24);
  return t(lang, "responseDays").replace("{n}", String(days));
}

/**
 * Seller credentials, rendered as an inline meta row directly under the
 * hero. We deliberately do NOT use a card container here — the previous
 * version was a tall card with three stat-tiles, which felt like a heavy
 * "panel" that overpowered the rest of the hero stack for what's really
 * just three numbers. Now it reads as quiet supporting metadata, leaving
 * `ProfileTrustBlock` (commerce/shipping facts) to be the visible
 * trust card for visitors.
 *
 * The optional top-review block is moved into a sibling card below the
 * meta row so the row itself stays one line on most viewports.
 */
export function ProfileSellerCard({ stats }: { stats: SellerStats }) {
  const lang = useUIStore((s) => s.language);

  const hasAnything =
    stats.reviewCount > 0 ||
    stats.completedDeals > 0 ||
    stats.rating != null ||
    stats.responseHours != null;

  if (!hasAnything) return null;

  return (
    <div aria-label={t(lang, "sellerCredentials")} className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-meta">
        <SellerStat
          icon={Star}
          iconClass="fill-amber-400 text-amber-400"
          value={stats.rating != null ? stats.rating.toFixed(1) : "—"}
          subValue={stats.reviewCount > 0 ? `(${stats.reviewCount})` : undefined}
          label={t(lang, "profileSellerRating")}
        />
        <SellerStat
          icon={Package}
          value={stats.completedDeals.toString()}
          label={t(lang, "sellerDeals")}
        />
        <SellerStat
          icon={Clock}
          value={formatResponse(lang, stats.responseHours)}
          label={t(lang, "sellerResponseTime")}
        />
        {stats.isVerified && (
          <span className="status-success inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro">
            <PackageCheck className="size-3" />
            {t(lang, "sellerVerified")}
          </span>
        )}
      </div>

      {stats.topReview?.comment && (
        <Surface variant="outline" className="bg-card/40 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="size-3.5 text-muted-foreground" />
            <p className="text-eyebrow">{t(lang, "sellerTopReview")}</p>
          </div>
          <div className="mt-2 flex items-start gap-2">
            <Avatar className="size-7 shrink-0">
              <AvatarFallback className="text-overlay">
                {(stats.topReview.reviewerName ?? "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-body-sm font-medium">
                  {stats.topReview.reviewerName ?? "User"}
                </span>
                <RatingStars value={stats.topReview!.rating} size="sm" />
              </div>
              <p className="mt-1 line-clamp-3 text-body-sm text-foreground/80">
                {stats.topReview.comment}
              </p>
            </div>
          </div>
        </Surface>
      )}
    </div>
  );
}

function SellerStat({
  icon: Icon,
  iconClass,
  value,
  subValue,
  label,
}: {
  icon: LucideIcon;
  iconClass?: string;
  value: string;
  subValue?: string;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      title={label}
    >
      <Icon
        aria-hidden
        className={cn("size-3.5 shrink-0 text-muted-foreground/70", iconClass)}
      />
      <span className="font-semibold tabular-nums text-foreground/85">
        {value}
      </span>
      {subValue && <span className="text-foreground/55">{subValue}</span>}
      <span className="text-muted-foreground/80">{label}</span>
    </span>
  );
}
