"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock, Layers, Package } from "lucide-react"
import type { ReactNode } from "react"

import { Breadcrumb } from "@/components/shared/breadcrumb"
import { PageHeader } from "@/components/layout/page-header"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { SectionHead } from "@/components/shared/section-head"
import { ListRow } from "@/components/ui/list-row"
import { PriceTag } from "@/components/ui/price-tag"
import { Surface } from "@/components/ui/surface"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { useUIStore } from "@/stores/ui-store"
import { getCardName, t, type Language } from "@/lib/i18n"
import { buildMarketOverviewHeading } from "@/lib/seo/copy/tools"
import { formatRelativeAgo } from "@/lib/utils/relative-time"
import { formatCount } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"

import { MarketSnapshot } from "./_components/hero-market-card"
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

  const topSets = data.topSetsByValue.slice(0, 6)
  const maxSetValue = Math.max(...topSets.map((s) => s.totalValue), 1)

  return (
    <div className="space-y-10">
      <PageHeader
        title={buildMarketOverviewHeading(lang)}
        description={t(lang, "marketOverviewSubtitle")}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "marketOverview") },
            ]}
          />
        }
        badge={
          data.lastUpdatedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-muted/60 px-2.5 py-1 text-meta dark:border-hair">
              <Clock className="size-3.5" aria-hidden="true" />
              {t(lang, "marketLastUpdated")} {formatRelativeAgo(data.lastUpdatedAt, lang)}
            </span>
          ) : undefined
        }
      >
        <div className="mt-2 flex flex-wrap items-center gap-2 text-meta">
          <span className="text-code text-foreground">Raw</span>
          <RawValueHint lang={lang} />
          <span aria-hidden="true">·</span>
          <PeriodChip lang={lang} />
        </div>
      </PageHeader>

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
        <section data-slot="market-top-cards">
          <MarketSectionHead
            title={t(lang, "mostValuableCards")}
            caption={t(lang, "mostValuableCardsCaption")}
            action={
              <SectionAction href="/" label={t(lang, "marketViewAllCards")} />
            }
          />
          {/* Mobile and tablet: keep the compact rail. A 3×2 grid at 640–768px
              pushed the analytical panels down by almost two viewports. */}
          <div className="-mx-5 md:-mx-6 lg:mx-0">
            <div
              className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-1 md:px-6 lg:hidden"
              data-slot="market-top-cards-rail"
            >
              {data.topCards.map((card, i) => (
                <div
                  key={card.cardCode}
                  className="w-[42vw] max-w-[170px] shrink-0 snap-start sm:w-[28vw] sm:max-w-[190px]"
                >
                  <TopCardTile card={card} rank={i + 1} lang={lang} />
                </div>
              ))}
            </div>
            <div
              className="hidden grid-cols-6 gap-2 lg:grid"
              data-slot="market-top-cards-grid"
            >
              {data.topCards.map((card, i) => (
                <TopCardTile key={card.cardCode} card={card} rank={i + 1} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Rarity + Top sets */}
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <section className="min-w-0" data-slot="market-rarity">
          <MarketSectionHead
            title={t(lang, "valueByRarity")}
            caption={t(lang, "valueByRarityCaption")}
          />
          <RarityBreakdown
            rows={data.rarityBreakdown}
            totalValue={data.totalValue}
            lang={lang}
          />
        </section>

        {/* Top sets by value */}
        <section className="min-w-0" data-slot="market-top-sets">
          <MarketSectionHead
            title={t(lang, "topSetsByValue")}
            caption={t(lang, "topSetsByValueCaption")}
            action={
              <SectionAction
                href="/opcg/sets"
                label={t(lang, "marketViewAllSets")}
              />
            }
          />
          <Surface variant="panel" padding="none" className="overflow-hidden">
            <div className="divide-y divide-hair sm:hidden">
              {topSets.map((set, index) => (
                <div key={set.code} data-slot="market-top-set-mobile-row">
                  <TopSetMobileRow
                    set={set}
                    rank={index + 1}
                    lang={lang}
                  />
                </div>
              ))}
            </div>
            <div className="hidden divide-y divide-hair sm:block">
              {topSets.map((s, i) => {
                const barWidth = (s.totalValue / maxSetValue) * 100
                return (
                  <Link
                    key={s.code}
                    href={`/opcg/sets/${s.code.toLowerCase()}`}
                    className="group flex items-center gap-3 px-5 py-3 transition-colors ease-chrome hover:bg-muted/70"
                    data-slot="market-top-set-row"
                  >
                    <span className="w-5 shrink-0 text-center font-price text-meta tabular-nums">
                      {i + 1}
                    </span>
                    <SetArtwork set={s} />
                    <div className="min-w-0 flex-1">
                      <p className="flex min-w-0 items-baseline gap-1.5 text-sm font-medium leading-tight group-hover:text-primary">
                        <span className="shrink-0 text-code text-muted-foreground">
                          {s.code.toUpperCase()}
                        </span>
                        <span className="min-w-0 truncate">{s.name}</span>
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/50 motion-base"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <PriceTag
                          change={s.change7d}
                          changeOnly
                          decimals={2}
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="w-28 shrink-0 text-right">
                      <PriceTag
                        jpy={s.totalValue}
                        showChange={false}
                        size="sm"
                        className="justify-end whitespace-nowrap"
                      />
                      <p className="whitespace-nowrap text-meta tabular-nums">
                        {formatCount(s.cardCount)} {t(lang, "cardUnit")}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Surface>
        </section>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section heading                                                    */
/* ------------------------------------------------------------------ */

function MarketSectionHead({
  title,
  caption,
  action,
}: {
  title: string
  caption: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3">
      <SectionHead title={title} action={action} />
      <p className="-mt-3 text-meta">{caption}</p>
    </div>
  )
}

function SectionAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 shrink-0 items-center gap-1 text-meta transition-colors ease-chrome hover:text-primary"
    >
      {label}
      <ArrowRight className="size-3" aria-hidden="true" />
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Top set rows                                                       */
/* ------------------------------------------------------------------ */

function TopSetMobileRow({
  set,
  rank,
  lang,
}: {
  set: TopSet
  rank: number
  lang: Language
}) {
  return (
    <ListRow
      href={`/opcg/sets/${set.code.toLowerCase()}`}
      className="px-4"
      ariaLabel={`${rank}. ${set.code.toUpperCase()} ${set.name}`}
      leading={
        <div className="flex items-center gap-2">
          <span className="w-4 text-center text-code text-muted-foreground tabular-nums">
            {rank}
          </span>
          <SetArtwork set={set} compact />
        </div>
      }
      title={
        <>
          <span className="text-code text-muted-foreground">
            {set.code.toUpperCase()}
          </span>{" "}
          {set.name}
        </>
      }
      subtitle={
        <>
          <PriceTag
            change={set.change7d}
            changeOnly
            decimals={2}
            size="sm"
            className="shrink-0"
          />
          <span className="min-w-0 truncate tabular-nums">
            {formatCount(set.cardCount)} {t(lang, "cardUnit")}
          </span>
        </>
      }
      trailing={
        <PriceTag
          jpy={set.totalValue}
          showChange={false}
          size="sm"
          className="justify-end whitespace-nowrap"
        />
      }
    />
  )
}

function SetArtwork({ set, compact = false }: { set: TopSet; compact?: boolean }) {
  const sizeClass = compact ? "size-10" : "size-11"

  if (set.boxImageUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-sm bg-muted",
          sizeClass,
        )}
      >
        <Image
          src={set.boxImageUrl}
          alt=""
          fill
          className="object-contain"
          sizes={compact ? "40px" : "44px"}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground/40",
        sizeClass,
      )}
      aria-hidden="true"
    >
      <Package className="size-4" />
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
      href={`/opcg/cards/${card.cardCode}`}
      className="group flex flex-col overflow-hidden transition-colors ease-chrome"
      data-slot="market-top-card"
    >
      <div className="relative aspect-[63/88] w-full overflow-hidden bg-muted/30">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={name}
            fill
            className="object-contain transition-transform duration-[var(--dur-slow)] group-hover:scale-105"
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
          <span className="text-code text-muted-foreground">
            {card.setCode.toUpperCase()}
          </span>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-1">
          <PriceTag
            jpy={card.latestPriceJpy}
            showChange={false}
            size="sm"
            className="whitespace-nowrap [&>span]:text-xs [&>span]:font-bold"
          />
          {card.priceChange7d != null && (
            <PriceTag
              change={card.priceChange7d}
              changeOnly
              decimals={2}
              size="sm"
            />
          )}
        </div>
      </div>
    </Surface>
  )
}
