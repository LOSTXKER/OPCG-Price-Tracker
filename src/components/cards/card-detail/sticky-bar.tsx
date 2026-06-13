"use client"

import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import { PriceDisplay } from "@/components/shared/price-display"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

/**
 * Mobile-only sticky action bar (REDESIGN.md §4 — StickyActionBar). Keeps the
 * primary "Add to Portfolio" CTA + current price thumb-reachable while the user
 * scrolls the long card-detail page, instead of leaving it stranded near the
 * top. Sits ABOVE the global bottom-nav (chrome route). Desktop keeps the inline
 * actions and hides this bar.
 */
export function CardDetailStickyBar({
  cardId,
  cardName,
  priceJpy,
  priceThb,
}: {
  cardId: number
  cardName: string
  priceJpy: number | null
  priceThb: number | null
}) {
  const lang = useUIStore((s) => s.language)

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))] z-40 border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-meta leading-tight">{t(lang, "marketPrice")}</p>
          <PriceDisplay
            priceJpy={priceJpy}
            priceThb={priceThb ?? undefined}
            size="card"
            showChange={false}
          />
        </div>
        <CardAddToPortfolio
          cardId={cardId}
          cardName={cardName}
          className="h-11 shrink-0 justify-center px-6"
        />
      </div>
    </div>
  )
}
