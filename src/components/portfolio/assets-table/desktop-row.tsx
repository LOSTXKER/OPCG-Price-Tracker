"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, StickyNote } from "lucide-react"

import { MiniSparkline } from "@/components/ui/mini-sparkline"
import { Price } from "@/components/shared/price-inline"
import { getGameConfig, getGameAccentTint } from "@/lib/game-config"
import { DEFAULT_GAME } from "@/lib/game/constants"
import { getCardName, t, type Language } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { AssetEditButton, ChangeCell } from "./action-menu"
import { holdingValue, pnlCalc } from "./utils"

export const AssetRowComponent = memo(function AssetRowComponent({
  row,
  lang,
  onEdit,
  hideBalance = false,
  showGameBadge = false,
  sparkline,
}: {
  row: AssetRow
  lang: Language
  onEdit: () => void
  hideBalance?: boolean
  showGameBadge?: boolean
  /** Real 7-day price series for this card (optional). */
  sparkline?: number[]
}) {
  const currency = useUIStore((s) => s.currency)
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const value = holdingValue(row)
  const pnlResult = pnlCalc(row)
  const detailHref = `/cards/${row.cardCode}`
  const viewLabel = t(lang, "viewDetails")

  const gameSlug = row.game?.slug ?? DEFAULT_GAME
  const gameShort =
    getGameConfig(gameSlug)?.shortName ?? row.game?.nameEn ?? gameSlug.toUpperCase()
  const sparkUp = (row.priceChange7d ?? 0) >= 0

  return (
    <tr className="group ease-chrome transition-colors hover:bg-muted/40">
      {/* การ์ด — art + name + code ×qty (+notes on hover) */}
      <td className="py-2.5 pr-3 align-middle">
        <div className="flex items-center gap-2.5">
          <Link href={detailHref} className="shrink-0" aria-label={viewLabel}>
            <div className="relative aspect-[63/88] w-8 overflow-hidden rounded bg-muted/60 ring-1 ring-[var(--p-hair)] transition-transform group-hover:scale-[1.03]">
              {row.imageUrl ? (
                <Image src={row.imageUrl} alt={name} fill className="object-cover" sizes="32px" />
              ) : (
                <div className="flex size-full items-center justify-center text-overlay text-muted-foreground/40" />
              )}
            </div>
          </Link>
          <div className="min-w-0">
            <Link
              href={detailHref}
              className="group/link inline-flex max-w-full items-center gap-1"
              title={viewLabel}
            >
              <span className="truncate text-body-sm font-medium transition-colors group-hover/link:text-primary">
                {name}
              </span>
              <ChevronRight
                aria-hidden
                className="size-3 shrink-0 text-muted-foreground/30 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
              />
            </Link>
            <p className="font-mono text-meta text-muted-foreground/60">
              {row.baseCode ?? row.cardCode}
              <span className="ml-1.5 font-sans text-foreground/40">×{row.quantity}</span>
              {row.notes && (
                <span
                  className="ml-1.5 inline-flex items-center gap-0.5 text-muted-foreground/50"
                  title={row.notes}
                >
                  <StickyNote className="size-3" />
                </span>
              )}
            </p>
          </div>
        </div>
      </td>

      {/* เกม — tint dot + short name (hidden when only one game) */}
      {showGameBadge && (
        <td className="py-2.5 pr-3 align-middle">
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{
                background: `color-mix(in srgb, ${getGameAccentTint(gameSlug)} 70%, transparent)`,
              }}
            />
            <span className="text-body-sm text-muted-foreground">{gameShort}</span>
          </div>
        </td>
      )}

      {/* ต้นทุน */}
      <td className="py-2.5 pr-3 text-right align-middle">
        {hideBalance ? (
          <span className="font-price text-xs text-muted-foreground/40">••••</span>
        ) : row.purchasePrice != null ? (
          <span className="font-price text-body-sm tabular-nums text-muted-foreground">
            {formatJpyAmount(row.purchasePrice * row.quantity, currency)}
          </span>
        ) : (
          <span className="font-price text-xs text-muted-foreground/40">—</span>
        )}
      </td>

      {/* ราคา (ตลาด ต่อใบ — ไม่ mask, เป็นข้อมูลสาธารณะ) */}
      <td className="py-2.5 pr-3 text-right align-middle">
        {row.currentPrice != null ? (
          <span className="font-price text-body-sm tabular-nums">
            <Price jpy={row.currentPrice} />
          </span>
        ) : (
          <span className="font-price text-xs text-muted-foreground/40">—</span>
        )}
      </td>

      {/* 24h */}
      <td className="py-2.5 pr-3 text-right align-middle">
        <ChangeCell value={row.priceChange24h} />
      </td>

      {/* แนวโน้ม 7 วัน — เส้นจริงจาก API (lg only) */}
      <td className="hidden py-2.5 pr-3 text-right align-middle lg:table-cell">
        {sparkline && sparkline.length >= 2 ? (
          <MiniSparkline
            data={sparkline}
            width={60}
            height={20}
            className={cn("ml-auto", sparkUp ? "text-price-up" : "text-price-down")}
          />
        ) : (
          <span className="text-xs text-muted-foreground/30">—</span>
        )}
      </td>

      {/* กำไร/ขาดทุน */}
      <td className="py-2.5 pr-3 text-right align-middle">
        {pnlResult ? (
          hideBalance ? (
            <span className="font-price text-body-sm tabular-nums text-muted-foreground/40">
              ••••
            </span>
          ) : (
            <span
              className={cn(
                "font-price text-body-sm font-medium tabular-nums",
                pnlResult.pnl >= 0 ? "text-price-up" : "text-price-down",
              )}
            >
              {pnlResult.pnl >= 0 ? "+" : ""}
              {formatJpyAmount(pnlResult.pnl, currency)}
              <span className="ml-1 text-micro font-normal opacity-70">
                ({pnlResult.pct >= 0 ? "+" : ""}
                {formatPct(pnlResult.pct)}%)
              </span>
            </span>
          )
        ) : (
          <span className="font-price text-xs text-muted-foreground/40">—</span>
        )}
      </td>

      {/* มูลค่า */}
      <td className="py-2.5 pr-3 text-right align-middle">
        <span className="font-price text-body-sm font-semibold tabular-nums">
          {hideBalance ? "••••" : <Price jpy={value} />}
        </span>
      </td>

      {/* แก้ไข — ghost */}
      <td className="py-2.5 pl-1 text-right align-middle">
        <AssetEditButton lang={lang} onEdit={onEdit} />
      </td>
    </tr>
  )
})
