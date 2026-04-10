"use client"

import Image from "next/image"
import Link from "next/link"
import {
  TrendingUp, TrendingDown, Clock, ArrowRight,
  ChevronRight, Briefcase, Sparkles, LogIn, Plus,
  BarChart3, Megaphone,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { cn } from "@/lib/utils"
import { getCardName, t } from "@/lib/i18n"
import type { TrendingCard } from "@/lib/data/home"
import { Price } from "@/components/shared/price-inline"
import { useUIStore } from "@/stores/ui-store"
import { formatPct } from "@/lib/utils/currency"
import { useAuthState } from "@/hooks/use-auth-state"
import { StreakTierIndicator } from "@/components/shared/streak-tier-indicator"

/* ------------------------------------------------------------------ */
/*  Portfolio Mini Preview                                            */
/* ------------------------------------------------------------------ */

type PortfolioItem = {
  quantity: number
  purchasePrice: number | null
  card: { latestPriceJpy: number | null }
}

type PortfolioSummary = {
  totalValue: number
  totalCards: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  hasCostBasis: boolean
}

function summarizePortfolios(portfolios: { items: PortfolioItem[] }[]): PortfolioSummary {
  let totalValue = 0
  let totalCost = 0
  let totalCards = 0
  let hasCostBasis = false

  for (const p of portfolios) {
    for (const it of p.items) {
      const px = it.card.latestPriceJpy ?? 0
      const qty = it.quantity
      totalValue += px * qty
      totalCards += qty
      if (it.purchasePrice != null && it.purchasePrice > 0) {
        hasCostBasis = true
        totalCost += it.purchasePrice * qty
      }
    }
  }

  const unrealizedPnl = hasCostBasis ? totalValue - totalCost : 0
  const unrealizedPnlPct = hasCostBasis && totalCost > 0 ? (unrealizedPnl / totalCost) * 100 : 0

  return { totalValue, totalCards, unrealizedPnl, unrealizedPnlPct, hasCostBasis }
}

export function HomePortfolioPreview() {
  const lang = useUIStore((s) => s.language)
  const { authed } = useAuthState()
  const [data, setData] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    if (authed !== true) { setLoading(false); return }
    fetch("/api/portfolio")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.portfolios?.length) { setEmpty(true); setLoading(false); return }
        setData(summarizePortfolios(json.portfolios))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [authed])

  const cardBase = "group flex flex-col rounded-xl border p-4 transition-colors"
  const cardStyle = cn(cardBase, "border-border/40 bg-gradient-to-br from-card to-muted/20 hover:border-border")

  if (authed === null || loading) {
    return (
      <div className={cardStyle}>
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold">{t(lang, "myPortfolio")}</span>
        </div>
        <div className="mt-2 h-7 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-1.5 h-4 w-28 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (authed === false) {
    return (
      <Link href="/portfolio" className={cardStyle}>
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold">{t(lang, "myPortfolio")}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t(lang, "loginToTrack")}</p>
      </Link>
    )
  }

  if (empty || !data) {
    return (
      <Link href="/portfolio" className={cardStyle}>
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold">{t(lang, "myPortfolio")}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t(lang, "createOne")}</p>
      </Link>
    )
  }

  return (
    <Link href="/portfolio" className={cardStyle}>
      <div className="flex items-center gap-2">
        <Briefcase className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold">{t(lang, "myPortfolio")}</span>
      </div>
      <p className="mt-2 font-price text-xl font-bold leading-none">
        <Price jpy={data.totalValue} />
      </p>
      <div className="mt-auto flex items-center gap-2 pt-1.5 text-xs">
        {data.hasCostBasis && (
          <span className={cn(
            "font-price font-bold",
            data.unrealizedPnl >= 0 ? "text-price-up" : "text-price-down",
          )}>
            {data.unrealizedPnl >= 0 ? "+" : ""}<Price jpy={data.unrealizedPnl} /> ({data.unrealizedPnl >= 0 ? "+" : ""}{formatPct(data.unrealizedPnlPct)}%)
          </span>
        )}
        <span className="text-muted-foreground">
          {data.totalCards.toLocaleString()} {lang === "TH" ? "การ์ด" : lang === "JP" ? "カード" : "cards"}
        </span>
      </div>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Honey Mini Preview                                                */
/* ------------------------------------------------------------------ */

type HoneyData = {
  honeyPoints: number
  checkinStreak: number
  canCheckin: boolean
  level: { level: number; label: string; nextThreshold: number | null }
}

export function HomeHoneyPreview() {
  const lang = useUIStore((s) => s.language)
  const { authed } = useAuthState()
  const [data, setData] = useState<HoneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (authed !== true) { setLoading(false); return }
    fetch("/api/honey")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) setData(json)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [authed])

  const doCheckin = useCallback(async () => {
    if (checking || !data?.canCheckin) return
    setChecking(true)
    try {
      const res = await fetch("/api/honey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin" }),
      })
      if (res.ok) {
        const result = await res.json()
        setData((prev) =>
          prev
            ? { ...prev, honeyPoints: result.total, checkinStreak: result.streak, canCheckin: false }
            : prev,
        )
      }
    } catch { /* silent */ }
    setChecking(false)
  }, [checking, data?.canCheckin])

  const cardBase = "group flex flex-col rounded-xl border p-4 transition-colors"
  const cardStyle = cn(cardBase, "border-border/40 bg-gradient-to-br from-card to-muted/20 hover:border-border")

  if (authed === null || loading) {
    return (
      <div className={cardStyle}>
        <div className="flex items-center gap-2">
          <span className="text-sm leading-none">🍯</span>
          <span className="text-xs font-semibold">{t(lang, "honeyPoints")}</span>
        </div>
        <div className="mt-3 h-7 w-16 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (authed === false) {
    return (
      <Link href="/honey" className={cardStyle}>
        <div className="flex items-center gap-2">
          <span className="text-sm leading-none">🍯</span>
          <span className="text-xs font-semibold">{t(lang, "honeyPoints")}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t(lang, "loginToEarn")}</p>
      </Link>
    )
  }

  if (!data) {
    return (
      <Link href="/honey" className={cardStyle}>
        <div className="flex items-center gap-2">
          <span className="text-sm leading-none">🍯</span>
          <span className="text-xs font-semibold">{t(lang, "honeyPoints")}</span>
        </div>
      </Link>
    )
  }

  const streak = data.checkinStreak
  const checkinReward = streak >= 30 ? 30 : streak >= 7 ? 20 : 10

  return (
    <Link href="/honey" className={cardStyle}>
      <div className="flex items-center gap-2">
        <span className="text-sm leading-none">🍯</span>
        <span className="text-xs font-semibold">{t(lang, "honeyPoints")}</span>
      </div>
      <p className="mt-2 font-price text-xl font-bold leading-none">
        {data.honeyPoints.toLocaleString()} <span className="text-xs font-semibold text-muted-foreground">Honey</span>
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1.5">
        <StreakTierIndicator streak={streak} lang={lang} variant="compact" />
        <div className="ml-auto shrink-0">
          {data.canCheckin ? (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); doCheckin() }}
              disabled={checking}
              className="relative rounded-full bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <span className="absolute -right-0.5 -top-0.5 flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
              </span>
              {checking ? "..." : `${t(lang, "dailyCheckin")} +${checkinReward} 🍯`}
            </button>
          ) : (
            <span className="text-xs font-medium text-price-up">
              ✓ {t(lang, "checkinDone")}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Market Value Card                                                  */
/* ------------------------------------------------------------------ */

function HomeMarketValueCard({ totalValue, totalCards }: { totalValue: number; totalCards: number }) {
  const lang = useUIStore((s) => s.language)
  const cardBase = "group flex flex-col rounded-xl border p-4 transition-colors"
  const cardStyle = cn(cardBase, "border-border/40 bg-gradient-to-br from-card to-muted/20 hover:border-border")
  const label = lang === "TH" ? "มูลค่ารวมตลาด" : lang === "JP" ? "市場総額" : "Market Value"
  const cardLabel = lang === "TH" ? "การ์ด" : lang === "JP" ? "カード" : "cards"

  return (
    <Link href="/market-overview" className={cardStyle}>
      <div className="flex items-center gap-2">
        <BarChart3 className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="mt-2 font-price text-xl font-bold leading-none">
        <Price jpy={totalValue} />
      </p>
      <p className="mt-auto pt-1.5 text-xs text-muted-foreground">
        {totalCards.toLocaleString()} {cardLabel}
      </p>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Ad Space Card                                                      */
/* ------------------------------------------------------------------ */

function HomeAdCard() {
  const lang = useUIStore((s) => s.language)
  const label = lang === "TH" ? "โฆษณา" : lang === "JP" ? "広告" : "Ad"

  return (
    <Link
      href="/pricing"
      className="group relative overflow-hidden rounded-xl border border-border/40 transition-colors hover:border-border"
    >
      <Image
        src="/ad-banner.png"
        alt="Advertisement"
        fill
        sizes="(min-width: 1024px) 25vw, 50vw"
        className="object-cover"
      />
      <span className="absolute right-1.5 top-1.5 z-10 rounded bg-black/50 px-1.5 py-0.5 text-xs font-medium text-white/70">
        {label}
      </span>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Preview Row (wraps all 4 preview cards)                            */
/* ------------------------------------------------------------------ */

export function HomePreviewRow({ totalValue, totalCards }: { totalValue: number; totalCards: number }) {
  return (
    <div className="hidden auto-rows-fr gap-3 lg:grid lg:grid-cols-4">
      <HomePortfolioPreview />
      <HomeHoneyPreview />
      <HomeMarketValueCard totalValue={totalValue} totalCards={totalCards} />
      <HomeAdCard />
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
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
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
                  <p className="truncate text-sm font-medium leading-tight">
                    {name}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-price text-sm font-medium ${
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
