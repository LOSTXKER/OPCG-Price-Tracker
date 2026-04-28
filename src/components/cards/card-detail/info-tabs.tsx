"use client"

import {
  CardListingsSection,
  type CardListing,
} from "@/components/cards/card-listings-section"
import { CardDetailSpecs } from "@/components/cards/card-detail-specs"
import { CardEffectText } from "@/components/cards/card-effect-text"
import { getCardEffect, t, type Language } from "@/lib/i18n"

/**
 * Stacked info sections (specs / effect / listings) shown below the price hub.
 * Tabs were removed in favour of a straight vertical scroll — buyers / collectors
 * scan top→bottom without needing to remember which tab held what.
 */
export function CardDetailInfoTabs({
  card,
  cardCode,
  cardName,
  listings,
  lang,
}: {
  card: {
    cardType: string
    color: string
    colorEn?: string | null
    cost?: number | null
    power?: number | null
    counter?: number | null
    life?: number | null
    attribute?: string | null
    trait?: string | null
    effectJp?: string | null
    effectEn?: string | null
    effectTh?: string | null
  }
  cardCode: string
  cardName: string
  listings: CardListing[]
  lang: Language
}) {
  const effectText = getCardEffect(lang, card)
  const hasEffect = !!effectText && effectText.trim().length > 0

  return (
    <div className="space-y-5">
      <CardDetailSpecs card={card} lang={lang} />

      {hasEffect && effectText && (
        <div className="panel p-5">
          <p className="mb-3 text-meta">{t(lang, "effect")}</p>
          <CardEffectText text={effectText} />
        </div>
      )}

      <CardListingsSection
        cardCode={cardCode}
        cardName={cardName}
        listings={listings}
      />
    </div>
  )
}
