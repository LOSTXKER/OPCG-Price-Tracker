"use client"

import Image from "next/image"
import { X } from "lucide-react"

import { Price } from "@/components/shared/price-inline"
import { cn } from "@/lib/utils"
import { formatPullPct } from "@/lib/utils/pull-rate"
import { getCardName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import type { CardItem, Unit } from "./types"
import { UNIT_I18N_KEYS } from "./types"

interface WantResult {
  card: CardItem
  chance: number
}

interface WantListProps {
  wantCards: CardItem[]
  wantResults: WantResult[]
  allChance: number
  totalWantValue: number
  purchaseCost: number | null
  unit: Unit
  quantity: number
  onRemove: (cardId: number) => void
  onClearAll: () => void
}

export function WantList({
  wantCards,
  wantResults,
  allChance,
  totalWantValue,
  purchaseCost,
  unit,
  quantity,
  onRemove,
  onClearAll,
}: WantListProps) {
  const lang = useUIStore((s) => s.language)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-eyebrow">
          {t(lang, "wantList")}
          {wantCards.length > 0 && (
            <span className="ml-1 text-primary">({wantCards.length})</span>
          )}
        </p>
        {wantCards.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-meta transition-colors hover:text-foreground"
          >
            {t(lang, "clearAll")}
          </button>
        )}
      </div>
      {wantCards.length === 0 ? (
        <p className="py-2 text-center text-meta">
          {t(lang, "selectFromLeft")}
        </p>
      ) : (
        <>
          <ul className="max-h-[280px] space-y-0.5 overflow-y-auto -mx-1.5">
            {wantResults.map(({ card, chance }) => {
              const name = getCardName(lang, card as never)
              return (
                <li
                  key={card.id}
                  className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-muted/40"
                >
                  <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {card.imageUrl && (
                      <Image src={card.imageUrl} alt={name} fill className="object-contain" sizes="36px" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm leading-tight">{name}</p>
                    <span className="text-meta">
                      {card.rarity}
                      {card.latestPriceJpy != null && card.latestPriceJpy > 0 && <> · <Price jpy={card.latestPriceJpy} /></>}
                    </span>
                  </div>
                  <span className={cn(
                    "shrink-0 font-mono text-xs font-bold tabular-nums",
                    chance >= 0.5 ? "text-price-up" : chance >= 0.1 ? "text-chance-mid" : "text-destructive"
                  )}>
                    {formatPullPct(chance)}
                  </span>
                  <button onClick={() => onRemove(card.id)} aria-label={t(lang, "remove")} className="shrink-0 rounded-md p-1.5 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="space-y-2.5 border-t border-[var(--p-hair)] pt-3">
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-eyebrow">{t(lang, "chanceToGetAll")}</span>
                <span className={cn(
                  "font-mono text-display tabular-nums",
                  allChance >= 0.5 ? "text-price-up" : allChance >= 0.1 ? "text-chance-mid" : "text-destructive"
                )}>
                  {formatPullPct(allChance)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    allChance >= 0.5 ? "bg-price-up" : allChance >= 0.1 ? "bg-chance-mid" : "bg-destructive"
                  )}
                  style={{ width: `${Math.min(100, allChance * 100)}%` }}
                />
              </div>
            </div>
            <dl className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-meta">{t(lang, "totalSelectedValue")}</dt>
                <dd className="font-price font-bold tabular-nums"><Price jpy={totalWantValue} /></dd>
              </div>
              {purchaseCost != null && (
                <div className="flex items-center justify-between">
                  <dt className="text-meta">{t(lang, "purchaseCost")} ({quantity} {t(lang, UNIT_I18N_KEYS[unit])})</dt>
                  <dd className="font-price font-bold tabular-nums"><Price jpy={purchaseCost} /></dd>
                </div>
              )}
            </dl>
          </div>
        </>
      )}
    </div>
  )
}
