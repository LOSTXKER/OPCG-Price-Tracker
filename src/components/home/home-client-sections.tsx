"use client"

import Image from "next/image"
import Link from "next/link"
import { TrendingUp, TrendingDown, Layers, BarChart3, Clock, ArrowRight, ChevronRight, Package, Sparkles } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { cn } from "@/lib/utils"
import { getCardName, t } from "@/lib/i18n"
import type { TrendingCard } from "@/lib/data/home"
import { Price } from "@/components/shared/price-inline"
import { useUIStore } from "@/stores/ui-store"
import { formatPct } from "@/lib/utils/currency"

export function HomeStatsStrip({
  totalCards,
  totalValue,
  totalSets,
  latestSetName,
  latestSetCode,
}: {
  totalCards: number
  totalValue: number
  totalSets?: number
  latestSetName?: string
  latestSetCode?: string
}) {
  const lang = useUIStore((s) => s.language)

  const stats: { icon: React.ReactNode; label: string; value: React.ReactNode; href?: string }[] = [
    {
      icon: <Layers className="size-3.5" />,
      label: t(lang, "totalCards"),
      value: totalCards.toLocaleString(),
    },
    {
      icon: <BarChart3 className="size-3.5" />,
      label: t(lang, "totalValue"),
      value: <Price jpy={totalValue} />,
      href: "/market-overview",
    },
    ...(totalSets != null
      ? [{
          icon: <Package className="size-3.5" />,
          label: lang === "TH" ? "จำนวนเซ็ต" : lang === "JP" ? "セット数" : "Total Sets",
          value: totalSets.toLocaleString(),
          href: "/sets",
        }]
      : []),
    ...(latestSetName
      ? [{
          icon: <Sparkles className="size-3.5" />,
          label: lang === "TH" ? "เซ็ตล่าสุด" : lang === "JP" ? "最新セット" : "Latest Set",
          value: latestSetName,
          href: latestSetCode ? `/sets/${latestSetCode.toLowerCase()}` : "/sets",
        }]
      : []),
  ]

  const cardClass = "flex items-center gap-2.5 rounded-lg border border-border/40 bg-card px-3 py-2.5"
  const iconClass = "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {stats.map((s, i) =>
        s.href ? (
          <Link
            key={i}
            href={s.href}
            className={cn(cardClass, "group transition-colors hover:border-border hover:bg-muted/40")}
          >
            <div className={iconClass}>{s.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-muted-foreground">{s.label}</p>
              <p className="truncate font-price text-sm font-bold text-foreground">{s.value}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </Link>
        ) : (
          <div key={i} className={cardClass}>
            <div className={iconClass}>{s.icon}</div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground">{s.label}</p>
              <p className="truncate font-price text-sm font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        )
      )}
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
  const label = t(lang, "highestValue")

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
          {label}
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
  cards,
  type,
}: {
  cards: TrendingCard[]
  type: "gainers" | "losers"
}) {
  const lang = useUIStore((s) => s.language)
  const icon = type === "gainers"
    ? <TrendingUp className="size-3.5" />
    : <TrendingDown className="size-3.5" />
  const title = type === "gainers" ? t(lang, "topGainers") : t(lang, "topLosers")

  const linkHref = type === "gainers" ? "/trending?tab=gainers" : "/trending?tab=losers"

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex size-6 items-center justify-center rounded-md",
            type === "gainers" ? "bg-green-500/10" : "bg-red-500/10"
          )}>
            {type === "gainers"
              ? <TrendingUp className="size-3.5 text-green-600 dark:text-green-400" />
              : <TrendingDown className="size-3.5 text-red-600 dark:text-red-400" />}
          </div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
        <Link
          href={linkHref}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {t(lang, "more")}
          <ArrowRight className="size-3" />
        </Link>
      </div>
      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
          <Clock className="size-4 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground/40">
            {t(lang, "noData24h")}
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
