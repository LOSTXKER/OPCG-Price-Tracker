"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Price } from "@/components/shared/price-inline"
import { PriceTag } from "@/components/ui/price-tag"
import { getGameConfig, getGameAccentTint } from "@/lib/game-config"
import { DEFAULT_GAME } from "@/lib/game/constants"
import { MASKED } from "@/lib/constants/ui"
import { getCardName, t, type Language } from "@/lib/i18n"
import type { PortfolioPurchaseRow } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"
import { formatJpyAmount } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { AssetDetailsButton } from "./action-menu"
import { PurchaseNotePreview } from "./purchase-note-preview"
import {
  formatPurchaseRowDate,
  formatPurchaseRowQuantity,
  getPurchaseRowLabel,
  purchaseRowPnlCalc,
} from "./utils"

export const AssetRowComponent = memo(function AssetRowComponent({
  row,
  lang,
  onEdit,
  hideBalance = false,
  showGameBadge = false,
  eagerImage = false,
}: {
  row: PortfolioPurchaseRow
  lang: Language
  onEdit: () => void
  hideBalance?: boolean
  showGameBadge?: boolean
  /** The first visible row is an above-the-fold LCP candidate. */
  eagerImage?: boolean
}) {
  const currency = useUIStore((s) => s.currency)
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const pnlResult = purchaseRowPnlCalc(row)
  const purchaseLabel = getPurchaseRowLabel(row, lang)
  const editContext = `${name} · ${purchaseLabel}`
  const detailHref = `/opcg/cards/${row.cardCode}`
  const viewLabel = t(lang, "viewDetails")

  const gameSlug = row.game?.slug ?? DEFAULT_GAME
  const gameShort =
    getGameConfig(gameSlug)?.shortName ?? row.game?.nameEn ?? gameSlug.toUpperCase()

  return (
    <tr
      className="group cursor-pointer ease-chrome transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
      onClick={onEdit}
      data-slot="portfolio-purchase-row"
      data-row-action="open-purchase-details"
      data-lot-id={row.lotId ?? "compat"}
    >
      {/* การ์ด — art + name · code/date · note preview */}
      <td className="py-3 pr-3 align-middle">
        <div className="flex items-center gap-3">
          <Link
            href={detailHref}
            className="shrink-0"
            aria-label={viewLabel}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[63/88] w-10 overflow-hidden rounded-md bg-muted/60 ring-1 ring-hair transition-transform group-hover:scale-[1.03]">
              {row.imageUrl ? (
                <Image
                  src={row.imageUrl}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="40px"
                  loading={eagerImage ? "eager" : "lazy"}
                />
              ) : (
                <div className="flex size-full items-center justify-center text-overlay text-muted-foreground/40" />
              )}
            </div>
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={detailHref}
              className="group/link inline-flex max-w-full items-center gap-1"
              title={viewLabel}
              onClick={(event) => event.stopPropagation()}
            >
              <span className="truncate text-body-sm font-medium transition-colors group-hover/link:text-primary">
                {name}
              </span>
              <ChevronRight
                aria-hidden
                className="size-3 shrink-0 text-muted-foreground/30 opacity-0 transition-all group-hover/link:translate-x-0.5 group-hover/link:opacity-100"
              />
            </Link>
            <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-meta">
              <span className="shrink-0 font-mono">
                {row.baseCode ?? row.cardCode}
              </span>
              {showGameBadge && (
                <span className="inline-flex shrink-0 items-center gap-1 font-sans">
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full"
                    style={{
                      background: `color-mix(in srgb, ${getGameAccentTint(gameSlug)} 70%, transparent)`,
                    }}
                  />
                  {gameShort}
                </span>
              )}
              <span aria-hidden>·</span>
              <span
                className={cn(
                  "shrink-0 whitespace-nowrap font-sans",
                  row.acquiredAt == null && "text-primary",
                )}
                data-slot="portfolio-purchase-date"
                data-state={row.acquiredAt == null ? "missing" : "recorded"}
              >
                {formatPurchaseRowDate(row.acquiredAt, lang)}
              </span>
            </p>
            <PurchaseNotePreview note={row.purchaseNote} lang={lang} />
          </div>
        </div>
      </td>

      {/* จำนวนการ์ดในรายการซื้อนี้ */}
      <td
        className="py-3 pr-3 text-right align-middle"
        data-slot="portfolio-asset-quantity"
      >
        <span className="whitespace-nowrap text-body-sm font-medium tabular-nums">
          {formatPurchaseRowQuantity(row.quantity, lang)}
        </span>
      </td>

      {/* ราคา (ตลาด ต่อใบ) */}
      <td className="py-3 pr-3 text-right align-middle" data-slot="portfolio-asset-price">
        {row.currentPrice != null ? (
          <span className="text-body-sm font-price tabular-nums">
            {hideBalance ? MASKED : <Price jpy={row.currentPrice} />}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </td>

      {/* ต้นทุนต่อใบของรายการซื้อนี้ */}
      <td className="py-3 pr-3 text-right align-middle" data-slot="portfolio-asset-cost">
        {row.unitCostJpy != null ? (
          <span className="text-body-sm font-price tabular-nums">
            {hideBalance ? MASKED : <Price jpy={row.unitCostJpy} />}
          </span>
        ) : (
          <span className="text-meta">{t(lang, "costNotRecorded")}</span>
        )}
      </td>

      {/* กำไร/ขาดทุน — amount and percentage scan as a pair */}
      <td className="py-3 pr-3 text-right align-middle" data-slot="portfolio-asset-pnl">
        {pnlResult ? (
          <div
            className={cn(
              "flex min-w-0 flex-col items-end gap-0.5 whitespace-nowrap font-price tabular-nums",
              pnlResult.pnl >= 0 ? "text-price-up" : "text-price-down",
            )}
          >
            <span
              className="text-body-sm font-medium"
              aria-label={hideBalance ? t(lang, "balanceHidden") : undefined}
            >
              {hideBalance
                ? MASKED
                : `${pnlResult.pnl >= 0 ? "+" : ""}${formatJpyAmount(
                    pnlResult.pnl,
                    currency,
                  )}`}
            </span>
            {pnlResult.pct != null && (
              <PriceTag
                change={pnlResult.pct}
                changeOnly
                changeStyle="plain"
                showArrow={false}
                size="sm"
                className="text-micro font-normal opacity-80"
              />
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </td>

      {/* รายละเอียด — explicit keyboard target; row click is a pointer shortcut. */}
      <td className="py-3 text-center align-middle">
        <AssetDetailsButton
          lang={lang}
          onOpen={onEdit}
          contextLabel={editContext}
        />
      </td>
    </tr>
  )
})
