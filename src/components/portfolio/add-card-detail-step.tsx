"use client"

import Image from "next/image"
import {
  ArrowLeft,
  Loader2,
  Minus,
  Package,
  Plus,
} from "lucide-react"

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { formatJpyAmount, formatDisplayValue, jpyToDisplayValue, currencySymbol } from "@/lib/utils/currency"
import type { CardWithSet } from "./add-card-types"

export function DetailStep({
  card,
  quantity,
  setQuantity,
  purchasePrice,
  setPurchasePrice,
  submitting,
  onBack,
  onSubmit,
}: {
  card: CardWithSet
  quantity: number
  setQuantity: (q: number) => void
  purchasePrice: string
  setPurchasePrice: (p: string) => void
  submitting: boolean
  onBack: () => void
  onSubmit: () => void
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  return (
    <>
      <DialogHeader className="border-b border-border/40 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <DialogTitle>{t(lang, "addToPortfolio")}</DialogTitle>
            <DialogDescription className="sr-only">{t(lang, "addToPortfolioDesc")}</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
          <div className="relative aspect-[63/88] w-14 shrink-0 overflow-hidden rounded-lg bg-muted/60">
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.nameEn ?? card.nameJp}
                fill
                className="object-contain"
                sizes="56px"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Package className="size-5 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {card.nameEn ?? card.nameJp}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="font-mono text-xs text-muted-foreground">
                {card.cardCode}
              </span>
              {card.rarity && <RarityBadge rarity={card.rarity} size="sm" />}
            </div>
            {card.latestPriceJpy != null && (
              <p className="mt-1 font-price text-sm font-semibold tabular-nums text-primary">
                {formatJpyAmount(card.latestPriceJpy, currency)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">{t(lang, "quantity")}</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Minus className="size-4" />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value)
                  if (!isNaN(v) && v >= 1) setQuantity(v)
                }}
                className="h-10 w-20 rounded-lg border border-border bg-background text-center font-mono text-sm font-semibold tabular-nums outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">{t(lang, "purchasePrice")}</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/50">
                {currencySymbol(currency)}
              </span>
              <input
                type="number"
                min={0}
                placeholder={
                  card.latestPriceJpy != null
                    ? Math.round(jpyToDisplayValue(card.latestPriceJpy, currency)).toLocaleString()
                    : "0"
                }
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background pl-7 pr-4 text-sm tabular-nums outline-none placeholder:text-muted-foreground/35 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground/60">
              {t(lang, "useMarketPrice")}
            </p>
          </div>

          {(purchasePrice.trim() !== "" || card.latestPriceJpy != null) && (
            <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t(lang, "totalValue")}</span>
                <span className="font-price text-lg font-bold tabular-nums">
                  {formatDisplayValue(
                    (purchasePrice.trim() !== ""
                      ? parseInt(purchasePrice) || 0
                      : Math.round(jpyToDisplayValue(card.latestPriceJpy ?? 0, currency))) * quantity,
                    currency
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/40 px-5 py-4">
        <Button
          className="w-full gap-2"
          size="lg"
          disabled={submitting}
          onClick={onSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t(lang, "adding")}
            </>
          ) : (
            t(lang, "addToPort")
          )}
        </Button>
      </div>
    </>
  )
}
