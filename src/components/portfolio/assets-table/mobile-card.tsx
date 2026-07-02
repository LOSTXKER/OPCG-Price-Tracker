"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, StickyNote } from "lucide-react"

import { GameBadge } from "@/components/shared/game-badge"
import { Price } from "@/components/shared/price-inline"
import { getCardName, t, type Language } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { AssetEditButton, ChangeCell } from "./action-menu"
import { holdingValue, pnlCalc } from "./utils"

export const MobileAssetCard = memo(function MobileAssetCard({
  row,
  lang,
  onEdit,
  hideBalance = false,
  showGameBadge = false,
}: {
  row: AssetRow
  lang: Language
  onEdit: () => void
  hideBalance?: boolean
  showGameBadge?: boolean
}) {
  const currency = useUIStore((s) => s.currency)
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const value = holdingValue(row)
  const pnlResult = pnlCalc(row)

  return (
    <div className="py-3.5">
      <div className="flex gap-3">
        <Link href={`/cards/${row.cardCode}`} className="shrink-0">
          <div className="relative aspect-[63/88] w-12 overflow-hidden rounded-md bg-muted ring-1 ring-[var(--p-hair)]">
            {row.imageUrl ? (
              <Image
                src={row.imageUrl}
                alt={name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="size-full bg-muted" />
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <Link
              href={`/cards/${row.cardCode}`}
              className="group/link min-w-0 flex-1"
              title={t(lang, "viewDetails")}
            >
              <p className="flex items-center gap-1 text-sm font-semibold leading-tight">
                <span className="truncate">{name}</span>
                <ChevronRight
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover/link:translate-x-0.5"
                />
              </p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {row.baseCode ?? row.cardCode}
                <span className="ml-1.5 text-foreground/60">×{row.quantity}</span>
                {showGameBadge && <GameBadge game={row.game} className="ml-1.5 align-middle" />}
              </p>
            </Link>
            <div className="flex shrink-0 items-center">
              <AssetEditButton lang={lang} onEdit={onEdit} />
            </div>
          </div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div className="min-w-0 leading-tight">
              <p className="tabular-nums text-sm font-bold">
                {hideBalance ? "••••" : <Price jpy={value} />}
              </p>
              {hideBalance ? (
                <p className="mt-0.5 tabular-nums text-micro text-muted-foreground/40">
                  ••
                </p>
              ) : (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <ChangeCell value={row.priceChange24h} />
                  <span aria-hidden className="text-micro text-muted-foreground/30">·</span>
                  <ChangeCell value={row.priceChange7d} label="7d" />
                </div>
              )}
            </div>
            {pnlResult ? (
              <div className="text-right leading-tight">
                {hideBalance ? (
                  <p className="tabular-nums text-sm">
                    <span className="text-muted-foreground/40">••••</span>
                    <span
                      className={cn(
                        "ml-1.5 font-semibold",
                        pnlResult.pct >= 0 ? "text-price-up" : "text-price-down",
                      )}
                    >
                      {pnlResult.pct >= 0 ? "+" : ""}
                      {formatPct(pnlResult.pct)}%
                    </span>
                  </p>
                ) : (
                  <>
                    <p
                      className={cn(
                        "tabular-nums text-sm font-semibold",
                        pnlResult.pnl >= 0 ? "text-price-up" : "text-price-down",
                      )}
                    >
                      {pnlResult.pnl >= 0 ? "+" : ""}
                      {formatJpyAmount(pnlResult.pnl, currency)}
                      <span
                        className={cn(
                          "ml-1 tabular-nums text-micro font-normal",
                          pnlResult.pct >= 0 ? "text-price-up/70" : "text-price-down/70",
                        )}
                      >
                        ({pnlResult.pct >= 0 ? "+" : ""}
                        {formatPct(pnlResult.pct)}%)
                      </span>
                    </p>
                    {row.purchasePrice != null && (
                      <p className="mt-0.5 tabular-nums text-micro text-muted-foreground/60">
                        <span className="font-sans">{t(lang, "costBasis")}</span>{" "}
                        {formatJpyAmount(row.purchasePrice * row.quantity, currency)}
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </div>
          {row.notes ? (
            <p className="mt-2 flex items-start gap-1 text-meta italic text-muted-foreground/70">
              <StickyNote className="mt-0.5 size-3 shrink-0 text-muted-foreground/40" />
              <span className="line-clamp-2">{row.notes}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={onEdit}
              className="mt-2 flex items-center gap-1 text-meta text-muted-foreground/40 transition-colors hover:text-foreground/70"
            >
              <StickyNote className="size-3 shrink-0" />
              <span>{t(lang, "watchlistAddNote")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
