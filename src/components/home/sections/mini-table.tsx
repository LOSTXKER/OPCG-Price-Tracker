"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock, TrendingDown, TrendingUp } from "lucide-react"

import type { TrendingCard } from "@/lib/data/home"
import { getCardName, t } from "@/lib/i18n"
import { formatPct } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

export function HomeMiniTable({
  cards,
  type,
}: {
  cards: TrendingCard[]
  type: "gainers" | "losers"
}) {
  const lang = useUIStore((s) => s.language)
  const title = type === "gainers" ? t(lang, "topGainers") : t(lang, "topLosers")
  const linkHref = type === "gainers" ? "/trending?tab=gainers" : "/trending?tab=losers"
  const TrendIcon = type === "gainers" ? TrendingUp : TrendingDown
  const trendIconClass = type === "gainers" ? "text-price-up" : "text-price-down"

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-eyebrow">
          <TrendIcon className={`size-3.5 ${trendIconClass}`} aria-hidden />
          {title}
        </p>
        <Link
          href={linkHref}
          className="ease-chrome flex items-center gap-1 rounded-md px-1.5 py-0.5 text-meta hover:bg-muted hover:text-foreground"
        >
          {t(lang, "more")}
          <ArrowRight className="size-3" />
        </Link>
      </div>
      {cards.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-6 text-center">
          <Clock className="size-4 text-muted-foreground/30" />
          <p className="text-meta">{t(lang, "noData24h")}</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between gap-0.5">
          {cards.slice(0, 3).map((card, idx) => {
            const name = getCardName(lang, card)
            const change = card.priceChange24h
            const isUp = change != null && change > 0
            return (
              <Link
                key={card.cardCode}
                href={`/cards/${card.cardCode}`}
                className="ease-chrome flex min-h-11 flex-1 items-center gap-2.5 rounded-lg px-1.5 py-2 hover:bg-muted/70"
              >
                <span className="w-4 shrink-0 text-center font-price text-sm tabular-nums text-muted-foreground/70">
                  {idx + 1}
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
                  <p className="line-clamp-1 text-sm font-medium leading-tight">{name}</p>
                </div>
                <span
                  className={`shrink-0 font-price text-sm font-medium tabular-nums ${
                    isUp
                      ? "text-price-up"
                      : type === "losers"
                        ? "text-price-down"
                        : "text-muted-foreground"
                  }`}
                >
                  {change != null
                    ? `${change > 0 ? "+" : ""}${formatPct(change)}%`
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
