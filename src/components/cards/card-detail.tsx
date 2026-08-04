"use client"

import Image from "next/image"

import { Breadcrumb } from "@/components/shared/breadcrumb"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { AdInventorySlot } from "@/components/ads/ad-inventory-slot"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { MeecardAsksRail } from "./card-detail/asks-rail"
import { CardDetailBuyBox } from "./card-detail/card-detail-buy-box"
import { CardDetailChartSection } from "./card-detail/card-detail-chart-section"
import { CardDetailIdentity } from "./card-detail/card-detail-identity"
import { CardDetailPrice } from "./card-detail/card-detail-price"
import { CardDetailSectionNav } from "./card-detail/card-detail-section-nav"
import { CardPriceHistory } from "./card-detail/price-history-table"
import { CardViewTracker } from "./card-detail/card-view-tracker"
import { RecentSales } from "./card-detail/recent-sales"
import { SectionHead } from "./card-detail/section-head"
import { SiblingGrid } from "./card-detail-sibling-grid"
import { CardDetailRelated } from "./card-detail-related"
import { CardDetailSpecs } from "./card-detail-specs"
import { CardEffectText } from "./card-effect-text"
import { useCardDetailModel } from "./card-detail/use-card-detail-model"
import type { CardDetailProps } from "./card-detail/types"

export type { CardDetailProps, RelatedCard, SiblingCard } from "./card-detail/types"


