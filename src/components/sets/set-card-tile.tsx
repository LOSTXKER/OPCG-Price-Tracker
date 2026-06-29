"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";

import { Price } from "@/components/shared/price-inline";
import { ChangePill } from "@/components/market/change-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { getCardName } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import type { ChangePeriod } from "@/components/cards/card-item";
import type { CardData } from "./set-detail-content";

/**
 * Compact poster tile for the set grid — image-forward with price + %-move only.
 * Rarity is the section's identity (each grid is one rarity), so the per-tile
 * rarity badge + the big name/PSA10/action-row of the full CardItem are dropped:
 * the set page is a dense, scannable price wall, not a feature card. One whole
 * section fits a screen, matching the set browse intent.
 */
function SetCardTileBase({
  card,
  changePeriod,
}: {
  card: CardData;
  changePeriod: ChangePeriod;
}) {
  const lang = useUIStore((s) => s.language);
  const name = getCardName(lang, card);
  const change =
    changePeriod === "24h"
      ? card.priceChange24h
      : changePeriod === "30d"
        ? card.priceChange30d
        : card.priceChange7d;

  return (
    <Link
      href={`/cards/${card.cardCode}`}
      aria-label={name}
      className="group ease-chrome flex flex-col gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="surface-1 ease-chrome relative aspect-[63/88] w-full overflow-hidden rounded-lg shadow-[var(--panel-shadow)] group-hover:ring-2 group-hover:ring-primary/40">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={name}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 30vw, (max-width: 1280px) 16vw, 12vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <Skeleton className="absolute inset-0 size-full" />
        )}
      </div>
      <div className="min-w-0 px-0.5">
        {/* price gets its own full line — it's the value collectors scan, so it
            must never truncate; name + %-move share the line below */}
        <p className="tnum font-price text-sm font-bold text-foreground">
          {card.latestPriceJpy != null ? (
            <Price jpy={card.latestPriceJpy} thb={card.latestPriceThb} />
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )}
        </p>
        <div className="mt-0.5 flex items-center justify-between gap-1.5">
          <span
            className="text-meta truncate leading-snug"
            title={name}
          >
            {name}
          </span>
          <ChangePill value={change} className="text-micro shrink-0" />
        </div>
      </div>
    </Link>
  );
}

export const SetCardTile = memo(SetCardTileBase);
