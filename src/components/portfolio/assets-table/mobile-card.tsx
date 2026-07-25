"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { StickyNote } from "lucide-react"

import { GameBadge } from "@/components/shared/game-badge"
import { Price } from "@/components/shared/price-inline"
import { PriceTag } from "@/components/ui/price-tag"
import { MASKED } from "@/lib/constants/ui"
import { getCardName, t, type Language } from "@/lib/i18n"
import type { PortfolioPurchaseRow } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"
import { formatJpyAmount } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { AssetDetailsButton } from "./action-menu"
import {
  formatPurchaseRowDate,
  formatPurchaseRowQuantity,
  getPurchaseRowLabel,
  purchaseRowPnlCalc,
} from "./utils"

/**
 * Mobile purchase row (<sm) — SAME grammar as every other list row in the app
 * (home/market/watchlist): identity on the left, one money stack on the right,
 * no inner table (เบส: UI รายการมันดูยาก).
 *
 * The old row was a mini table: a 3-column dl with its own dividers repeated
 * "ราคาตลาด/ใบ · ต้นทุนต่อใบ · P/L" on EVERY row plus an "เพิ่มโน้ต" CTA, so one
 * holding was ~155px tall and nothing was scannable. Now:
 *   ราคาตลาด/ใบ + กำไร/ขาดทุน % stay in the row (labels kept for AT via sr-only
 *   `dt`), while ต้นทุน/ใบ, P/L in money and note text live one tap away in the
 *   purchase-details dialog — where the desktop table also keeps them.
 */
export const MobileAssetCard = memo(function MobileAssetCard({
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
  const savedNote = row.purchaseNote?.trim() || null

  return (
    <div
      className="group flex min-h-[56px] cursor-pointer items-center gap-2.5 py-2.5 transition-colors hover:bg-muted/30 focus-within:bg-muted/30 active:bg-muted/40"
      onClick={onEdit}
      data-slot="portfolio-assets-mobile-row"
      data-row-action="open-purchase-details"
      data-lot-id={row.lotId ?? "compat"}
    >
      <Link
        href={`/opcg/cards/${row.cardCode}`}
        className="shrink-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative aspect-[63/88] w-10 overflow-hidden rounded-md bg-muted ring-1 ring-hair">
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
            <div className="size-full bg-muted" />
          )}
        </div>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          {/* The link hugs the NAME TEXT only (no flex-1): dead space on this
              line must fall through to the row → purchase details. Card page is
              reached by tapping the art or the name itself (เบส). */}
          <Link
            href={`/opcg/cards/${row.cardCode}`}
            className="min-w-0 max-w-full"
            title={name}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="truncate text-body-sm font-medium leading-tight">{name}</p>
          </Link>
          {/* "1 ใบ" on every row was noise — a single copy is the default, so
              only multi-copy lots earn the badge (and they stand out). */}
          {row.quantity > 1 && (
            <span
              className="shrink-0 whitespace-nowrap text-meta tabular-nums"
              data-slot="portfolio-assets-mobile-quantity"
            >
              <span className="sr-only">{t(lang, "quantity")} </span>
              {formatPurchaseRowQuantity(row.quantity, lang)}
            </span>
          )}
        </div>

        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-meta">
          <span className="shrink-0 font-mono">
            {row.baseCode ?? row.cardCode}
          </span>
          {showGameBadge && <GameBadge game={row.game} className="align-middle" />}
          <span aria-hidden>·</span>
          <span
            className={cn(
              "truncate whitespace-nowrap font-sans",
              row.acquiredAt == null && "text-primary",
            )}
            data-slot="portfolio-purchase-date"
            data-state={row.acquiredAt == null ? "missing" : "recorded"}
          >
            {formatPurchaseRowDate(row.acquiredAt, lang, "compact")}
          </span>
          {/* A saved note is flagged, not previewed: the text would break the
              row rhythm, and the dialog shows it in full. No "add note" CTA
              here — it repeated on every row for nothing. */}
          {savedNote && (
            <span
              className="shrink-0 text-muted-foreground/70"
              data-slot="portfolio-purchase-note-flag"
              title={savedNote}
            >
              <StickyNote className="size-3" aria-hidden />
              <span className="sr-only">{`${t(lang, "purchaseLotNote")}: ${savedNote}`}</span>
            </span>
          )}
        </p>
      </div>

      {/* Money stack: market price on top, P/L percent under it — same shape as
          the market list's price + change. Labels stay for screen readers. */}
      <dl
        className="shrink-0 text-right"
        data-slot="portfolio-assets-mobile-metrics"
      >
        <dt className="sr-only">{t(lang, "marketPricePerCard")}</dt>
        <dd
          className="whitespace-nowrap text-body-sm font-price font-semibold tabular-nums"
          data-slot="portfolio-assets-mobile-price"
        >
          {row.currentPrice != null ? (
            hideBalance ? MASKED : <Price jpy={row.currentPrice} />
          ) : (
            "—"
          )}
        </dd>

        <dt className="sr-only">{t(lang, "pnl")}</dt>
        <dd
          className="mt-0.5 flex justify-end whitespace-nowrap"
          data-slot="portfolio-assets-mobile-pnl"
        >
          {pnlResult?.pct != null ? (
            <PriceTag
              change={pnlResult.pct}
              changeOnly
              changeStyle="plain"
              showArrow={false}
              size="sm"
            />
          ) : pnlResult ? (
            <span
              className={cn(
                "text-meta font-price tabular-nums",
                pnlResult.pnl >= 0 ? "text-price-up" : "text-price-down",
              )}
            >
              {hideBalance
                ? MASKED
                : `${pnlResult.pnl >= 0 ? "+" : ""}${formatJpyAmount(
                    pnlResult.pnl,
                    currency,
                  )}`}
            </span>
          ) : (
            <span className="text-meta text-muted-foreground/40">—</span>
          )}
        </dd>
      </dl>

      <AssetDetailsButton
        lang={lang}
        onOpen={onEdit}
        contextLabel={editContext}
        appearance="ghost"
      />
    </div>
  )
})
