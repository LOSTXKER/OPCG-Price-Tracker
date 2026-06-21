"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, StickyNote } from "lucide-react"

import { Price } from "@/components/shared/price-inline"
import { getCardName, t, type Language } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { AssetEditButton } from "./action-menu"
import { holdingValue, pnlCalc } from "./utils"

export const AssetRowComponent = memo(function AssetRowComponent({
  row,
  lang,
  onEdit,
  hideBalance = false,
}: {
  row: AssetRow
  lang: Language
  onEdit: () => void
  hideBalance?: boolean
}) {
  const currency = useUIStore((s) => s.currency)
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const value = holdingValue(row)
  const pnlResult = pnlCalc(row)
  const detailHref = `/cards/${row.cardCode}`
  const viewLabel = t(lang, "viewDetails")

  return (
    <tr className="group border-b border-[var(--p-hair)] ease-chrome transition-colors hover:bg-foreground/[0.04]">
      <td className="py-3.5 pl-5 pr-3 align-middle">
        <div className="flex items-start gap-3.5">
          <Link href={detailHref} className="shrink-0" aria-label={viewLabel}>
            <div className="relative size-11 overflow-hidden rounded-lg bg-muted/60 ring-1 ring-[var(--p-hair)] transition-transform group-hover:scale-[1.02]">
              {row.imageUrl ? (
                <Image
                  src={row.imageUrl}
                  alt={name}
                  fill
                  className="object-contain"
                  sizes="44px"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-overlay text-muted-foreground/40">
                  {row.baseCode ?? row.cardCode}
                </div>
              )}
            </div>
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={detailHref}
              className="group/link inline-flex max-w-full items-center gap-1"
              title={viewLabel}
            >
              <p className="truncate text-sm font-semibold leading-tight transition-colors group-hover/link:text-primary">
                {name}
              </p>
              <ChevronRight
                aria-hidden
                className="size-3.5 shrink-0 text-muted-foreground/30 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
              />
            </Link>
            <p className="mt-0.5 font-mono text-meta text-muted-foreground/60">
              {row.baseCode ?? row.cardCode}
              <span className="ml-1.5 font-sans text-foreground/40">×{row.quantity}</span>
            </p>
            {row.notes ? (
              <p
                className="mt-1 flex items-start gap-1 text-meta italic text-muted-foreground/70"
                title={row.notes}
              >
                <StickyNote className="mt-0.5 size-3 shrink-0 text-muted-foreground/40" />
                <span className="line-clamp-1">{row.notes}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={onEdit}
                className="mt-1 flex items-center gap-1 text-meta text-muted-foreground/40 opacity-0 transition-opacity hover:text-foreground/70 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <StickyNote className="size-3 shrink-0" />
                <span>{t(lang, "watchlistAddNote")}</span>
              </button>
            )}
          </div>
        </div>
      </td>
      <td className="py-3.5 pr-3 text-right align-middle">
        <span className="font-price text-sm font-bold tabular-nums">
          {hideBalance ? "••••" : <Price jpy={value} />}
        </span>
      </td>
      <td className="py-3.5 pr-3 text-right align-middle">
        {hideBalance ? (
          <span className="font-price text-xs text-muted-foreground/40">••••</span>
        ) : row.purchasePrice != null ? (
          <span className="font-price text-sm tabular-nums text-muted-foreground">
            {formatJpyAmount(row.purchasePrice * row.quantity, currency)}
          </span>
        ) : (
          <span className="font-price text-xs text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="py-3.5 pr-3 text-right align-middle">
        {pnlResult ? (
          hideBalance ? (
            <p className="font-price text-sm leading-tight tabular-nums">
              <span className="text-muted-foreground/40">••••</span>
              <span
                className={cn(
                  "ml-1.5 font-bold",
                  pnlResult.pct >= 0 ? "text-price-up" : "text-price-down",
                )}
              >
                {pnlResult.pct >= 0 ? "+" : ""}
                {formatPct(pnlResult.pct)}%
              </span>
            </p>
          ) : (
            <p
              className={cn(
                "font-price text-sm font-bold leading-tight tabular-nums",
                pnlResult.pnl >= 0 ? "text-price-up" : "text-price-down",
              )}
            >
              {pnlResult.pnl >= 0 ? "+" : ""}
              {formatJpyAmount(pnlResult.pnl, currency)}
              <span
                className={cn(
                  "ml-1 font-price text-micro font-normal tabular-nums",
                  pnlResult.pct >= 0 ? "text-price-up/60" : "text-price-down/60",
                )}
              >
                ({pnlResult.pct >= 0 ? "+" : ""}
                {formatPct(pnlResult.pct)}%)
              </span>
            </p>
          )
        ) : (
          <span className="font-price text-xs text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="py-3.5 pr-5 text-right align-middle">
        <div className="flex items-center justify-end">
          <AssetEditButton lang={lang} onEdit={onEdit} showLabel />
        </div>
      </td>
    </tr>
  )
})
