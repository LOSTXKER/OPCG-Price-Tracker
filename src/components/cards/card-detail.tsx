"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import type { CardListing } from "@/components/cards/card-listings-section"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { AdSlot } from "@/components/ads/ad-slot"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { t, getCardName, getSetName, getCardEffect } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

import { WatchlistStar } from "@/components/shared/watchlist-star"
import { CardDetailActions } from "./card-detail/actions"
import { CardPriceHeader } from "./card-detail/price-header"
import { CardChart } from "./card-detail/card-chart"
import { CardGradeSummary } from "./card-detail/grade-summary"
import { CardBuySell } from "./card-detail/buy-sell"
import { CardTierMeta } from "./card-detail/tier-meta"
import { CardDetailInfoTabs } from "./card-detail/info-tabs"
import { buildGradeData, defaultGradeKey, type GradeKey } from "./card-detail/grades"
import { type Edition } from "./card-detail/edition-toggle"
import { SiblingGrid } from "./card-detail-sibling-grid"
import { CardDetailRelated } from "./card-detail-related"
import { CardDetailSpecs } from "./card-detail-specs"
import { CardEffectText } from "./card-effect-text"

export interface SiblingCard {
  id: number
  cardCode: string
  nameJp: string
  nameEn: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
  set: { code: string }
}

export interface RelatedCard {
  id: number
  cardCode: string
  nameJp: string
  nameEn: string | null
  nameTh?: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
  set: { code: string }
}

export interface CardDetailProps {
  card: {
    id: number
    cardCode: string
    baseCode: string | null
    nameJp: string
    nameEn?: string | null
    nameTh?: string | null
    cardType: string
    color: string
    colorEn?: string | null
    rarity: string
    isParallel: boolean
    cost?: number | null
    power?: number | null
    counter?: number | null
    life?: number | null
    attribute?: string | null
    trait?: string | null
    effectJp?: string | null
    effectEn?: string | null
    effectTh?: string | null
    viewCount: number
    imageUrl: string | null
    latestPriceJpy: number | null
    latestPriceThb: number | null
    priceChange24h: number | null
    priceChange7d: number | null
    priceChange30d: number | null
    set: { code: string; name: string; nameEn?: string | null; nameTh?: string | null }
    price: { priceJpy: number; priceThb: number | null; inStock: boolean } | null
    chartData: { scrapedAt: string; priceJpy: number | null; priceThb: number | null; priceUsd: number | null; source?: string; gradeCondition?: string | null; type?: string | null }[]
  }
  siblings: SiblingCard[]
  communityPrice?: { avgThb: number | null; reportCount: number } | null
  relatedCards?: RelatedCard[]
  snkrdunkPrices?: {
    minPriceUsd: number | null
    psa10AskUsd: number | null
    psa10SoldUsd: number | null
    lastSoldUsd: number | null
  } | null
  availableSources?: { id: string; label: string; source?: string; grade?: string; currency: "JPY" | "USD" }[]
  sourcePricesRaw?: { source: string; askPriceJpy: number | null; askPriceThb: number | null; askPriceUsd: number | null; soldPriceJpy: number | null; soldPriceThb: number | null; soldPriceUsd: number | null; updatedAt: string | null }[]
  sourcePricesPsa10?: { source: string; askPriceJpy: number | null; askPriceThb: number | null; askPriceUsd: number | null; soldPriceJpy: number | null; soldPriceThb: number | null; soldPriceUsd: number | null; updatedAt: string | null }[]
  /** ISO timestamp of the most recent price observation across all sources. */
  latestUpdatedAt?: string | null
  /**
   * Days since `latestUpdatedAt` — pre-computed on the server because the
   * React 19 purity rule forbids `Date.now()` during render.
   */
  daysSinceUpdate?: number | null
  /** Active marketplace listings for this card (passed from server). */
  listings?: CardListing[]
}

