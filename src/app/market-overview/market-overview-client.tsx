"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock, Layers, Package } from "lucide-react"

import { Breadcrumb } from "@/components/shared/breadcrumb"
import { PageHeader } from "@/components/layout/page-header"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { Surface } from "@/components/ui/surface"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { useUIStore } from "@/stores/ui-store"
import { getCardName, t, type Language } from "@/lib/i18n"
import { formatRelativeAgo } from "@/lib/utils/relative-time"
import { formatCount } from "@/lib/utils/currency"

import { DeltaPill, MarketSnapshot } from "./_components/hero-market-card"
import { PeriodChip } from "./_components/period-chip"
import { RarityBreakdown } from "./_components/rarity-breakdown"
import { RawValueHint } from "./_components/raw-value-hint"

type TopCard = {
  cardCode: string
  nameJp: string
  nameEn: string | null
  nameTh: string | null
  rarity: string
  imageUrl: string | null
  latestPriceJpy: number
  priceChange7d: number | null
  setCode: string
}

type TopSet = {
  code: string
  name: string
  boxImageUrl: string | null
  cardCount: number
  totalValue: number
  change7d: number | null
}

type MarketData = {
  totalCards: number
  totalValue: number
  avgPrice: number
  setCount: number
  rarityBreakdown: { rarity: string; count: number; totalValue: number }[]
  topSetsByValue: TopSet[]
  topCards: TopCard[]
  movers: { up: number; down: number; flat: number }
  weightedDelta7d: number | null
  lastUpdatedAt: string | null
}

export function MarketOverviewClient({ data }: { data: MarketData }) {
  const lang = useUIStore((s) => s.language)

  const maxSetValue = Math.max(...data.topSetsByValue.map((s) => s.totalValue), 1)

  return (
    <div className="space-y-8">
      <PageHeader
        title={t(lang, "marketOverviewTitle")}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "marketOverview") },
            ]}
          />
        }
        actions={
          data.lastUpdatedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-transparent dark:border-[var(--p-hair)] bg-muted px-3 py-1 text-meta">
              <Clock className="size-3.5" aria-hidden="true" />
              {t(lang, "marketLastUpdated")} {formatRelativeAgo(data.lastUpdatedAt, lang)}
            </span>
          ) : undefined
        }
      />

      {/* Unified market snapshot (hero + 3 secondary stats) */}
      <MarketSnapshot
        totalValue={data.totalValue}
        weightedDelta7d={data.weightedDelta7d}
        movers={data.movers}
        avgPrice={data.avgPrice}
        totalCards={data.totalCards}
        setCount={data.setCount}
        lang={lang}
      />

      {/* Most valuable cards */}
      {data.topCards.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            title={t(lang, "mostValuableCards")}
            caption={t(lang, "mostValuableCardsCaption")}
            href="/?sort=price_desc"
            ctaLabel={t(lang, "marketViewAllCards")}
            hint={
              <>
                <RawValueHint lang={lang} />
                <PeriodChip lang={lang} />
              </>
            }
          />
          {/* Mobile: horizontal scroller. Desktop: grid */}
          <div className="-mx-5 sm:mx-0">
            <div className="scroll-fade-x flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-1 sm:hidden">
              {data.topCards.map((card, i) => (
                <div
                  key={card.cardCode}
                  className="w-[40vw] max-w-[160px] shrink-0 snap-start"
                >
                  <TopCardTile card={card} rank={i + 1} lang={lang} />
                </div>
              ))}
            </div>
            <div className="hidden grid-cols-3 gap-2 sm:grid lg:grid-cols-6">
              {data.topCards.map((card, i) => (
                <TopCardTile key={card.cardCode} card={card} rank={i + 1} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Rarity + Top sets */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RarityBreakdown
          rows={data.rarityBreakdown}
          totalValue={data.totalValue}
          lang={lang}
        />

        {/* Top sets by value */}
        <Surface variant="panel" padding="none" className="overflow-hidden">
          <div className="flex items-end justify-between gap-3 border-b border-[var(--p-hair)] px-5 py-3.5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-h4">{t(lang, "topSetsByValue")}</h2>
                <RawValueHint lang={lang} />
                <PeriodChip lang={lang} />
              </div>
              <p className="text-meta">{t(lang, "topSetsByValueCaption")}</p>
            </div>
            <Link
              href="/sets"
              className="inline-flex shrink-0 items-center gap-1 text-meta transition-colors ease-chrome hover:text-primary"
            >
              {t(lang, "marketViewAllSets")}
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--p-hair)]">
            {data.topSetsByValue.map((s, i) => {
              const barWidth = (s.totalValue / maxSetValue) * 100
              return (
                <Link
                  key={s.code}
                  href={`/sets/${s.code.toLowerCase()}`}
                  className="group flex items-center gap-3 px-5 py-3 transition-colors ease-chrome hover:bg-muted/70"
                >
                  <span className="w-5 shrink-0 text-center font-price text-meta tabular-nums">
                    {i + 1}
                  </span>
                  {s.boxImageUrl ? (
                    <div className="relative size-11 shrink-0 overflow-hidden rounded bg-muted">
                      <Image
                        src={s.boxImageUrl}
                        alt={s.name}
                        fill
                        className="object-contain"
                        sizes="44px"
                      />
                    </div>
                  ) : (
                    <div className="flex size-11 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground/40">
                      <Package className="size-4" aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight group-hover:text-primary">
                      <span className="font-mono text-meta">{s.code.toUpperCase()}</span>{" "}
                      <span className="truncate">{s.name}</span>
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/50 motion-base"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <DeltaPill delta={s.change7d} size="sm" period="7d" />
                    </div>
                  </div>
                  <div className="w-28 shrink-0 text-right">
                    <p className="whitespace-nowrap font-price text-sm font-semibold tabular-nums">
                      <Price jpy={s.totalValue} />
                    </p>
                    <p className="whitespace-nowrap text-meta tabular-nums">
                      {formatCount(s.cardCount)} {t(lang, "cardUnit")}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </Surface>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({
  title,
  caption,
  href,
  ctaLabel,
  hint,
}: {
  title: string
  caption?: string
  href: string
  ctaLabel: string
  hint?: React.ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <h2 className="text-h3">{title}</h2>
          {hint}
        </div>
        {caption && <p className="text-meta">{caption}</p>}
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 text-meta transition-colors ease-chrome hover:text-primary"
      >
        {ctaLabel}
        <ArrowRight className="size-3" aria-hidden="true" />
      </Link>
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
    <Surface
      as={Link}
      variant="panel"
      interactive
      href={`/cards/${card.cardCode}`}
      className="group flex flex-col overflow-hidden transition-colors ease-chrome"
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
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <div className="flex items-baseline gap-1.5">
          <span className="shrink-0 font-mono text-meta tabular-nums">#{rank}</span>
          <p className="line-clamp-1 text-xs font-medium leading-tight">{name}</p>
        </div>
        <div className="flex items-center gap-1">
          <RarityBadge rarity={card.rarity} size="sm" />
          <span className="font-mono text-meta">{card.setCode.toUpperCase()}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-1.5">
          <p className="font-price text-xs font-bold">
            <Price jpy={card.latestPriceJpy} />
          </p>
          {card.priceChange7d != null && (
            <DeltaPill delta={card.priceChange7d} size="sm" period="7d" />
          )}
        </div>
      </div>
    </Surface>
  )
}
