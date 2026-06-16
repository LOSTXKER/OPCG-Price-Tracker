"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { buildGradeData, defaultGradeKey, type GradeKey } from "@/components/cards/card-detail/grades"
import { CardPriceHeader } from "@/components/cards/card-detail/price-header"
import { GradeSelect } from "@/components/cards/card-detail/grade-select"
import { CardChart } from "@/components/cards/card-detail/card-chart"
import { CardBuySell } from "@/components/cards/card-detail/buy-sell"
import { CardDetailActions } from "@/components/cards/card-detail/actions"
import { CardTierMeta } from "@/components/cards/card-detail/tier-meta"
import { CardDetailInfoTabs } from "@/components/cards/card-detail/info-tabs"
import { type Edition } from "@/components/cards/card-detail/edition-toggle"
import { CardDetailSpecs } from "@/components/cards/card-detail-specs"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import { useUIStore } from "@/stores/ui-store"
import { jpyToDisplayValue, usdToDisplayValue } from "@/lib/utils/currency"
import { CARD, ASKS } from "../_components/mock"
import { OwnershipPanel, MeecardAsksRail } from "../_components/collectr-bits"

const UPDATED_AT = "2026-06-10T00:00:00.000Z"

const card = {
  id: 0,
  cardCode: "OP13-118_p3",
  baseCode: "OP13-118",
  cardType: "LEADER",
  color: "RED",
  colorEn: "Red",
  rarity: "SEC",
  isParallel: true,
  cost: null as number | null,
  power: 5000,
  counter: null as number | null,
  life: 5,
  attribute: "Strike",
  trait: "Straw Hat Crew / The Four Emperors",
  imageUrl: CARD.art,
}

/**
 * PROTO — 3-column (Collectr-style structure, our minimal voice).
 * image (left) · all market data (center) · your-holdings + shop (right).
 * The portfolio + shop earn their own rail so they're always in view while you
 * scroll the data, instead of being stacked under the image (card-trade-c).
 */
export default function CardThreeColProto() {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const gradeData = useMemo(
    () =>
      buildGradeData({
        rawAnchorJpy: 430000,
        rawAnchorThb: 90300,
        psa10AskUsd: 15600,
        psa10SoldUsd: 15200,
        rawLastSoldUsd: 14800,
        rawDelta30d: 8.4,
      }),
    [],
  )
  const [selectedGrade, setSelectedGrade] = useState<GradeKey>(() => defaultGradeKey(gradeData))
  const [edition, setEdition] = useState<Edition>("JP")

  const displayName = "Monkey D. Luffy"
  const sub = `${card.baseCode} · Parallel`
  const datum = gradeData[selectedGrade]
  const unitValue =
    datum.value.usd != null
      ? usdToDisplayValue(datum.value.usd, currency)
      : datum.value.jpy != null
        ? jpyToDisplayValue(datum.value.jpy, currency)
        : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-eyebrow">PROTO · 3 คอลัมน์ (Collectr-style)</p>
        <Link href="/cards/OP13-118_p3" className="text-meta inline-flex items-center gap-1 hover:text-foreground">
          เทียบหน้าจริง <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      {/* identity — full width */}
      <div className="mb-6 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}
          >
            {card.rarity}
          </span>
          <span className="text-xs text-muted-foreground">{sub}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <h1 className="min-w-0 break-words text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
            {displayName}
          </h1>
          <WatchlistStar cardId={card.id} size="md" />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[240px_1fr_300px] lg:items-start lg:gap-7">
        {/* LEFT — image + trade + utilities */}
        <div className="lg:sticky lg:top-6">
          <div className="mx-auto w-[58%] max-w-[230px] lg:w-full lg:max-w-none">
            <div
              className="relative aspect-[63/88] w-full overflow-hidden rounded-2xl hairline"
              style={{ background: "linear-gradient(150deg,#241808 0%,#3c2a12 35%,#6d4f23 62%,#e9b970 115%)" }}
            >
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background:
                    "conic-gradient(from 210deg at 30% 20%, transparent, rgba(255,255,255,0.35), transparent 30%, rgba(233,185,112,0.4), transparent 60%)",
                  mixBlendMode: "overlay",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{card.baseCode}</p>
                <p className="text-sm font-extrabold leading-tight text-white">{displayName}</p>
              </div>
              <span className="absolute right-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                {card.rarity}
              </span>
            </div>
          </div>
          <div className="mt-5 space-y-4 px-5 lg:px-0">
            <CardBuySell lang={lang} />
            <div className="flex justify-center lg:justify-start">
              <CardDetailActions
                cardId={card.id}
                cardCode={card.cardCode}
                displayName={displayName}
                rarity={card.rarity}
                imageUrl={card.imageUrl}
                currentPriceJpy={430000}
                lang={lang}
              />
            </div>
          </div>
        </div>

        {/* CENTER — all market data */}
        <div className="mt-8 space-y-5 lg:mt-0 lg:min-w-0">
          <div className="space-y-2.5">
            <GradeSelect gradeData={gradeData} selectedGrade={selectedGrade} onSelectGrade={setSelectedGrade} lang={lang} />
            <CardPriceHeader
              gradeData={gradeData}
              selectedGrade={selectedGrade}
              edition={edition}
              onEditionChange={setEdition}
              enAvailable={false}
              lang={lang}
            />
          </div>
          <CardChart
            gradeData={gradeData}
            selectedGrade={selectedGrade}
            latestUpdatedAt={UPDATED_AT}
            lang={lang}
          />
          <CardDetailInfoTabs
            cardCode={card.cardCode}
            cardName={displayName}
            listings={[]}
            compBase={datum.value.jpy ?? datum.value.usd}
            gradeLabel={datum.tier.label}
            currency={datum.currency}
            latestUpdatedAt={UPDATED_AT}
            tabs={["comps", "population"]}
            lang={lang}
          />
        </div>

        {/* RIGHT — your holdings + shop (their own rail) */}
        <div className="mt-8 space-y-4 lg:mt-0 lg:sticky lg:top-6">
          <OwnershipPanel selectedGradeLabel={datum.tier.label} selectedValue={unitValue} currency={currency} />
          <MeecardAsksRail cardCode={card.cardCode} asks={ASKS} currency={currency} lang={lang} />
        </div>
      </div>

      {/* card detail — full width below the decision zone (specs gets room, not
          squeezed into the narrow center column) */}
      <div className="mt-10 lg:grid lg:grid-cols-3 lg:gap-x-12">
        <div className="lg:col-span-2">
          <CardDetailSpecs card={card} lang={lang} />
        </div>
        <div className="mt-5 lg:mt-0">
          <CardTierMeta lang={lang} />
        </div>
      </div>
    </div>
  )
}
