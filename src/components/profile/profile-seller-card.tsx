"use client";

import { BadgeCheck, Clock, MessageSquareQuote, Package, ShieldCheck, Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export function ProfileSellerCard({ stats }: { stats: SellerStats }) {
  const lang = useUIStore((s) => s.language);

  const hasAnything =
    stats.reviewCount > 0 || stats.completedDeals > 0 || stats.rating != null || stats.responseHours != null;

  if (!hasAnything) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-blue-500" />
          {t(lang, "sellerCredentials")}
        </div>
        {stats.isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
            <BadgeCheck className="size-3" />
            {t(lang, "sellerVerified")}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <SellerStat
          icon={Star}
          iconClass="text-amber-400 fill-amber-400"
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
          smallValue
        />
      </div>

      {stats.topReview?.comment && (
        <div className="mt-4 rounded-xl border border-border/40 bg-card/50 p-3">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="size-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">{t(lang, "sellerTopReview")}</p>
          </div>
          <div className="mt-2 flex items-start gap-2">
            <Avatar className="size-7 shrink-0">
              <AvatarFallback className="text-[10px]">
                {(stats.topReview.reviewerName ?? "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium">
                  {stats.topReview.reviewerName ?? "User"}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-3",
                        i < stats.topReview!.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/20",
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-1 line-clamp-3 text-xs text-foreground/80">
                {stats.topReview.comment}
              </p>
            </div>
          </div>
        </div>
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
  smallValue,
}: {
  icon: typeof Star;
  iconClass?: string;
  value: string;
  subValue?: string;
  label: string;
  smallValue?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 px-3 py-2.5 text-center">
      <Icon className={cn("mx-auto mb-1 size-3.5 text-muted-foreground/60", iconClass)} />
      <p className={cn("font-bold tabular-nums leading-none", smallValue ? "text-xs" : "text-lg")}>
        {value}
        {subValue && <span className="ml-1 text-[10px] font-normal text-muted-foreground">{subValue}</span>}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
