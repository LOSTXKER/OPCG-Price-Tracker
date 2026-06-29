"use client";

import Image from "next/image";
import Link from "next/link";

import { ConditionBadge } from "@/components/shared/condition-badge";
import { DeltaText } from "@/components/shared/delta-text";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { Price } from "@/components/shared/price-inline";
import { CARD_BG } from "@/lib/constants/ui";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import type { SerializedListing } from "../types";

/**
 * Card tile rendered inside the profile's "Listings" tab. Mirrors the
 * Collection card shape so both tabs read like one consistent gallery —
 * no inline CTAs (Message / Make-offer live on the listing detail page
 * where there's room for full context).
 *
 * Information hierarchy (top → bottom inside the info panel):
 *   1. Card name — full width, reads first
 *   2. Rarity badge + card code — small muted meta line
 *   3. Price — single confident line; delta-vs-market chip on the right
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
  const listingHref = `/marketplace/${listing.id}`;
  const cardName = listing.card.nameEn ?? listing.card.nameJp;

  return (
    <Link
      href={listingHref}
      className="group/card block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={cn(
          "panel hover-lift relative flex h-full flex-col overflow-hidden",
          listing.isFeatured && "ring-1 ring-primary/30",
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
            <span className="flex size-full items-center justify-center text-meta">
              {t(lang, "noImage")}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-2.5">
          <p
            className="truncate text-h5 leading-snug"
            title={cardName}
          >
            {cardName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <RarityBadge rarity={listing.card.rarity} size="sm" />
            <span className="truncate font-mono text-xs text-muted-foreground">
              {listing.card.cardCode}
            </span>
            <ConditionBadge condition={listing.condition} size="sm" />
          </div>

          <div className="mt-auto flex items-baseline justify-between gap-2 pt-2">
            <p className="truncate text-base font-bold leading-tight tracking-tight text-primary">
              <Price jpy={listing.priceJpy} thb={listing.priceThb} />
            </p>
            {meaningfulGap ? (
              <DeltaText
                value={diffPct}
                decimals={0}
                size="sm"
                invert
                className="shrink-0"
              />
            ) : listing.quantity > 1 ? (
              // Quietly indicate stock when the seller has multiples. Only
              // shown when no delta chip claims the slot — stacking both on
              // a 63x88 tile makes the row feel cluttered.
              <span className="shrink-0 text-meta tabular-nums">
                ×{listing.quantity}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
