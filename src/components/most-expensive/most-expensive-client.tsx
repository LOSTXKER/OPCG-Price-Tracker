"use client"

import Image from "next/image"
import Link from "next/link"

import { Breadcrumb } from "@/components/shared/breadcrumb"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { PageHeader } from "@/components/layout/page-header"
import { PriceTag } from "@/components/ui/price-tag"
import { Surface } from "@/components/ui/surface"
import { useUIStore } from "@/stores/ui-store"
import { getCardName, t, type Currency, type Language } from "@/lib/i18n"
import { formatJpyAmount } from "@/lib/utils/currency"
import type { MostExpensiveCard, MostExpensiveData } from "@/lib/data/most-expensive"
import {
  mostExpensiveIntro,
  mostExpensiveSectionHeadings,
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

/**
 * Identity cell — the same grammar as the home market rows: uncropped card
 * image (aspect 63/88, object-contain — `object-cover` beheaded every
 * portrait), name on top, PUBLIC code below (`baseCode`, never the internal
 * `_p3` variant suffix the ranking used to leak).
 */
function CardCell({ card, lang }: { card: MostExpensiveCard; lang: Language }) {
  const name = getCardName(lang, card)
  return (
    <Link
      href={`/opcg/cards/${card.cardCode}`}
      className="flex min-w-0 items-center gap-3 hover:text-primary"
    >
      <span className="hairline relative block aspect-[63/88] w-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {card.imageUrl && (
          <Image
            src={card.imageUrl}
            alt={name}
            fill
            sizes="40px"
            className="object-contain"
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium leading-tight">{name}</span>
        <span className="mt-0.5 block font-mono text-meta">
          {card.baseCode ?? card.cardCode}
        </span>
      </span>
    </Link>
  )
}

export function MostExpensiveClient({ data }: { data: MostExpensiveData }) {
  const lang = useUIStore((state) => state.language)
  const currency = useUIStore((state) => state.currency)
  const labels = mostExpensiveTableLabels(lang)
  const headings = mostExpensiveSectionHeadings(lang)
  const top = data.cards[0]

  const lead = top
    ? mostExpensiveIntro(lang, {
        rankedCount: data.cards.length,
        totalCardCount: data.totalCardCount,
        setCount: data.setCount,
        topName: getCardName(lang, top),
        topCode: top.baseCode ?? top.cardCode,
        topPriceJpy: top.priceJpy,
      })
    : undefined

  return (
    <div className="space-y-10">
      <div>
        <Breadcrumb
          items={[
            { label: t(lang, "home"), href: "/" },
            { label: mostExpensiveTitle(lang) },
          ]}
        />
        {/* The keyword sentence IS the subtitle — one text block under the
            H1, same grammar as every other landing page (owner ruling
            2026-08-06). */}
        <PageHeader title={mostExpensiveTitle(lang)} description={lead} />
      </div>

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
                        <td className="px-4 py-3 text-center font-price text-xs text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="min-w-0 px-4 py-3">
                          <CardCell card={card} lang={lang} />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/opcg/sets/${card.set.code}`}
                            className="font-mono text-body-sm uppercase hover:text-primary hover:underline"
                          >
                            {card.set.code.toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <RarityBadge rarity={card.rarity} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-price text-sm font-semibold">{price}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <PriceTag
                            change={card.priceChange30d}
                            changeOnly
                            changeStyle="plain"
                            showArrow={false}
                            size="sm"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Surface>

            {/* Mobile list — the exact row grammar of the home market list
                (mobile-card-item.tsx): rank · uncropped thumb · identity on
                the left, money stack on the right. No wrapping panel — the
                home list floats on the canvas with hairline dividers only. */}
            <div className="divide-y divide-hair sm:hidden">
              {data.cards.map((card, i) => {
                const price = priceLabel(card.priceJpy, currency)
                const name = getCardName(lang, card)
                return (
                  <div
                    key={card.cardCode}
                    className="ease-chrome flex min-h-[52px] items-center gap-3 px-4 py-2.5 active:bg-muted"
                  >
                    <span className="w-5 shrink-0 text-center font-price text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    {card.imageUrl ? (
                      <span className="hairline relative block aspect-[63/88] w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={card.imageUrl}
                          alt={name}
                          fill
                          sizes="44px"
                          className="object-contain"
                        />
                      </span>
                    ) : (
                      <span className="hairline relative block aspect-[63/88] w-11 shrink-0 overflow-hidden rounded-md bg-muted" />
                    )}
                    <Link
                      href={`/opcg/cards/${card.cardCode}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-tight">{name}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-meta">
                          <span className="font-mono">{card.baseCode ?? card.cardCode}</span>
                          <RarityBadge rarity={card.rarity} size="sm" />
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                        <p className="font-price text-sm font-semibold">{price}</p>
                        <PriceTag
                          change={card.priceChange30d}
                          changeOnly
                          changeStyle="plain"
                          showArrow={false}
                          size="sm"
                        />
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      {data.topByRarity.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-h3">{headings.byRarity}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.topByRarity.map(({ rarity, card }) => {
              const price = priceLabel(card.priceJpy, currency)
              const name = getCardName(lang, card)
              return (
                <Surface
                  as={Link}
                  key={rarity}
                  href={`/opcg/cards/${card.cardCode}`}
                  variant="outline"
                  interactive
                  className="flex items-center gap-3 p-4"
                >
                  <span className="hairline relative block aspect-[63/88] w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                    {card.imageUrl && (
                      <Image
                        src={card.imageUrl}
                        alt={name}
                        fill
                        sizes="44px"
                        className="object-contain"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <RarityBadge rarity={rarity} size="sm" />
                    <span className="mt-1 block truncate text-sm font-medium leading-tight">
                      {name}
                    </span>
                    <span className="mt-0.5 flex items-baseline justify-between gap-2">
                      <span className="font-mono text-meta">
                        {card.baseCode ?? card.cardCode}
                      </span>
                      <span className="font-price text-sm font-semibold">{price}</span>
                    </span>
                  </span>
                </Surface>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
