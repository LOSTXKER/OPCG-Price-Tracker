"use client"

import Image from "next/image"
import { X } from "lucide-react"

import { Price } from "@/components/shared/price-inline"
import { cn } from "@/lib/utils"
import { formatPct } from "@/lib/utils/pull-rate"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import type { CardItem, Unit } from "./types"
import { UNIT_LABELS } from "./types"

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
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <h2 className="text-sm font-semibold">
          รายการที่อยากได้
          {wantCards.length > 0 && (
            <span className="ml-1 text-primary">({wantCards.length})</span>
          )}
        </h2>
        {wantCards.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ล้างทั้งหมด
          </button>
        )}
      </div>
      {wantCards.length === 0 ? (
        <p className="px-3 pb-4 text-center text-xs text-muted-foreground">
          กดเลือกการ์ดจากฝั่งซ้าย
        </p>
      ) : (
        <>
          <div className="max-h-[300px] space-y-0.5 overflow-y-auto px-2">
            {wantResults.map(({ card, chance }) => {
              const name = getCardName(lang, card as never)
              return (
                <div
                  key={card.id}
                  className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-muted/40"
                >
                  <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {card.imageUrl && (
                      <Image src={card.imageUrl} alt={name} fill className="object-contain" sizes="36px" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium leading-tight">{name}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {card.rarity}
                      {card.latestPriceJpy != null && card.latestPriceJpy > 0 && <> · <Price jpy={card.latestPriceJpy} /></>}
                    </span>
                  </div>
                  <span className={cn(
                    "shrink-0 font-mono text-xs font-bold tabular-nums",
                    chance >= 0.5 ? "text-price-up" : chance >= 0.1 ? "text-chance-mid" : "text-destructive"
                  )}>
                    {formatPct(chance)}
                  </span>
                  <button onClick={() => onRemove(card.id)} className="shrink-0 rounded p-0.5 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground">
                    <X className="size-3" />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="space-y-2 border-t border-border/40 bg-muted/10 px-3 py-3">
            <div className="rounded-lg bg-muted/40 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">โอกาสได้ครบทุกใบ</span>
                <span className={cn(
                  "font-mono text-base font-bold tabular-nums",
                  allChance >= 0.5 ? "text-price-up" : allChance >= 0.1 ? "text-chance-mid" : "text-destructive"
                )}>
                  {formatPct(allChance)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    allChance >= 0.5 ? "bg-price-up" : allChance >= 0.1 ? "bg-chance-mid" : "bg-destructive"
                  )}
                  style={{ width: `${Math.min(100, allChance * 100)}%` }}
                />
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">มูลค่ารวมการ์ดที่เลือก</span>
                <span className="font-price font-bold tabular-nums"><Price jpy={totalWantValue} /></span>
              </div>
              {purchaseCost != null && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ต้นทุนซื้อ ({quantity} {UNIT_LABELS[unit]})</span>
                  <span className="font-price font-bold tabular-nums"><Price jpy={purchaseCost} /></span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
