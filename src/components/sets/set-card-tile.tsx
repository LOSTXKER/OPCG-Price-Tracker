"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";

import { Price } from "@/components/shared/price-inline";
import { PriceUsd } from "@/components/shared/price-usd";
import { PriceTag } from "@/components/ui/price-tag";
import { Skeleton } from "@/components/ui/skeleton";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { getCardName } from "@/lib/i18n";
import { formatUsdByCurrency } from "@/lib/utils/currency";
import { useUIStore } from "@/stores/ui-store";
import type { ChangePeriod } from "@/components/cards/card-item";
import {
  GRADE_TIER_BY_KEY,
  getGradePriceUsd,
  isRawGrade,
  type GradeKey,
} from "@/lib/pricing/grade-tiers";
import type { CardData } from "./set-detail-content";

/**
 * Compact poster tile for the set grid — image-forward with price + %-move only.
 * Rarity is the section's identity (each grid is one rarity), so the per-tile
 * rarity badge + the larger grade/action treatment of CardItem are dropped:
 * the set page is a dense, scannable price wall, not a feature card. One whole
 * section fits a screen, matching the set browse intent.
 */
function SetCardTileBase({
  card,
  changePeriod,
  grade = "raw",
}: {
  card: CardData;
  changePeriod: ChangePeriod;
  grade?: GradeKey;
}) {
  const lang = useUIStore((s) => s.language);
  const currency = useUIStore((s) => s.currency);
  const name = getCardName(lang, card);
  const change =
    changePeriod === "24h"
      ? card.priceChange24h
      : changePeriod === "30d"
        ? card.priceChange30d
        : card.priceChange7d;
  const rawGrade = isRawGrade(grade);
  const gradePriceUsd = getGradePriceUsd(card.psa10PriceUsd, grade);
  const gradePriceLabel =
    !rawGrade && gradePriceUsd != null
      ? formatUsdByCurrency(gradePriceUsd, currency).primary
      : null;

  return (
    <Link
      href={`/opcg/cards/${card.cardCode}`}
      aria-label={
        gradePriceLabel
          ? `${name}, ${GRADE_TIER_BY_KEY[grade].label}, ${gradePriceLabel}`
          : name
      }
      className="group ease-chrome flex flex-col gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="surface-1 ease-chrome relative aspect-[63/88] w-full overflow-hidden rounded-lg shadow-[var(--panel-shadow)] group-lift">
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
        <p className="text-price text-foreground">
          {!rawGrade ? (
            gradePriceUsd != null ? (
              <PriceUsd usd={gradePriceUsd} />
            ) : (
              <span className="text-muted-foreground/50">—</span>
            )
          ) : card.latestPriceJpy != null ? (
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
          {rawGrade && (
            <PriceTag
              change={change}
              changeOnly
              changeStyle="plain"
              showArrow={false}
              size="sm"
              className="text-micro shrink-0"
            />
          )}
        </div>
      </div>
    </Link>
  );
}

export const SetCardTile = memo(SetCardTileBase);
