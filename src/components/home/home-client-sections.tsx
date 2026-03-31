"use client"

import Image from "next/image"
import Link from "next/link"
import {
  TrendingUp, TrendingDown, Clock, ArrowRight,
  ChevronRight, Briefcase, Sparkles, Flame, LogIn, Plus,
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

  const panelClass = "rounded-lg border border-border/40 bg-card overflow-hidden"
  const headerClass = "flex items-center justify-between px-3.5 py-2.5 border-b border-border/40"
  const iconBg = "flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"

  if (authed === null || loading) {
    return (
      <div className={panelClass}>
        <div className={headerClass}>
          <div className="flex items-center gap-2">
            <div className={iconBg}><Briefcase className="size-3.5" /></div>
            <span className="text-sm font-semibold">{t(lang, "myPortfolio")}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 px-3.5 py-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2.5 w-12 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (authed === false) {
    return (
      <Link href="/portfolio" className={cn(panelClass, "group transition-colors hover:border-border hover:bg-muted/40")}>
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Briefcase className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground">{t(lang, "portfolio")}</p>
            <p className="text-sm font-semibold">{t(lang, "loginToTrack")}</p>
          </div>
          <LogIn className="size-4 text-muted-foreground/40 transition-all group-hover:text-muted-foreground" />
        </div>
      </Link>
    )
  }

  if (empty || !data) {
    return (
      <Link href="/portfolio" className={cn(panelClass, "group transition-colors hover:border-border hover:bg-muted/40")}>
        <div className={headerClass}>
          <div className="flex items-center gap-2">
            <div className={iconBg}><Briefcase className="size-3.5" /></div>
            <span className="text-sm font-semibold">{t(lang, "myPortfolio")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3.5 py-3 text-muted-foreground">
          <Plus className="size-4" />
          <span className="text-xs">
            {t(lang, "noPortfolioYet")} &mdash;{" "}
            <span className="font-medium text-foreground underline underline-offset-2">{t(lang, "createOne")}</span>
          </span>
        </div>
      </Link>
    )
  }

  return (
    <div className={panelClass}>
      <Link href="/portfolio" className={cn(headerClass, "group transition-colors hover:bg-muted/40")}>
        <div className="flex items-center gap-2">
          <div className={iconBg}><Briefcase className="size-3.5" /></div>
          <span className="text-sm font-semibold">{t(lang, "myPortfolio")}</span>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {t(lang, "viewPortfolio")}
          <ArrowRight className="size-3" />
        </span>
      </Link>
      <div className="grid grid-cols-3 divide-x divide-border/40 px-1 py-2.5">
        <div className="px-2.5">
          <p className="text-[10px] font-medium text-muted-foreground">{t(lang, "portfolioValue")}</p>
          <p className="mt-0.5 font-price text-sm font-bold">
            <Price jpy={data.totalValue} />
          </p>
        </div>
        <div className="px-2.5">
          <p className="text-[10px] font-medium text-muted-foreground">{t(lang, "cardsTracked")}</p>
          <p className="mt-0.5 font-price text-sm font-bold">{data.totalCards}</p>
        </div>
        <div className="px-2.5">
          <p className="text-[10px] font-medium text-muted-foreground">{t(lang, "unrealizedPnl")}</p>
          {data.hasCostBasis ? (
            <p className={cn(
              "mt-0.5 font-price text-sm font-bold",
              data.unrealizedPnl >= 0 ? "text-price-up" : "text-price-down",
            )}>
              {data.unrealizedPnl >= 0 ? "+" : ""}
              <Price jpy={data.unrealizedPnl} />
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">&mdash;</p>
          )}
        </div>
      </div>
    </div>
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

  const panelClass = "rounded-lg border border-border/40 bg-card overflow-hidden"
  const headerClass = "flex items-center justify-between px-3.5 py-2.5 border-b border-border/40"
  const iconBg = "flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"

  if (authed === null || loading) {
    return (
      <div className={panelClass}>
        <div className={headerClass}>
          <div className="flex items-center gap-2">
            <div className={iconBg}><Sparkles className="size-3.5" /></div>
            <span className="text-sm font-semibold">{t(lang, "honeyPoints")}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 px-3.5 py-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2.5 w-12 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (authed === false) {
    return (
      <Link href="/honey" className={cn(panelClass, "group transition-colors hover:border-border hover:bg-muted/40")}>
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Sparkles className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground">{t(lang, "honeyPoints")}</p>
            <p className="text-sm font-semibold">{t(lang, "loginToEarn")}</p>
          </div>
          <LogIn className="size-4 text-muted-foreground/40 transition-all group-hover:text-muted-foreground" />
        </div>
      </Link>
    )
  }

  if (!data) {
    return (
      <Link href="/honey" className={cn(panelClass, "group transition-colors hover:border-border hover:bg-muted/40")}>
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <div className={iconBg}><Sparkles className="size-3.5" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground">{t(lang, "honeyPoints")}</p>
            <p className="text-sm font-semibold">{t(lang, "ctaHoney")}</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground/40" />
        </div>
      </Link>
    )
  }

  const levelKey = `level${data.level.label}` as const

  return (
    <div className={panelClass}>
      <Link href="/honey" className={cn(headerClass, "group transition-colors hover:bg-muted/40")}>
        <div className="flex items-center gap-2">
          <div className={iconBg}><Sparkles className="size-3.5" /></div>
          <span className="text-sm font-semibold">{t(lang, "honeyPoints")}</span>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {t(lang, "viewHoney")}
          <ArrowRight className="size-3" />
        </span>
      </Link>
      <div className="flex items-center divide-x divide-border/40 px-1 py-2.5">
        <div className="flex-1 px-2.5">
          <p className="text-[10px] font-medium text-muted-foreground">{t(lang, "balance")}</p>
          <p className="mt-0.5 font-price text-sm font-bold text-amber-600 dark:text-amber-400">
            {data.honeyPoints.toLocaleString()} {t(lang, "pts")}
          </p>
        </div>
        <div className="flex-1 px-2.5">
          <p className="text-[10px] font-medium text-muted-foreground">{t(lang, "honeyLevel")}</p>
          <p className="mt-0.5 text-sm font-bold">{t(lang, levelKey as any)}</p>
        </div>
        <div className="flex-1 px-2.5">
          <p className="text-[10px] font-medium text-muted-foreground">{t(lang, "streak")}</p>
          <div className="mt-0.5 flex items-center gap-1">
            <Flame className="size-3.5 text-orange-500" />
            <span className="font-price text-sm font-bold">{data.checkinStreak} {t(lang, "days")}</span>
          </div>
        </div>
        {data.canCheckin && (
          <div className="shrink-0 px-2.5">
            <button
              onClick={doCheckin}
              disabled={checking}
              className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
            >
              {checking ? "..." : t(lang, "dailyCheckin")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Preview Row (wraps both mini previews)                            */
/* ------------------------------------------------------------------ */

export function HomePreviewRow() {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <HomePortfolioPreview />
      <HomeHoneyPreview />
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
