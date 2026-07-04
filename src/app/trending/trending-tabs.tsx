"use client"

import { memo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { TrendingUp, TrendingDown, TrendingUpDown, Eye } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { DeltaText } from "@/components/shared/delta-text"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { Sparkline } from "@/components/shared/sparkline"
import { Surface } from "@/components/ui/surface"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { formatCount } from "@/lib/utils/currency"
import type { TrendingCardRow } from "./page"

type TabId = "gainers" | "losers" | "mostViewed"
type Period = "24h" | "7d" | "30d"

const TABS: { id: TabId; labelKey: "topGainers" | "topLosers" | "mostViewed"; icon: typeof TrendingUp }[] = [
  { id: "gainers", labelKey: "topGainers", icon: TrendingUp },
  { id: "losers", labelKey: "topLosers", icon: TrendingDown },
  { id: "mostViewed", labelKey: "mostViewed", icon: Eye },
]

const PERIODS: { value: Period; labelKey: "period24h" | "period7d" | "period30d" }[] = [
  { value: "24h", labelKey: "period24h" },
  { value: "7d", labelKey: "period7d" },
  { value: "30d", labelKey: "period30d" },
]

interface TrendingRowProps {
  card: TrendingCardRow
  rank: number
  activeTab: TabId
  period: Period
}

const MobileTrendingItem = memo(function MobileTrendingItem({
  card,
  rank,
  activeTab,
  period,
}: TrendingRowProps) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const change = activeTab === "mostViewed" ? null : getChangeValue(card, period)

  return (
    <Link
      href={`/cards/${card.cardCode}`}
      className="flex items-center gap-3 px-4 py-3 ease-chrome transition-colors active:bg-muted/70"
    >
      <span className="w-5 shrink-0 text-center font-price text-xs text-muted-foreground">
        {rank}
      </span>
      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
        {card.imageUrl && (
          <Image
            src={card.imageUrl}
            alt={name}
            fill
            className="object-contain"
            sizes="44px"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-meta">
          <span className="font-mono">{card.setCode.toUpperCase()}</span>
          <RarityBadge rarity={card.rarity} size="sm" />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-price text-sm font-semibold tabular-nums">
          {card.latestPriceJpy != null ? (
            <Price jpy={card.latestPriceJpy} />
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )}
        </p>
        {activeTab === "mostViewed" ? (
          <p className="font-price text-xs tabular-nums text-muted-foreground">
            {formatCount(card.viewCount ?? 0)}
          </p>
        ) : (
          <div className="font-price text-xs">
            <DeltaText value={change} suffix="%" />
          </div>
        )}
      </div>
    </Link>
  )
})

const TrendingRow = memo(function TrendingRow({ card, rank, activeTab, period }: TrendingRowProps) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const change = activeTab === "mostViewed" ? null : getChangeValue(card, period)

  return (
    <tr
      key={card.cardCode}
      className="border-b border-[var(--p-hair)] ease-chrome transition-colors hover:bg-muted/70"
    >
      <td className="px-4 py-2.5 text-center tabular-nums text-muted-foreground">
        {rank}
      </td>
      <td className="px-4 py-2.5">
        <Link
          href={`/cards/${card.cardCode}`}
          className="flex items-center gap-3 hover:underline"
        >
          <div className="relative size-9 shrink-0 overflow-hidden rounded bg-muted">
            {card.imageUrl && (
              <Image
                src={card.imageUrl}
                alt={name}
                fill
                className="object-contain"
                sizes="36px"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium leading-tight">{name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <RarityBadge rarity={card.rarity} size="sm" />
            </div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-2.5">
        <Link
          href={`/sets/${card.setCode}`}
          className="font-mono text-xs text-muted-foreground ease-chrome transition-colors hover:text-primary"
        >
          {card.setCode.toUpperCase()}
        </Link>
      </td>
      <td className="px-4 py-2.5 text-right font-price tabular-nums">
        <Price jpy={card.latestPriceJpy ?? 0} />
      </td>
      {activeTab === "mostViewed" ? (
        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
          {formatCount(card.viewCount ?? 0)}
        </td>
      ) : (
        <td className="px-4 py-2.5 text-right">
          <DeltaText value={change} suffix="%" />
        </td>
      )}
      <td className="hidden px-4 py-2.5 sm:table-cell">
        <div className="flex justify-end">
          {card.sparkline.length >= 2 ? (
            <Sparkline data={card.sparkline} width={80} height={28} />
          ) : (
            <span className="text-meta text-muted-foreground/30">—</span>
          )}
        </div>
      </td>
    </tr>
  )
})

interface TrendingData {
  gainers24h: TrendingCardRow[]
  losers24h: TrendingCardRow[]
  gainers7d: TrendingCardRow[]
  losers7d: TrendingCardRow[]
  gainers30d: TrendingCardRow[]
  losers30d: TrendingCardRow[]
  mostViewed: TrendingCardRow[]
}

function getCards(data: TrendingData, tab: TabId, period: Period): TrendingCardRow[] {
  if (tab === "mostViewed") return data.mostViewed
  const key = `${tab}${period}` as keyof TrendingData
  return data[key] ?? []
}

function getChangeValue(card: TrendingCardRow, period: Period): number | null {
  if (period === "24h") return card.priceChange24h
  if (period === "7d") return card.priceChange7d
  return card.priceChange30d
}

export function TrendingTabs({ data }: { data: TrendingData }) {
  // Tab lives in `?tab=` so the page can stay statically rendered (ISR) and the
  // tab is deep-linkable / back-button friendly.
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const tabParam = searchParams.get("tab")
  const activeTab: TabId = (["gainers", "losers", "mostViewed"] as TabId[]).includes(
    tabParam as TabId,
  )
    ? (tabParam as TabId)
    : "gainers"
  const setActiveTab = (next: TabId) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", next)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const [period, setPeriod] = useState<Period>("24h")
  const lang = useUIStore((s) => s.language)
  const cards = getCards(data, activeTab, period)

  const tabOptions = TABS.map((tab) => ({
    value: tab.id,
    label: t(lang, tab.labelKey),
    icon: tab.icon,
  }))
  const periodOptions = PERIODS.map(({ value, labelKey }) => ({
    value,
    label: t(lang, labelKey),
  }))

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {/* The Thai labels ("การ์ดที่มีคนดูมากสุด" etc.) don't fit a 3-way
            segmented control at 390px — contained horizontal scroll (same
            pattern as the card-detail section tabs / set type pills) instead
            of letting it overflow the whole page. */}
        <div className="no-sb -mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={setActiveTab}
            ariaLabel={t(lang, "trendingTitle")}
          />
        </div>

        {activeTab !== "mostViewed" && (
          <div className="ml-auto">
            <SegmentedControl
              options={periodOptions}
              value={period}
              onChange={setPeriod}
              size="sm"
              variant="pill"
              leadingIcon={TrendingUpDown}
              ariaLabel={t(lang, "change")}
            />
          </div>
        )}
      </div>

      {/* Mobile list */}
      <Surface variant="panel" padding="none" className="overflow-hidden sm:hidden">
        {cards.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{t(lang, "noData")}</p>
        ) : (
          <div className="divide-y divide-[var(--p-hair)]">
            {cards.map((card, i) => (
              <MobileTrendingItem
                key={card.cardCode}
                card={card}
                rank={i + 1}
                activeTab={activeTab}
                period={period}
              />
            ))}
          </div>
        )}
      </Surface>

      {/* Desktop table */}
      <Surface variant="panel" padding="none" className="hidden overflow-hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-12" />
              <col />
              <col className="w-20" />
              <col className="w-28" />
              <col className="w-36" />
              <col className="hidden w-24 sm:table-column" />
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--p-hair)] text-eyebrow">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">{t(lang, "card")}</th>
                <th className="px-4 py-3 text-left">{t(lang, "set")}</th>
                <th className="px-4 py-3 text-right">{t(lang, "price")}</th>
                {activeTab === "mostViewed" ? (
                  <th className="whitespace-nowrap px-4 py-3 text-right">{t(lang, "visits")}</th>
                ) : (
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    {t(lang, "change")} ({period})
                  </th>
                )}
                <th className="hidden px-4 py-3 text-right sm:table-cell">
                  {t(lang, "sparkline7d")}
                </th>
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t(lang, "noData")}
                  </td>
                </tr>
              ) : (
                cards.map((card, i) => (
                  <TrendingRow
                    key={card.cardCode}
                    card={card}
                    rank={i + 1}
                    activeTab={activeTab}
                    period={period}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  )
}

export function TrendingPageHeader() {
  const lang = useUIStore((s) => s.language)
  return (
    <PageHeader
      title={t(lang, "trendingTitle")}
      description={t(lang, "trendingDesc")}
    />
  )
}
