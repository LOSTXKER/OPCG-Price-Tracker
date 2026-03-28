"use client"

import Image from "next/image"
import Link from "next/link"
import { TrendingUp, TrendingDown, Layers, BarChart3, Clock, ArrowRight } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName } from "@/lib/i18n"
import type { TrendingCard } from "@/lib/data/home"
import { Price } from "@/components/shared/price-inline"
import { useUIStore } from "@/stores/ui-store"

export function HomeStatsStrip({
  totalCards,
  totalValue,
}: {
  totalCards: number
  totalValue: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1">
        <Layers className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">การ์ดทั้งหมด</span>
        <span className="font-price text-xs font-semibold text-foreground">
          {totalCards.toLocaleString()}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1">
        <BarChart3 className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">มูลค่ารวม</span>
        <span className="font-price text-xs font-semibold text-foreground">
          <Price jpy={totalValue} />
        </span>
      </span>
    </div>
  )
}

export function HomeFeaturedCard({
  card,
}: {
  card: {
    cardCode: string
    nameJp: string
    nameEn?: string | null
    nameTh?: string | null
    rarity: string
    imageUrl: string | null
    latestPriceJpy: number | null
    set: { code: string }
  }
}) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)

  return (
    <Link
      href={`/cards/${card.cardCode}`}
      className="group flex items-center gap-5 rounded-xl p-3 transition-colors hover:bg-muted/40"
    >
      <div className="relative aspect-[63/88] w-[100px] shrink-0 overflow-hidden rounded-lg bg-muted">
        {card.imageUrl && (
          <Image
            src={card.imageUrl}
            alt={name}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="100px"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          มูลค่าสูงสุด
        </p>
        <p className="mt-1.5 truncate text-base font-semibold">{name}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-mono">{card.set.code.toUpperCase()}</span>
          <span>&middot;</span>
          <RarityBadge rarity={card.rarity} size="sm" />
        </div>
        <p className="mt-2 font-price text-xl font-bold tracking-tight">
          ~<Price jpy={card.latestPriceJpy ?? 0} />
        </p>
      </div>
    </Link>
  )
}

export function HomeMiniTable({
  title,
  cards,
  type,
}: {
  title: string
  cards: TrendingCard[]
  type: "gainers" | "losers"
}) {
  const lang = useUIStore((s) => s.language)
  const icon = type === "gainers"
    ? <TrendingUp className="size-3.5" />
    : <TrendingDown className="size-3.5" />

  const linkHref = type === "gainers" ? "/trending?tab=gainers" : "/trending?tab=losers"

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {icon}
          {title}
        </p>
        <Link
          href={linkHref}
          className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ดูเพิ่มเติม
          <ArrowRight className="size-3" />
        </Link>
      </div>
      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
          <Clock className="size-4 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground/40">
            ยังไม่มีข้อมูล 24 ชม.
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {cards.slice(0, 3).map((card, i) => {
            const name = getCardName(lang, card)
            const change = card.priceChange24h
            const isUp = change != null && change > 0
            return (
              <Link
                key={card.cardCode}
                href={`/cards/${card.cardCode}`}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40"
              >
                <span className="w-4 shrink-0 text-center font-price text-xs text-muted-foreground">
                  {i + 1}
                </span>
                <div className="relative size-7 shrink-0 overflow-hidden rounded bg-muted">
                  {card.imageUrl && (
                    <Image
                      src={card.imageUrl}
                      alt={name}
                      fill
                      className="object-contain"
                      sizes="28px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium leading-tight">
                    {name}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-price text-[13px] font-medium ${
                    isUp ? "text-price-up" : type === "losers" ? "text-price-down" : "text-muted-foreground"
                  }`}
                >
                  {change != null
                    ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
                    : "—"}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
