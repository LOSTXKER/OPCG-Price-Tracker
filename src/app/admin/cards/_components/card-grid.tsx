import Image from "next/image";
import Link from "next/link";

import { formatJpy } from "@/lib/utils/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import type { CardRow } from "./types";

export function CardGrid({ cards, loading }: { cards: CardRow[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[63/88] rounded-lg" />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        ไม่พบการ์ดที่ตรงกับเงื่อนไข
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {cards.map((card) => {
        const flagged = !card.nameEn || !card.imageUrl;
        return (
          <Surface
            as={Link}
            variant="outline"
            key={card.id}
            href={`/admin/cards/${card.id}`}
            className="group flex flex-col overflow-hidden rounded-lg motion-base hover:bg-muted/70"
          >
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.nameEn ?? card.nameJp}
                width={150}
                height={210}
                className="w-full object-contain"
                unoptimized
              />
            ) : (
              <div className="flex aspect-[63/88] w-full items-center justify-center bg-muted/30 text-meta">
                ไม่มีรูป
              </div>
            )}
            {/* Always-visible info row — admins should see code/rarity/price
                without hovering. Data-quality flag rides alongside the meta. */}
            <div className="flex flex-col gap-0.5 border-t border-hair px-2 py-1.5">
              <div className="flex items-center gap-1">
                <p className="truncate text-xs font-bold">{card.baseCode}</p>
                {flagged && (
                  <span
                    title="Missing translation or image"
                    className="ml-auto inline-flex size-4 items-center justify-center rounded-sm bg-warning text-overlay leading-none text-warning-foreground"
                  >
                    !
                  </span>
                )}
              </div>
              <p className="truncate text-overlay text-muted-foreground">
                {card.rarity} · {card.latestPriceJpy != null ? formatJpy(card.latestPriceJpy) : "—"}
              </p>
            </div>
          </Surface>
        );
      })}
    </div>
  );
}
