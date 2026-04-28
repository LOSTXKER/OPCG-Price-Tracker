"use client"

import Image from "next/image"
import Link from "next/link"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { getCardName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { formatPct } from "@/lib/utils/currency"

export interface CardTableRow {
  cardCode: string
  baseCode?: string | null
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
  rarity: string
  isParallel: boolean
  cardType?: string
  colorEn?: string | null
  imageUrl?: string | null
  latestPriceJpy?: number | null
  latestPriceThb?: number | null
  priceChange24h?: number | null
  priceChange7d?: number | null
  inStock?: boolean
  setCode: string
}

export function CardTable({ cards }: { cards: CardTableRow[] }) {
  const lang = useUIStore((s) => s.language)
  return (
    <>
      {/* Mobile list fallback (<sm). The wide table doesn't fit on phones, so
          we surface the same rows in a list layout instead of forcing a side-
          scroll. Keep this in sync with the table columns above. */}
      <div className="divide-y divide-border/40 sm:hidden">
        {cards.map((card) => (
          <CardListRow key={card.cardCode} card={card} />
        ))}
      </div>

      <div className="hidden overflow-x-auto p-4 sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-eyebrow">
              <th className="whitespace-nowrap pb-2.5 pr-3 pl-1">{t(lang, "card")}</th>
              <th className="hidden whitespace-nowrap pb-2.5 pr-3 md:table-cell">
                {t(lang, "set")}
              </th>
              <th className="whitespace-nowrap pb-2.5 pr-3">{t(lang, "rarity")}</th>
              <th className="hidden whitespace-nowrap pb-2.5 pr-3 lg:table-cell">
                {t(lang, "type")}
              </th>
              <th className="hidden whitespace-nowrap pb-2.5 pr-3 lg:table-cell">
                {t(lang, "color")}
              </th>
              <th className="whitespace-nowrap pb-2.5 pr-3 text-right">
                {t(lang, "price")}
              </th>
              <th className="whitespace-nowrap pb-2.5 pr-3 text-right">24h</th>
              <th className="hidden whitespace-nowrap pb-2.5 text-right md:table-cell">
                7d
              </th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => {
              const c24 = card.priceChange24h
              const c7 = card.priceChange7d

              return (
                <tr
                  key={card.cardCode}
                  className="border-b border-border/40 transition-colors hover:bg-muted/40"
                >
                  <td className="py-2 pr-3 pl-1 align-middle">
                    <Link href={`/cards/${card.cardCode}`} className="flex items-center gap-3">
                      <div className="relative size-9 shrink-0 overflow-hidden rounded bg-muted">
                        {card.imageUrl ? (
                          <Image
                            src={card.imageUrl}
                            alt={getCardName(lang, card)}
                            fill
                            className="object-contain"
                            sizes="36px"
                          />
                        ) : (
                          <div className="size-full bg-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium leading-tight hover:text-primary">
                          {getCardName(lang, card)}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {card.baseCode ?? card.cardCode}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden py-2 pr-3 align-middle font-mono text-xs text-muted-foreground md:table-cell">
                    {card.setCode.toUpperCase()}
                  </td>
                  <td className="py-2 pr-3 align-middle">
                    <RarityBadge rarity={card.rarity} size="sm" />
                  </td>
                  <td className="hidden py-2 pr-3 align-middle text-meta lg:table-cell">
                    {card.cardType ?? "—"}
                  </td>
                  <td className="hidden py-2 pr-3 align-middle text-meta lg:table-cell">
                    {card.colorEn ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-right align-middle font-mono text-sm font-semibold tabular-nums">
                    {card.latestPriceJpy != null ? <Price jpy={card.latestPriceJpy} /> : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right align-middle">
                    <ChangeCell value={c24} />
                  </td>
                  <td className="hidden py-2 text-right align-middle md:table-cell">
                    <ChangeCell value={c7} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

function CardListRow({ card }: { card: CardTableRow }) {
  const lang = useUIStore((s) => s.language)
  const c24 = card.priceChange24h

  return (
    <Link
      href={`/cards/${card.cardCode}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-muted/40"
    >
      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={getCardName(lang, card)}
            fill
            className="object-contain"
            sizes="44px"
          />
        ) : (
          <div className="size-full bg-muted" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">
          {getCardName(lang, card)}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-meta">
          <span className="font-mono">{card.baseCode ?? card.cardCode}</span>
          <RarityBadge rarity={card.rarity} size="sm" />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-price text-sm font-semibold tabular-nums">
          {card.latestPriceJpy != null ? <Price jpy={card.latestPriceJpy} /> : "—"}
        </p>
        {c24 != null && c24 !== 0 && <ChangeCell value={c24} />}
      </div>
    </Link>
  )
}

function ChangeCell({ value }: { value?: number | null }) {
  if (value == null)
    return <span className="font-mono text-xs text-muted-foreground">—</span>
  const up = value > 0
  const down = value < 0
  return (
    <span
      className={`font-mono text-xs font-medium tabular-nums ${
        up ? "text-price-up" : down ? "text-price-down" : "text-muted-foreground"
      }`}
    >
      {value > 0 ? "+" : ""}
      {formatPct(value)}%
    </span>
  )
}
