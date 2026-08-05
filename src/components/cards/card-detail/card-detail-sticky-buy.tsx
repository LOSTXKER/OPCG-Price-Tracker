"use client"

import { ShoppingBag } from "lucide-react"

import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import type { CardWithSet } from "@/components/portfolio/add-card-types"
import { t, type Currency, type Language } from "@/lib/i18n"
import { formatByCurrency, formatDisplayValue } from "@/lib/utils/currency"

import type { CardListing } from "./types"

interface CardDetailStickyBuyProps {
  visible: boolean
  card: CardWithSet
  cardName: string
  gradeLabel: string
  lowestListing: CardListing | null
  latest: number | null
  currency: Currency
  lang: Language
}

/** Mobile-only transact bar shown after the hero buy box leaves the viewport. */
export function CardDetailStickyBuy({
  visible,
  card,
  cardName,
  gradeLabel,
  lowestListing,
  latest,
  currency,
  lang,
}: CardDetailStickyBuyProps) {
  if (!visible) return null

  return (
    <div
      className="ease-chrome fixed inset-x-0 z-floating bg-background md:hidden"
      style={{
        bottom:
          "calc(4rem + env(safe-area-inset-bottom) + var(--floating-ad-clearance))",
        boxShadow: "inset 0 1px 0 0 var(--p-hair)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-eyebrow">{gradeLabel} · Meecard</p>
          <p className="text-h4 tnum leading-none text-foreground">
            {lowestListing != null
              ? formatByCurrency(
                  lowestListing.priceJpy,
                  currency,
                  lowestListing.priceThb,
                ).primary
              : latest == null
                ? "—"
                : formatDisplayValue(latest, currency)}
          </p>
        </div>
        <CardAddToPortfolio
          card={card}
          cardName={cardName}
          variant="outline"
          iconOnly
          className="surface-1 ring-inset flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground ring-1 ring-hair [&_svg]:size-5"
        />
        <a
          href="#market"
          className="ease-chrome ml-auto flex min-h-11 max-w-[200px] flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          <ShoppingBag className="size-4" aria-hidden /> {t(lang, "viewAsksCta")}
        </a>
      </div>
    </div>
  )
}