export function CardDetail(props: CardDetailProps) {
  const { card, siblings, relatedCards, latestUpdatedAt, introSlot, priceHistory, soldFeed, faqSlot } = props
  const {
    hydrated,
    displayLang,
    currency,
    edition,
    setEdition,
    range,
    selectRange,
    activeIndex,
    setActiveIndex,
    lightboxOpen,
    setLightboxOpen,
    alertOpen,
    setAlertOpen,
    gradeActiveRef,
    navRef,
    tabRefs,
    activeTab,
    tabIndicator,
    scrollToSection,
    set,
    displayName,
    setName,
    effectText,
    gradeData,
    gradeDisplayValues,
    selectedGrade,
    setSelectedGrade,
    datum,
    gradeLabel,
    seriesList,
    activeValue,
    shownDelta,
    shownDate,
    priceLow,
    priceHigh,
    pricePos,
    windowLabel,
    provenance,
    tabs,
    handleShare,
    latestSale,
    meecardListings,
  } = useCardDetailModel(props)

  return (
    <div className="relative mx-auto max-w-7xl scroll-smooth pb-8">
      {/* breadcrumb row — Breadcrumb self-adapts: full trail on md+, an
          iOS-style "< [set name]" back pill on mobile. The old mobile-only
          compact meta line (set · code · rarity) was dropped — it duplicated
          the identity chips right under the card name. */}
      <div className="min-w-0">
        <Breadcrumb
          items={[
            { label: t(displayLang, "home"), href: "/" },
            { label: t(displayLang, "sets"), href: "/opcg/sets" },
            { label: setName, href: `/opcg/sets/${set.code}` },
            { label: card.baseCode ?? card.cardCode },
          ]}
        />
      </div>

      {/* ── 3-COL: hero card image (left) · identity+price+trade (center) · stats+actions (right) ── */}
      {/* Card column widened (200→220 / 240→280) so the portrait ends about
          level with the identity+price column instead of stopping a third of
          the way up it — the card is the hero of this page. Height follows the
          63/88 aspect: 280px wide ≈ 391px tall. */}
      <div className="mt-6 flex flex-col gap-y-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:items-start lg:gap-x-8 lg:gap-y-0 xl:grid-cols-[280px_minmax(0,1fr)_360px] xl:gap-x-10">
        {/* COL 1 — the card is the hero: a large portrait (tap to zoom) */}
        <div className="order-1 lg:col-start-1 lg:row-start-1">
          <button
            type="button"
            onClick={() => card.imageUrl && setLightboxOpen(true)}
            disabled={!card.imageUrl}
            className={cn(
              "surface-1 ease-chrome relative mx-auto block aspect-[63/88] w-44 overflow-hidden rounded-xl hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-52 lg:mx-0 lg:w-full",
              card.imageUrl ? "cursor-zoom-in hover:ring-2 hover:ring-primary/40" : "cursor-default",
            )}
            aria-label={displayName}
          >
            {card.imageUrl ? (
              <Image src={card.imageUrl} alt={displayName} fill className="object-contain" sizes="(min-width:1280px) 280px, (min-width:1024px) 220px, 208px" placeholder="blur" blurDataURL={BLUR_DATA_URL} preload />
            ) : (
              <Skeleton className="absolute inset-0 size-full" />
            )}
          </button>
        </div>

        {/* COL 2 — identity + price instrument (mobile order 2 · desktop center) */}
        <div id="overview" className="order-2 min-w-0 scroll-mt-[calc(var(--chrome-h)_+_4.25rem)] lg:order-none lg:col-start-2 lg:row-start-1">
          <CardDetailIdentity
            card={card}
            displayName={displayName}
            lang={displayLang}
            onAlert={() => setAlertOpen(true)}
            onShare={() => void handleShare()}
          />
          <CardDetailPrice
            hydrated={hydrated}
            lang={displayLang}
            currency={currency}
            edition={edition}
            onEditionChange={setEdition}
            range={range}
            activeIndex={activeIndex}
            gradeActiveRef={gradeActiveRef}
            gradeData={gradeData}
            gradeDisplayValues={gradeDisplayValues}
            selectedGrade={selectedGrade}
            onGradeChange={setSelectedGrade}
            activeValue={activeValue}
            shownDelta={shownDelta}
            shownDate={shownDate}
            windowLabel={windowLabel}
            priceLow={priceLow}
            priceHigh={priceHigh}
            pricePos={pricePos}
            provenance={provenance}
          />
          {/* Server-rendered Thai context, closing the price block under the
              low–high bar (owner decision). No rule above it: a divider here
              made it read as a detached slab rather than a caption to the
              price it explains. */}
          {introSlot}
        </div>

        <CardDetailBuyBox
          card={card}
          displayName={displayName}
          lang={displayLang}
          hydrated={hydrated}
          latestSale={latestSale}
          alertOpen={alertOpen}
          onAlertOpenChange={setAlertOpen}
        />
      </div>

      <CardDetailSectionNav
        lang={displayLang}
        tabs={tabs}
        activeTab={activeTab}
        indicator={tabIndicator}
        navRef={navRef}
        tabRefs={tabRefs}
        onSelect={scrollToSection}
      />

      {/* The contextual ad stays beside the chart on desktop and follows the
          chart on smaller screens. If the slot collapses, the chart remains
          the only grid item and naturally takes the full width. */}
      <div
        data-slot="card-chart-ad-layout"
        className="grid grid-cols-1 gap-x-8 gap-y-6 lg:items-start lg:gap-x-10 lg:has-data-[ad-zone=card-detail-chart-rail]:grid-cols-[minmax(0,1fr)_320px] xl:has-data-[ad-zone=card-detail-chart-rail]:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="min-w-0">
          <CardDetailChartSection
            lang={displayLang}
            currency={currency}
            hydrated={hydrated}
            latestUpdatedAt={latestUpdatedAt}
            gradeLabel={gradeLabel}
            selectedGrade={selectedGrade}
            datum={datum}
            range={range}
            onRangeChange={selectRange}
            series={seriesList}
            activeIndex={activeIndex}
            onScrub={setActiveIndex}
            activeValue={activeValue}
            shownDate={shownDate}
            windowLabel={windowLabel}
          />
        </div>
        <AdInventorySlot
          zone="card-detail-chart-rail"
          className="lg:mt-6 lg:justify-self-end"
        />
      </div>

      {/* ── below the chart — recent sales + card info on lg.
          The right rail is 320–360px and scrolls with the page; <lg stacks. ── */}
      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-x-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ROW 1 LEFT — real price history (server-rendered table, no mock feed) */}
        <section id="sources" className="min-w-0 scroll-mt-[calc(var(--chrome-h)_+_4.25rem)]">
          {/* One range control: the chart's 7D/1M/… selector governs this table
              too, so there is no second period picker on the page. The rows are
              sliced from data already sent with the page — switching range never
              refetches, and SSR (default 1M) puts the full set in the HTML. */}
          {priceHistory && (
            <CardPriceHistory
              cardCode={card.cardCode}
              history={priceHistory}
              lang={displayLang}
              range={range}
            />
          )}
          {/* Settled sales — REAL rows from the database now (CardPrice where
              type = SOLD), so the generated feed and its `data-nosnippet` guard
              are both gone. Cards no source has reported a sale for simply show
              the empty state. */}
          <div className="mt-12">
            <RecentSales
              sales={soldFeed ?? []}
              currency={currency}
              lang={displayLang}
            />
          </div>
        </section>

        {/* ROW 1 RIGHT — card info (specs + effect) */}
        <aside id="specs" className="min-w-0 scroll-mt-[calc(var(--chrome-h)_+_4.25rem)]">
          <div className="lg:pl-8">
            <SectionHead title={t(displayLang, "cardInfo")} />
            <CardDetailSpecs card={card} lang={displayLang} />
            {effectText?.trim() && (
              <div
                className="mt-4 pt-4"
                style={{ boxShadow: "inset 3px 0 0 0 color-mix(in srgb, var(--primary) 40%, transparent), inset 0 1px 0 0 var(--p-hair)" }}
              >
                <div className="pl-4">
                  <p className="text-eyebrow mb-1.5">{t(displayLang, "effect")}</p>
                  <CardEffectText text={effectText} />
                </div>
              </div>
            )}
            {/* CardTierMeta intentionally not rendered — sample-only Tier/meta share. */}
          </div>
        </aside>
      </div>

      {/* Marketplace keeps its ad adjacent on desktop and stacked below on mobile. */}
      <div
        data-slot="card-marketplace-ad-layout"
        className="mt-14 grid grid-cols-1 gap-x-8 gap-y-8 lg:items-start lg:gap-x-10 lg:has-data-[ad-zone=card-detail-marketplace-rail]:grid-cols-[minmax(0,1fr)_320px] xl:has-data-[ad-zone=card-detail-marketplace-rail]:grid-cols-[minmax(0,1fr)_360px]"
      >
        <section id="market" className="min-w-0 scroll-mt-[calc(var(--chrome-h)_+_4.25rem)]">
          <MeecardAsksRail
            cardId={card.id}
            cardCode={card.cardCode}
            cardName={displayName}
            listings={meecardListings.rows}
            currentPriceJpy={card.price?.priceJpy ?? card.latestPriceJpy}
            currency={currency}
            lang={displayLang}
          />
        </section>
        <AdInventorySlot
          zone="card-detail-marketplace-rail"
          className="lg:justify-self-end"
        />
      </div>

      {/* ── full width: other versions + other cards in the set ─────────────── */}
      {siblings.length > 0 && (
        <section id="versions" className="mt-12 scroll-mt-[calc(var(--chrome-h)_+_4.25rem)]">
          <SectionHead title={`${t(displayLang, "otherVersions")} (${siblings.length})`} />
          <SiblingGrid siblings={siblings} lang={displayLang} cols={3} smCols={6} mainCardCode={card.cardCode} />
        </section>
      )}

      <div className="mt-12">
        <CardDetailRelated relatedCards={relatedCards ?? []} set={set} lang={displayLang} />
      </div>

      {/* Server-rendered per-card FAQ (carries FAQPage JSON-LD). */}
      {faqSlot}

      <CardViewTracker cardCode={card.cardCode} />

      {/* lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[90vw] border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-[90vw] [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:hover:bg-white/20">
          <DialogTitle className="sr-only">{displayName}</DialogTitle>
          {card.imageUrl && (
            <Image src={card.imageUrl} alt={displayName} width={800} height={1120} className="mx-auto max-h-[90vh] w-auto rounded-lg object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
