"use client"

import Image from "next/image"
import Link from "next/link"
import { BarChart3, Crown, Layers, Package, TrendingUp } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { cn } from "@/lib/utils"
import { RARITY_BAR_COLOR } from "@/lib/constants/rarities"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { useUIStore } from "@/stores/ui-store"
import { getCardName, t, type Language } from "@/lib/i18n"

type TopCard = {
  cardCode: string
  nameJp: string
  nameEn: string | null
  nameTh: string | null
  rarity: string
  imageUrl: string | null
  latestPriceJpy: number
  setCode: string
}

type MarketData = {
  totalCards: number
  totalValue: number
  avgPrice: number
  setCount: number
  rarityBreakdown: { rarity: string; count: number; totalValue: number }[]
  topSetsByValue: { code: string; name: string; boxImageUrl: string | null; cardCount: number; totalValue: number }[]
  topCards: TopCard[]
}

export function MarketOverviewClient({ data }: { data: MarketData }) {
  const lang = useUIStore((s) => s.language)

  const maxRarityValue = Math.max(...data.rarityBreakdown.map((r) => r.totalValue), 1)
  const maxSetValue = Math.max(...data.topSetsByValue.map((s) => s.totalValue), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t(lang, "marketOverviewTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(lang, "marketOverviewSubtitle")}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={<BarChart3 className="size-4" />}
          label={t(lang, "totalValue")}
          value={<Price jpy={data.totalValue} />}
        />
        <SummaryCard
          icon={<TrendingUp className="size-4" />}
          label={t(lang, "avgPrice")}
          value={<Price jpy={data.avgPrice} />}
        />
        <SummaryCard
          icon={<Layers className="size-4" />}
          label={t(lang, "totalCards")}
          value={data.totalCards.toLocaleString()}
        />
        <SummaryCard
          icon={<Package className="size-4" />}
          label={t(lang, "totalSets")}
          value={data.setCount.toLocaleString()}
        />
      </div>

      {/* Most valuable cards */}
      {data.topCards.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{t(lang, "mostValuableCards")}</h2>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {data.topCards.map((card, i) => (
              <TopCardTile key={card.cardCode} card={card} rank={i + 1} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* Rarity + Top sets */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Rarity breakdown */}
        <div className="panel overflow-hidden">
          <div className="border-b border-border/40 px-5 py-3.5">
            <h2 className="text-sm font-semibold">{t(lang, "valueByRarity")}</h2>
          </div>
          <div className="divide-y divide-border/30">
            {data.rarityBreakdown.map((r) => {
              const pct = (r.totalValue / data.totalValue) * 100
              const barWidth = (r.totalValue / maxRarityValue) * 100
              const barColor = RARITY_BAR_COLOR[r.rarity] ?? "bg-neutral-400"
              return (
                <div
                  key={r.rarity}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className="w-12 shrink-0">
                    <RarityBadge rarity={r.rarity} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", barColor)}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                    {pct.toFixed(1)}%
                  </span>
                  <div className="w-28 shrink-0 text-right">
                    <p className="whitespace-nowrap font-price text-sm font-semibold tabular-nums">
                      <Price jpy={r.totalValue} />
                    </p>
                    <p className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {r.count.toLocaleString()} {t(lang, "cardUnit")}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top sets by value */}
        <div className="panel overflow-hidden">
          <div className="border-b border-border/40 px-5 py-3.5">
            <h2 className="text-sm font-semibold">{t(lang, "topSetsByValue")}</h2>
          </div>
          <div className="divide-y divide-border/30">
            {data.topSetsByValue.map((s, i) => {
              const barWidth = (s.totalValue / maxSetValue) * 100
              return (
                <Link
                  key={s.code}
                  href={`/sets/${s.code.toLowerCase()}`}
                  className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
                >
                  <span className="w-5 shrink-0 text-center font-price text-xs font-medium tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  {s.boxImageUrl && (
                    <div className="relative size-9 shrink-0 overflow-hidden rounded bg-muted">
                      <Image
                        src={s.boxImageUrl}
                        alt={s.name}
                        fill
                        className="object-contain"
                        sizes="36px"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight group-hover:text-primary">
                      <span className="font-mono text-xs text-muted-foreground">{s.code.toUpperCase()}</span>
                      {" "}
                      <span className="truncate">{s.name}</span>
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-28 shrink-0 text-right">
                    <p className="whitespace-nowrap font-price text-sm font-semibold tabular-nums">
                      <Price jpy={s.totalValue} />
                    </p>
                    <p className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {s.cardCount.toLocaleString()} {t(lang, "cardUnit")}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Summary Card                                                       */
/* ------------------------------------------------------------------ */

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="panel flex items-center gap-3 px-4 py-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate font-price text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Top Card Tile                                                      */
/* ------------------------------------------------------------------ */

function TopCardTile({
  card,
  rank,
  lang,
}: {
  card: TopCard
  rank: number
  lang: Language
}) {
  const name = getCardName(lang, card)

  return (
    <Link
      href={`/cards/${card.cardCode}`}
      className="group panel flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[63/88] w-full overflow-hidden bg-muted/30">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={name}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground/30">
            <Layers className="size-8" />
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground/70 text-[10px] font-bold text-background backdrop-blur-sm">
          {rank}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="line-clamp-1 text-xs font-medium leading-tight">{name}</p>
        <div className="flex items-center gap-1">
          <RarityBadge rarity={card.rarity} size="sm" />
          <span className="font-mono text-xs text-muted-foreground">{card.setCode.toUpperCase()}</span>
        </div>
        <p className="mt-auto font-price text-sm font-bold">
          <Price jpy={card.latestPriceJpy} />
        </p>
      </div>
    </Link>
  )
}
