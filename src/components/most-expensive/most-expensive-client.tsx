"use client"

import Image from "next/image"
import Link from "next/link"

import { Breadcrumb } from "@/components/shared/breadcrumb"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Surface } from "@/components/ui/surface"
import { useUIStore } from "@/stores/ui-store"
import { getCardName, t, type Currency, type Language } from "@/lib/i18n"
import { formatJpyAmount } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import type { MostExpensiveCard, MostExpensiveData } from "@/lib/data/most-expensive"
import {
  mostExpensiveIntro,
  mostExpensiveSectionHeadings,
  mostExpensiveSubtitle,
  mostExpensiveTableLabels,
  mostExpensiveTitle,
} from "@/lib/seo/copy/most-expensive"

/**
 * Prices follow the visitor's display-currency preference (sitewide contract —
 * see display-currency-boundary.test.ts). The server render uses the store's
 * THB default, which is also what a crawler sees.
 */
function priceLabel(jpy: number, currency: Currency): string {
  return formatJpyAmount(jpy, currency)
}

function ChangeCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-meta">—</span>
  const up = value > 0
  const down = value < 0
  return (
    <span
      className={cn(
        "text-code tabular-nums",
        up && "text-success",
        down && "text-danger",
        !up && !down && "text-muted-foreground"
      )}
    >
      {up ? "▲" : down ? "▼" : ""} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function CardCell({ card, lang }: { card: MostExpensiveCard; lang: Language }) {
  const name = getCardName(lang, card)
  return (
    <Link
      href={`/opcg/cards/${card.cardCode}`}
      className="flex min-w-0 items-center gap-3 hover:text-primary"
    >
      <span className="relative block h-14 w-10 shrink-0 overflow-hidden rounded-sm bg-muted">
        {card.imageUrl && (
          <Image
            src={card.imageUrl}
            alt={name}
            fill
            sizes="40px"
            className="object-cover"
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-h5">{name}</span>
        <span className="block text-code text-meta">{card.cardCode}</span>
      </span>
    </Link>
  )
}

export function MostExpensiveClient({
  data,
  introData,
}: {
  data: MostExpensiveData
  /** Pre-computed on the server so the copy interpolates a stable date string. */
  introData: { updatedLabel: string | null }
}) {
  const lang = useUIStore((state) => state.language)
  const currency = useUIStore((state) => state.currency)
  const labels = mostExpensiveTableLabels(lang)
  const headings = mostExpensiveSectionHeadings(lang)
  const top = data.cards[0]

  const paragraphs = top
    ? mostExpensiveIntro(lang, {
        rankedCount: data.cards.length,
        pricedCardCount: data.pricedCardCount,
        totalCardCount: data.totalCardCount,
        setCount: data.setCount,
        topName: getCardName(lang, top),
        topCode: top.cardCode,
        topPriceJpy: top.priceJpy,
        updatedLabel: introData.updatedLabel,
      })
    : []

  return (
    <div className="space-y-10">
      <div>
        <Breadcrumb
          items={[
            { label: t(lang, "home"), href: "/" },
            { label: mostExpensiveTitle(lang) },
          ]}
        />
        <PageHeader
          title={mostExpensiveTitle(lang)}
          description={mostExpensiveSubtitle(lang, data.cards.length)}
        />
      </div>

      {paragraphs.length > 0 && (
        <Surface variant="outline" className="space-y-3 p-5">
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="text-body leading-relaxed">
              {paragraph}
            </p>
          ))}
        </Surface>
      )}

      <section className="space-y-4">
        <h2 className="text-h3">{headings.ranking}</h2>

        {data.cards.length === 0 ? (
          <Surface variant="outline" className="p-6">
            <p className="text-body-sm text-muted-foreground">{labels.empty}</p>
          </Surface>
        ) : (
          <>
            {/* Dense table from sm up; list fallback below it (AGENTS.md). */}
            <Surface variant="outline" className="hidden overflow-hidden sm:block">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-hair">
                    <th className="w-14 px-4 py-3 text-left text-eyebrow">{labels.rank}</th>
                    <th className="px-4 py-3 text-left text-eyebrow">{labels.card}</th>
                    <th className="w-28 px-4 py-3 text-left text-eyebrow">{labels.set}</th>
                    <th className="w-28 px-4 py-3 text-left text-eyebrow">{labels.rarity}</th>
                    <th className="w-40 px-4 py-3 text-right text-eyebrow">{labels.price}</th>
                    <th className="w-32 px-4 py-3 text-right text-eyebrow">
                      {labels.change30d}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hair">
                  {data.cards.map((card, i) => {
                    const price = priceLabel(card.priceJpy, currency)
                    return (
                      <tr key={card.cardCode} className="hover:bg-muted/40">
                        <td className="px-4 py-3 text-code text-muted-foreground">{i + 1}</td>
                        <td className="min-w-0 px-4 py-3">
                          <CardCell card={card} lang={lang} />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/opcg/sets/${card.set.code}`}
                            className="text-body-sm hover:text-primary"
                          >
                            {card.set.code.toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <RarityBadge rarity={card.rarity} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="block text-code tabular-nums">{price}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ChangeCell value={card.priceChange30d} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Surface>

            <Surface variant="outline" className="divide-y divide-hair overflow-hidden sm:hidden">
              {data.cards.map((card, i) => {
                const price = priceLabel(card.priceJpy, currency)
                return (
                  <div key={card.cardCode} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-5 shrink-0 text-code text-muted-foreground">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <CardCell card={card} lang={lang} />
                      <div className="mt-1 flex items-center gap-2">
                        <RarityBadge rarity={card.rarity} size="sm" />
                        <Link
                          href={`/opcg/sets/${card.set.code}`}
                          className="text-meta hover:text-primary"
                        >
                          {card.set.code.toUpperCase()}
                        </Link>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block text-code tabular-nums">{price}</span>
                      <ChangeCell value={card.priceChange30d} />
                    </div>
                  </div>
                )
              })}
            </Surface>
          </>
        )}
      </section>

      {data.topByRarity.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-h3">{headings.byRarity}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.topByRarity.map(({ rarity, card }) => {
              const price = priceLabel(card.priceJpy, currency)
              return (
                <Surface
                  as={Link}
                  key={rarity}
                  href={`/opcg/cards/${card.cardCode}`}
                  variant="outline"
                  interactive
                  className="flex flex-col gap-1 p-4"
                >
                  <RarityBadge rarity={rarity} size="sm" className="self-start" />
                  <span className="mt-1 truncate text-h5">{getCardName(lang, card)}</span>
                  <span className="text-code text-meta">{card.cardCode}</span>
                  <span className="text-code tabular-nums">{price}</span>
                </Surface>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
