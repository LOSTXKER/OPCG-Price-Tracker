"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import type { CardListing } from "@/components/cards/card-listings-section"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { AdSlot } from "@/components/ads/ad-slot"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { t, getCardName, getSetName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

import { WatchlistStar } from "@/components/shared/watchlist-star"
import { CardDetailActions } from "./card-detail/actions"
import { CardDetailStickyBar } from "./card-detail/sticky-bar"
import { CardPriceHub } from "./card-detail/price-hub"
import { CardDetailInfoTabs } from "./card-detail/info-tabs"
import { buildGradeData, defaultGradeKey, type GradeKey } from "./card-detail/grades"
import { EditionToggle, type Edition } from "./card-detail/edition-toggle"
import { SiblingGrid } from "./card-detail-sibling-grid"
import { CardDetailRelated } from "./card-detail-related"

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

      <div className="lg:grid lg:grid-cols-[340px_1fr] lg:items-start lg:gap-10">
        {/* LEFT — identity + image + edition + CTA (sticky on desktop) — proto-exact */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <section className="px-5 pb-2 pt-3 lg:px-0">
            <div className="mx-auto w-[58%] max-w-[230px] lg:w-full lg:max-w-none">
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

            <div className="mt-4 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}
                >
                  {card.rarity}
                </span>
                {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-2 lg:justify-start">
                <h1 className="min-w-0 break-words text-2xl font-extrabold tracking-tight text-foreground">
                  {displayName}
                </h1>
                <WatchlistStar cardId={card.id} size="md" />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {set.code.toUpperCase()} · {setName}
              </p>
            </div>

            <div className="mt-4 flex justify-center lg:justify-start">
              <EditionToggle value={edition} onChange={setEdition} enAvailable={false} />
            </div>
          </section>

          <div className="mt-5 flex justify-center lg:justify-start">
            <CardDetailActions
              cardId={card.id}
              cardCode={card.cardCode}
              displayName={displayName}
              rarity={card.rarity}
              imageUrl={card.imageUrl}
              currentPriceJpy={card.price?.priceJpy ?? card.latestPriceJpy}
            />
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

        {/* RIGHT — price + chart, then info tabs */}
        <div className="mt-6 space-y-5 lg:mt-0 lg:min-w-0">
          <CardPriceHub
            card={card}
            gradeData={gradeData}
            selectedGrade={selectedGrade}
            onSelectGrade={setSelectedGrade}
            lang={lang}
          />

          {/* In-feed ad (FREE users only) */}
          <AdSlot placement="card-detail-mid" className="aspect-[6/1] w-full" />

          <CardDetailInfoTabs
            card={card}
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

      <CardDetailStickyBar
        cardId={card.id}
        cardName={displayName}
        datum={gradeData[selectedGrade]}
        gradeLabel={gradeData[selectedGrade].tier.label}
        lang={lang}
      />
    </div>
  )
}
