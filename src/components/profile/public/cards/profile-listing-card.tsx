"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { RarityBadge } from "@/components/shared/rarity-badge";
import { Price } from "@/components/shared/price-inline";
import { CARD_BG } from "@/lib/constants/ui";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatPct } from "@/lib/utils/currency";

import type { SerializedListing } from "../types";

function conditionStyles(condition: string) {
  const c = condition.toUpperCase();
  if (c === "NM")
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (c === "LP")
    return "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  if (c === "MP")
    return "border-orange-500/40 bg-orange-500/10 text-orange-800 dark:text-orange-200";
  if (c === "HP")
    return "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200";
  if (c === "DMG")
    return "border-muted-foreground/40 bg-muted text-muted-foreground";
  return "border-border bg-muted/60 text-foreground";
}

/**
 * Card tile rendered inside the profile's "Listings" tab. Mirrors the
 * Collection card shape so both tabs read like one consistent gallery —
 * no inline CTAs (Message / Make-offer live on the listing detail page
 * where there's room for full context).
 */
export function ProfileListingCard({
  listing,
  lang,
}: {
  listing: SerializedListing;
  lang: Language;
}) {
  const market = listing.card.latestPriceJpy;
  const diffPct =
    market != null && market > 0
      ? ((listing.priceJpy - market) / market) * 100
      : null;
  // Only flag a real price gap — ignore < 1% fluctuations to avoid noisy "-0%".
  const meaningfulGap = diffPct != null && Math.abs(diffPct) >= 1;
  const isDeal = diffPct != null && diffPct <= -10;
  const listingHref = `/marketplace/${listing.id}`;
  const cardName = listing.card.nameEn ?? listing.card.nameJp;
  const showQty = listing.quantity > 1;

  return (
    <Link
      href={listingHref}
      className="group/card block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={cn(
          "panel relative flex h-full flex-col overflow-hidden border border-transparent transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md",
          listing.isFeatured && "ring-1 ring-amber-400/40",
        )}
      >
        <div className={cn("relative aspect-[63/88] w-full", CARD_BG)}>
          {listing.card.imageUrl ? (
            <Image
              src={listing.card.imageUrl}
              alt={cardName}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 18vw"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
              {t(lang, "noImage")}
            </span>
          )}

          <div className="absolute left-1 top-1 flex flex-col gap-0.5">
            {isDeal && (
              <span className="rounded bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                ⚡ Deal
              </span>
            )}
            {listing.isFeatured && (
              <span className="rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                ★
              </span>
            )}
            {showQty && (
              <span className="rounded bg-rose-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm tabular-nums">
                ×{listing.quantity}
              </span>
            )}
          </div>

          <span
            className={cn(
              "absolute right-1 top-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold shadow-sm",
              conditionStyles(listing.condition),
            )}
          >
            {listing.condition}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <RarityBadge rarity={listing.card.rarity} size="sm" />
            <span className="font-mono text-xs text-muted-foreground">
              {listing.card.cardCode}
            </span>
          </div>
          <p
            className="truncate text-sm font-medium leading-snug"
            title={cardName}
          >
            {cardName}
          </p>
          {/* Price block — labeled so visitors instantly read this as the
              seller's asking price (not the market reference). */}
          <div className="mt-auto pt-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/80">
              {t(lang, "listingSellingAt")}
            </p>
            <div className="mt-0.5 flex items-baseline justify-between gap-2">
              <p className="truncate text-base font-bold leading-tight tracking-tight text-primary">
                <Price jpy={listing.priceJpy} thb={listing.priceThb} />
              </p>
              {meaningfulGap && (
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center text-[11px] font-semibold",
                    diffPct! < 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400",
                  )}
                >
                  {diffPct! < 0 ? (
                    <ArrowDown className="size-3" />
                  ) : (
                    <ArrowUp className="size-3" />
                  )}
                  {formatPct(Math.abs(diffPct!), 0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
