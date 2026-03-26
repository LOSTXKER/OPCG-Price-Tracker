"use client"

import Image from "next/image"
import Link from "next/link"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName } from "@/lib/i18n"
import { Price } from "@/components/shared/price-inline"
import { useUIStore } from "@/stores/ui-store"

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
    <div className="overflow-x-auto p-4">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th className="whitespace-nowrap pb-2.5 pr-3 pl-1 font-medium">การ์ด</th>
            <th className="hidden whitespace-nowrap pb-2.5 pr-3 font-medium md:table-cell">ชุด</th>
            <th className="hidden whitespace-nowrap pb-2.5 pr-3 font-medium sm:table-cell">ความหายาก</th>
            <th className="hidden whitespace-nowrap pb-2.5 pr-3 font-medium lg:table-cell">ประเภท</th>
            <th className="hidden whitespace-nowrap pb-2.5 pr-3 font-medium lg:table-cell">สี</th>
            <th className="whitespace-nowrap pb-2.5 pr-3 text-right font-medium">ราคา</th>
            <th className="whitespace-nowrap pb-2.5 pr-3 text-right font-medium">24 ชม.</th>
            <th className="hidden whitespace-nowrap pb-2.5 text-right font-medium md:table-cell">7 วัน</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => {
            const c24 = card.priceChange24h;
            const c7 = card.priceChange7d;

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
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {card.baseCode ?? card.cardCode}
                        {card.isParallel && <span className="ml-1 text-primary">P</span>}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="hidden py-2 pr-3 align-middle font-mono text-xs text-muted-foreground md:table-cell">
                  {card.setCode.toUpperCase()}
                </td>
                <td className="hidden py-2 pr-3 align-middle sm:table-cell">
                  <RarityBadge rarity={card.rarity} size="sm" />
                </td>
                <td className="hidden py-2 pr-3 align-middle text-xs text-muted-foreground lg:table-cell">
                  {card.cardType ?? "—"}
                </td>
                <td className="hidden py-2 pr-3 align-middle text-xs text-muted-foreground lg:table-cell">
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ChangeCell({ value }: { value?: number | null }) {
  if (value == null) return <span className="font-mono text-xs text-muted-foreground">—</span>;
  const up = value > 0;
  const down = value < 0;
  return (
    <span className={`font-mono text-xs font-medium tabular-nums ${
      up ? "text-price-up" : down ? "text-price-down" : "text-muted-foreground"
    }`}>
      {value > 0 ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}
