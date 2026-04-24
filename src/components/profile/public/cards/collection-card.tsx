"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";

import { getCardName, t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import type { ProfileCardData } from "../types";

/**
 * Binder-pocket style — pure image card, no info panel underneath. Name &
 * rarity surface only on hover (desktop) so the grid reads as a showcase
 * album, not a marketplace listing. Tap on mobile navigates to the card
 * page where full details live.
 */
export function CollectionCard({
  card,
  hideQty,
  showLock,
  lang,
}: {
  card: ProfileCardData;
  hideQty: boolean;
  showLock: boolean;
  lang: Language;
}) {
  const showQty = !hideQty && card.quantity != null && card.quantity > 1;
  const displayName = getCardName(lang, {
    nameEn: card.nameEn,
    nameJp: card.nameJp,
  });
  return (
    <Link
      href={`/cards/${card.cardCode}`}
      className="group/binder block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
      aria-label={displayName}
      title={displayName}
    >
      <div
        className={cn(
          "relative aspect-[63/88] w-full overflow-hidden rounded-md",
          "bg-gradient-to-br from-muted/40 to-muted/10",
          "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]",
          "transition-all duration-200",
          "group-hover/binder:-translate-y-0.5 group-hover/binder:shadow-md group-hover/binder:ring-1 group-hover/binder:ring-primary/30",
        )}
      >
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={displayName}
            fill
            className="object-contain p-0.5"
            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 14vw"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
            {t(lang, "noImage")}
          </span>
        )}

        {showLock && (
          <div className="pointer-events-none absolute left-1 top-1 z-10 flex size-5 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm">
            <Lock className="size-2.5" />
          </div>
        )}
        {showQty && (
          <div className="pointer-events-none absolute right-1 top-1 z-10 rounded-full bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm tabular-nums">
            ×{card.quantity}
          </div>
        )}

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10",
            "translate-y-1 opacity-0",
            "bg-gradient-to-t from-black/85 via-black/60 to-transparent",
            "p-1.5 pt-4",
            "transition-all duration-200",
            "group-hover/binder:translate-y-0 group-hover/binder:opacity-100",
            "group-focus-visible/binder:translate-y-0 group-focus-visible/binder:opacity-100",
            "hidden sm:block",
          )}
        >
          <p className="line-clamp-1 text-[11px] font-medium text-white">
            {displayName}
          </p>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wide text-white/70">
            {card.cardCode}
          </p>
        </div>
      </div>
    </Link>
  );
}