export function CardDetail({
  card,
  siblings,
  communityPrice: _communityPrice,
  relatedCards,
  snkrdunkPrices,
  latestUpdatedAt,
  listings,
}: CardDetailProps) {
  const lang = useUIStore((s) => s.language)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Per-grade pricing (VISION §5.1). Real anchors (Yuyutei raw / SNKRDUNK PSA 10)
  // drive the rail; other grades come back as labeled estimates or ghosted.
  const gradeData = useMemo(
    () =>
      buildGradeData({
        rawAnchorJpy: card.price?.priceJpy ?? card.latestPriceJpy,
        rawAnchorThb: card.price?.priceThb ?? card.latestPriceThb,
        psa10AskUsd: snkrdunkPrices?.psa10AskUsd ?? null,
        psa10SoldUsd: snkrdunkPrices?.psa10SoldUsd ?? null,
        rawLastSoldUsd: snkrdunkPrices?.lastSoldUsd ?? null,
        rawDelta30d: card.priceChange30d,
      }),
    [card.price, card.latestPriceJpy, card.latestPriceThb, card.priceChange30d, snkrdunkPrices],
  )
  const [selectedGrade, setSelectedGrade] = useState<GradeKey>(() => defaultGradeKey(gradeData))
  const [edition, setEdition] = useState<Edition>("JP")
  const set = card.set
  const displayName = getCardName(lang, card)
  const setName = getSetName(lang, set)
  const sub = [card.cardType, card.isParallel ? "Parallel" : null].filter(Boolean).join(" · ")
  const effectText = getCardEffect(lang, card)
  // Spec sheet — rendered beside the image on desktop (left column), but dropped
  // below the price on mobile so the price stays the first thing seen on a phone.
  const specsBlock = (
    <>
      <CardDetailSpecs card={card} lang={lang} />
      {effectText?.trim() && (
        <div className="surface-1 hairline mt-3 rounded-2xl p-5">
          <p className="text-meta mb-3">{t(lang, "effect")}</p>
          <CardEffectText text={effectText} />
        </div>
      )}
    </>
  )

  return (
    <div className="relative mx-auto max-w-5xl space-y-6">
      {/* warm hero ambient — anchored to the top so the honey glow bleeds down
          from the navbar instead of floating behind the card (VISION §1) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[360px] w-screen -translate-x-1/2 -translate-y-10 md:-translate-y-12"
        style={{ background: "radial-gradient(120% 80% at 50% 0%, var(--p-honey-soft), transparent 65%)" }}
      />
      <Breadcrumb
        items={[
          { label: t(lang, "home"), href: "/" },
          { label: t(lang, "sets"), href: "/sets" },
          { label: setName, href: `/sets/${set.code}` },
          { label: card.baseCode ?? card.cardCode },
        ]}
      />

      {/* header — card identity (left) · utility actions (right). Stacks on mobile. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
              style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}
            >
              {card.rarity}
            </span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <h1 className="min-w-0 break-words text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
              {displayName}
            </h1>
            <WatchlistStar cardId={card.id} size="md" />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {set.code.toUpperCase()} · {setName}
          </p>
          {/* price + grade selector — the single top focal point; grade sits
              right under the price (picked often → result is adjacent). */}
          <div className="mt-3">
            <CardPriceHeader
              gradeData={gradeData}
              selectedGrade={selectedGrade}
              onSelectGrade={setSelectedGrade}
              edition={edition}
              onEditionChange={setEdition}
              enAvailable={false}
              lang={lang}
            />
          </div>
        </div>
        <div className="shrink-0">
          <CardDetailActions
            cardId={card.id}
            cardCode={card.cardCode}
            displayName={displayName}
            rarity={card.rarity}
            imageUrl={card.imageUrl}
            currentPriceJpy={card.price?.priceJpy ?? card.latestPriceJpy}
          />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[340px_1fr] lg:items-start lg:gap-10">
        {/* LEFT — identity + image + edition + CTA. Scrolls with the page
            (not pinned) so it doesn't trail the screen on desktop. */}
        <div>
          <section className="px-5 pb-2 pt-3 lg:px-0">
            <div className="mx-auto w-[58%] max-w-[230px] lg:w-full lg:max-w-[280px]">
              <button
                type="button"
                onClick={() => card.imageUrl && setLightboxOpen(true)}
                className="surface-1 ease-chrome relative block aspect-[63/88] w-full cursor-zoom-in overflow-hidden rounded-2xl ring-1 ring-border hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={card.nameEn ?? card.nameJp}
              >
                {card.imageUrl ? (
                  <Image
                    src={card.imageUrl}
                    alt={card.nameEn ?? card.nameJp}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 230px, 340px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    priority
                  />
                ) : (
                  <Skeleton className="absolute inset-0 size-full" />
                )}
              </button>
            </div>
          </section>

          {/* selected-grade trade snapshot, then Buy / Sell */}
          <div className="mt-5 px-5 lg:px-0">
            <CardGradeSummary datum={gradeData[selectedGrade]} lang={lang} />
          </div>
          <div className="mt-3 px-5 lg:px-0">
            <CardBuySell datum={gradeData[selectedGrade]} lang={lang} />
          </div>

          {/* competitive meta + in-feed ad */}
          <div className="mt-5 px-5 lg:px-0">
            <CardTierMeta lang={lang} />
          </div>
          <div className="mt-5 px-5 lg:px-0">
            <AdSlot placement="card-detail-mid" className="aspect-[6/1] w-full" />
          </div>

          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-[90vw] border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-[90vw] [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:hover:bg-white/20">
              <DialogTitle className="sr-only">{card.nameEn ?? card.nameJp}</DialogTitle>
              {card.imageUrl && (
                <Image
                  src={card.imageUrl}
                  alt={card.nameEn ?? card.nameJp}
                  width={800}
                  height={1120}
                  className="mx-auto max-h-[90vh] w-auto rounded-lg object-contain"
                  priority
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* RIGHT — the chart (focal point), then market tabs */}
        <div className="mt-6 space-y-5 lg:mt-0 lg:min-w-0">
          <CardChart datum={gradeData[selectedGrade]} cardCode={card.cardCode} lang={lang} />

          <CardDetailInfoTabs
            cardCode={card.cardCode}
            cardName={displayName}
            listings={listings ?? []}
            compBase={gradeData[selectedGrade].value.jpy ?? gradeData[selectedGrade].value.usd}
            gradeLabel={gradeData[selectedGrade].tier.label}
            currency={gradeData[selectedGrade].currency}
            latestUpdatedAt={latestUpdatedAt}
            lang={lang}
          />
        </div>
      </div>

      {/* card spec sheet — its own full-width section below the trade view */}
      {specsBlock}

      {siblings.length > 0 && (
        <div>
          <p className="mb-3 text-meta">
            {t(lang, "otherVersions")} ({siblings.length})
          </p>
          <SiblingGrid
            siblings={siblings}
            lang={lang}
            cols={3}
            smCols={6}
            mainCardCode={card.cardCode}
          />
        </div>
      )}

      <CardDetailRelated relatedCards={relatedCards ?? []} set={set} lang={lang} />
    </div>
  )
}
