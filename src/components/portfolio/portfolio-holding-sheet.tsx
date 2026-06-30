"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUp } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Price } from "@/components/shared/price-inline"
import { getCardName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import {
  formatDisplayValue,
  formatPct,
  jpyToDisplayValue,
} from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import type { AssetRow } from "@/lib/types/portfolio"

export function PortfolioHoldingSheet({
  asset,
  open,
  onOpenChange,
}: {
  asset: AssetRow | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  // Derived values — safe to compute even when asset is null (produce zeros)
  const positionValueJpy = asset
    ? (asset.currentPrice ?? 0) * asset.quantity
    : 0
  const costJpy = asset ? (asset.purchasePrice ?? 0) * asset.quantity : 0
  const pnlJpy = positionValueJpy - costJpy
  const hasCost = asset?.purchasePrice != null
  const pnlPct =
    hasCost && costJpy > 0 ? (pnlJpy / costJpy) * 100 : null
  const pnlPositive = pnlJpy >= 0

  const cardName = asset ? getCardName(lang, asset) : ""

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {asset && (
        <SheetContent
          side="bottom"
          className="max-h-[90vh] overflow-y-auto rounded-t-2xl pb-10"
        >
          {/* Identity: image + name + code + rarity */}
          <SheetHeader>
            <div className="flex gap-4">
              <div className="relative aspect-[63/88] w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {asset.imageUrl ? (
                  <Image
                    src={asset.imageUrl}
                    alt={cardName}
                    fill
                    className="object-contain"
                    sizes="80px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <SheetTitle>{cardName}</SheetTitle>
                <p className="mt-1 text-meta">{asset.cardCode}</p>
                <p className="text-meta">{asset.rarity}</p>
              </div>
            </div>
          </SheetHeader>

          {/* Stat rows */}
          <div className="divide-y divide-[var(--p-hair)] border-y border-[var(--p-hair)] px-4">
            {/* Quantity */}
            <StatRow label={t(lang, "quantity")}>
              <span className="font-price tabular-nums">{asset.quantity}</span>
            </StatRow>

            {/* Avg Cost (per unit) */}
            <StatRow label={t(lang, "avgCost")}>
              {asset.purchasePrice != null ? (
                <span className="font-price tabular-nums">
                  {formatDisplayValue(
                    jpyToDisplayValue(asset.purchasePrice, currency),
                    currency,
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </StatRow>

            {/* Market Price (per unit) */}
            <StatRow label={t(lang, "marketPrice")}>
              <Price
                jpy={asset.currentPrice ?? 0}
                thb={asset.currentPriceThb}
              />
            </StatRow>

            {/* Position Value (qty × market price) */}
            <StatRow label={t(lang, "value")}>
              <span className="font-price tabular-nums">
                {formatDisplayValue(
                  jpyToDisplayValue(positionValueJpy, currency),
                  currency,
                )}
              </span>
            </StatRow>

            {/* P/L */}
            <StatRow label={t(lang, "pnl")}>
              {hasCost ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-price tabular-nums",
                    pnlPositive ? "text-price-up" : "text-price-down",
                  )}
                >
                  {pnlPositive ? (
                    <ArrowUp className="size-3.5" />
                  ) : (
                    <ArrowDown className="size-3.5" />
                  )}
                  {formatDisplayValue(
                    jpyToDisplayValue(Math.abs(pnlJpy), currency),
                    currency,
                  )}
                  {pnlPct != null && (
                    <span className="text-micro">
                      ({formatPct(Math.abs(pnlPct))}%)
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </StatRow>
          </div>

          {/* View card CTA */}
          <div className="px-4 pt-3">
            <Link
              href={`/cards/${asset.cardCode}`}
              className="ease-chrome flex w-full items-center justify-center rounded-xl border border-[var(--p-hair)] py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {t(lang, "cardPage")}
            </Link>
          </div>
        </SheetContent>
      )}
    </Sheet>
  )
}

function StatRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-eyebrow">{label}</span>
      <div className="min-w-0 text-sm font-medium text-foreground">
        {children}
      </div>
    </div>
  )
}
