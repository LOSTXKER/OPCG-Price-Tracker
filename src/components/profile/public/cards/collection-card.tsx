"use client";

import Image from "next/image";
import Link from "next/link";

import { getCardName, t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import type { ProfileCardData } from "../types";

/**
 * Binder-pocket style — pure image card, no on-card overlays. The grid
 * reads as a showcase album rather than a marketplace listing. Card name
 * is exposed via `title`/`aria-label` for accessibility; tap or click
 * navigates to the card page where full details live.
 *
 * `hideQty` and `showLock` are accepted for back-compat with callers but
 * no longer rendered — decorative on-card overlays were removed
 * site-wide in favor of a clean image surface.
 */
export function CollectionCard({
  card,
  lang,
}: {
  card: ProfileCardData;
  // hideQty/showLock kept on the prop type for back-compat with callers
  // but no longer rendered; ignored at runtime.
  hideQty?: boolean;
  showLock?: boolean;
  lang: Language;
}) {
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
          <span className="flex size-full items-center justify-center text-overlay text-muted-foreground">
            {t(lang, "noImage")}
          </span>
        )}
      </div>
    </Link>
  );
}
