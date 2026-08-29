"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"

import { CardImageButton } from "@/components/shared/card-image-button"
import { WatchlistHeart } from "@/components/shared/watchlist-heart"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { PriceUsd } from "@/components/shared/price-usd"
import { Skeleton } from "@/components/ui/skeleton"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import type { CardRow, ChangePeriod } from "./market-types"
import {
  getGradePriceUsd,
  isRawGrade,
  type GradeKey,
} from "@/lib/pricing/grade-tiers"
import { PriceTag } from "@/components/ui/price-tag"

/**
 * One row of the phone market list (<sm only — the desktop `<table>` is a
 * separate renderer that keeps its own "กราฟ 30 วัน" sparkline column).
 *
 * Identity on the left, money on the right, and one watchlist heart pinned to
 * the right edge — no sparkline column. A 48px sparkline used to sit between
 * the two zones, which left the name just 75px of a 390px screen: 16 of the 20
 * rows truncated, and four consecutive rows all read "Monkey.D…". The trend
 * shape is not legible at that size anyway, so the width goes to the name and
 * to the one control this row needs (owner call, /proto/row-favorite).
 */
export const MobileCardItem = memo(function MobileCardItem({
  card,
  rank,
  grade = "raw",
  changePeriod = "24h",
}: {
  card: CardRow
  rank: number
  grade?: GradeKey
  /** Which change window the % chip shows — follows the page's period pill. */
  changePeriod?: ChangePeriod
}) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const change =
    changePeriod === "7d"
      ? card.priceChange7d
      : changePeriod === "30d"
        ? card.priceChange30d
        : card.priceChange24h
  const rawGrade = isRawGrade(grade)
  const gradePriceUsd = getGradePriceUsd(card.psa10PriceUsd, grade)

  return (
    <div className="ease-chrome flex min-h-[52px] items-center gap-3 px-4 py-2.5 active:bg-muted">
      <span className="w-5 shrink-0 text-center font-price text-xs text-muted-foreground">{rank}</span>
      {card.imageUrl ? (
        <CardImageButton
          card={{
            cardCode: card.cardCode,
            cardId: card.id ?? null,
            nameJp: card.nameJp,
            nameEn: card.nameEn,
            nameTh: card.nameTh,
            rarity: card.rarity,
            imageUrl: card.imageUrl,
            setCode: card.set?.code ?? card.setCode ?? null,
            priceJpy: card.latestPriceJpy ?? null,
            priceChange24h: card.priceChange24h ?? null,
            priceChange7d: card.priceChange7d ?? null,
            priceChange30d: card.priceChange30d ?? null,
            psa10PriceUsd: card.psa10PriceUsd ?? null,
          }}
          className="hairline relative aspect-[63/88] w-11 shrink-0 overflow-hidden rounded-md bg-muted"
        >
          <Image src={card.imageUrl} alt={name} fill className="object-contain" sizes="44px" />
        </CardImageButton>
      ) : (
        <div className="hairline relative aspect-[63/88] w-11 shrink-0 overflow-hidden rounded-md bg-muted" />
      )}
      <Link
        href={`/opcg/cards/${card.cardCode}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{name}</p>
          {/* รหัส + rarity ต้องอยู่บรรทัดเดียวเสมอ: พอปุ่มโปรดมาอยู่ขวาสุด
              บรรทัดนี้เหลือที่ราว 116px ซึ่งพอดีเป๊ะกับรหัส 8 ตัว + ป้าย —
              ปล่อยไว้เฉยๆ รหัสยาวกว่านั้นจะขึ้นบรรทัดใหม่ แถวสูงไม่เท่ากันทั้งหน้า */}
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-meta">
            <span className="truncate font-mono">{card.baseCode ?? card.cardCode}</span>
            <RarityBadge rarity={card.rarity} size="sm" className="shrink-0" />
          </div>
        </div>
        <div
          data-slot="mobile-price-stack"
          className="flex shrink-0 flex-col items-end gap-1 text-right"
        >
          <p className="font-price flex items-baseline justify-end gap-1 text-sm font-semibold">
            {!rawGrade ? (
              gradePriceUsd != null ? (
                <PriceUsd usd={gradePriceUsd} />
              ) : <span className="text-muted-foreground/50">—</span>
            ) : (
              card.latestPriceJpy != null ? <Price jpy={card.latestPriceJpy} /> : "—"
            )}
          </p>
          {!rawGrade ? (
            <span className="block min-h-4 text-meta" aria-hidden>—</span>
          ) : change != null ? (
            <PriceTag change={change} changeOnly changeStyle="plain" showArrow={false} size="sm" />
          ) : null}
        </div>
      </Link>
      {/* รายการโปรด — ขวาสุดของแถว (เบสเคาะแบบ A, /proto/row-favorite 2026-08-29).
          อยู่นอก <Link> เพราะกดแล้วต้องไม่เปิดหน้าการ์ด · -mr-1.5 ดึงปุ่มเข้าหา
          ขอบจอ พอให้ยังไม่ทับที่ปัดย้อนกลับของแอนดรอยด์ แต่ยังคงกล่องกด 44px */}
      {card.id != null && (
        <WatchlistHeart
          cardId={card.id}
          size="md"
          showTooltip={false}
          className="-mr-2 h-11 w-8"
        />
      )}
    </div>
  )
})

export function MobileCardSkeleton() {
  return (
    <div className="flex min-h-[52px] items-center gap-3 px-4 py-2.5">
      <Skeleton className="h-4 w-5" />
      <Skeleton className="aspect-[63/88] w-11 rounded-md" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <div className="space-y-1">
        <Skeleton className="ml-auto h-4 w-14" />
        <Skeleton className="ml-auto h-3 w-8" />
      </div>
      {/* กันที่ให้ปุ่มรายการโปรด ไม่งั้นแถวจะกระตุกตอนข้อมูลจริงมาแทนโครงโหลด */}
      <Skeleton className="-mr-1.5 h-5 w-9 rounded-sm" />
    </div>
  )
}
