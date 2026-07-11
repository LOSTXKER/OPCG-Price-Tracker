"use client"

import { ChevronRight, ShoppingBag, Tag } from "lucide-react"

import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import { CardSetAlertDialog } from "@/components/cards/card-set-alert-dialog"
import { t, type Language } from "@/lib/i18n"
import { relativeTime } from "@/lib/utils/time"

import { SourceLogo, sourceLabel } from "./source-logo"
import type { CardDetailProps } from "./types"

interface LatestSale {
  source: string
  primary: string
  updatedAt: string | null
}

interface CardDetailBuyBoxProps {
  card: CardDetailProps["card"]
  displayName: string
  lang: Language
  hydrated: boolean
  latestSale: LatestSale | null
  alertOpen: boolean
  onAlertOpenChange: (open: boolean) => void
}

/** Primary transact actions and the freshest settled-sale reference. */
export function CardDetailBuyBox({
  card,
  displayName,
  lang,
  hydrated,
  latestSale,
  alertOpen,
  onAlertOpenChange,
}: CardDetailBuyBoxProps) {
  const secondaryButton =
    "ease-chrome ring-inset flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-transparent text-sm font-semibold text-foreground ring-1 ring-hair hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"

  return (
    <div className="order-3 min-w-0 pt-4 lg:order-none lg:col-start-3 lg:row-start-1 lg:pl-8 lg:pt-0">
      <div className="space-y-2">
        <a
          href="#market"
          className="ease-chrome flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          <ShoppingBag className="size-4" aria-hidden /> {t(lang, "viewAsksCta")}
        </a>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`/seller/listings/new?cardCode=${encodeURIComponent(card.cardCode)}`}
            className={secondaryButton}
          >
            <Tag className="size-4" aria-hidden /> {t(lang, "sellCta")}
          </a>
          <CardAddToPortfolio
            cardId={card.id}
            cardName={displayName}
            variant="ghost"
            className={secondaryButton}
          />
        </div>
      </div>

      <div className="mt-5 pt-1">
        <p className="text-eyebrow mb-1">{t(lang, "lastSold")}</p>
        {latestSale ? (
          <a
            href="#sources"
            className="ease-chrome -mx-1 flex min-h-11 items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SourceLogo source={latestSale.source} size={18} />
            <span className="text-label min-w-0 flex-1 truncate font-medium text-foreground">
              {sourceLabel(latestSale.source)}
            </span>
            <span className="text-price tnum shrink-0 text-foreground">
              {latestSale.primary}
            </span>
            <span className="text-meta tnum shrink-0">
              {hydrated && latestSale.updatedAt
                ? relativeTime(latestSale.updatedAt, lang)
                : ""}
            </span>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </a>
        ) : (
          <p className="text-meta py-2">
            {t(lang, "noLatestSales")} ·{" "}
            <a href="#sources" className="underline hover:text-foreground">
              {t(lang, "saleHistorySampleTitle")}
            </a>
          </p>
        )}
      </div>

      <CardSetAlertDialog
        cardId={card.id}
        cardName={displayName}
        currentPriceJpy={card.price?.priceJpy ?? card.latestPriceJpy}
        open={alertOpen}
        onOpenChange={onAlertOpenChange}
      />
    </div>
  )
}
