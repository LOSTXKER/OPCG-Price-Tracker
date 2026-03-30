"use client"

import { Minus, Plus } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { PACKS_PER_BOX, BOXES_PER_CARTON, CARDS_PER_PACK_JP } from "@/lib/utils/pull-rate"
import { useUIStore } from "@/stores/ui-store"
import type { DropRate, Unit } from "./types"
import { UNIT_I18N_KEYS, PULL_UNITS, tierSort } from "./types"

interface PurchaseConfigProps {
  unit: Unit
  quantity: number
  dropRates: DropRate[]
  onUnitChange: (unit: Unit) => void
  onQuantityChange: (quantity: number) => void
  compact?: boolean
}

export function PurchaseConfig({ unit, quantity, dropRates, onUnitChange, onQuantityChange, compact }: PurchaseConfigProps) {
  const lang = useUIStore((s) => s.language)

  const packs =
    unit === "pack" ? quantity
      : unit === "box" ? PACKS_PER_BOX * quantity
        : PACKS_PER_BOX * BOXES_PER_CARTON * quantity
  const cards = packs * CARDS_PER_PACK_JP

  if (compact) {
    return (
      <div className="panel flex flex-wrap items-center gap-2 p-2.5">
        <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
          {PULL_UNITS.map((u) => (
            <button
              key={u}
              onClick={() => onUnitChange(u)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                unit === u
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(lang, UNIT_I18N_KEYS[u])}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="flex size-7 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted active:scale-95"
          >
            <Minus className="size-3" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={quantity}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "")
              onQuantityChange(Math.max(1, Math.min(99, Number(v) || 1)))
            }}
            className="h-7 w-10 rounded-md border border-border bg-background text-center font-mono text-xs font-semibold tabular-nums outline-none"
          />
          <button
            onClick={() => onQuantityChange(Math.min(99, quantity + 1))}
            className="flex size-7 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted active:scale-95"
          >
            <Plus className="size-3" />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {unit === "box" && `= ${packs} ${t(lang, "packUnit")} · ${cards} ${t(lang, "cardsCount")}`}
          {unit === "pack" && `${cards} ${t(lang, "cardsCount")}`}
          {unit === "carton" && `= ${BOXES_PER_CARTON * quantity} ${t(lang, "boxUnit")} · ${cards} ${t(lang, "cardsCount")}`}
        </p>
      </div>
    )
  }

  const meaningful = dropRates
    .filter((dr) => {
      const count =
        unit === "pack"
          ? (dr.ratePerPack ?? 0) * quantity
          : unit === "box"
            ? (dr.avgPerBox ?? 0) * quantity
            : (dr.avgPerBox ?? 0) * BOXES_PER_CARTON * quantity
      return count >= 0.5
    })
    .sort((a, b) => tierSort(a.rarity, b.rarity))

  return (
    <section className="panel overflow-hidden">
      <div className="space-y-3 p-3">
        <div className="flex w-full rounded-lg border border-border bg-muted/50 p-0.5">
          {PULL_UNITS.map((u) => (
            <button
              key={u}
              onClick={() => onUnitChange(u)}
              className={cn(
                "flex-1 rounded-md py-1.5 text-center text-sm font-medium transition-all",
                unit === u
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(lang, UNIT_I18N_KEYS[u])}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2.5">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="flex size-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted active:scale-95"
          >
            <Minus className="size-4" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={quantity}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "")
              onQuantityChange(Math.max(1, Math.min(99, Number(v) || 1)))
            }}
            className="h-9 w-16 rounded-lg border border-border bg-background px-2 text-center font-mono text-sm font-semibold tabular-nums outline-none"
          />
          <button
            onClick={() => onQuantityChange(Math.min(99, quantity + 1))}
            className="flex size-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted active:scale-95"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {unit === "pack" && `${quantity} ${t(lang, "packUnit")} · ${cards} ${t(lang, "cardsCount")}`}
          {unit === "box" && `${quantity} ${t(lang, "boxUnit")} = ${packs} ${t(lang, "packUnit")} · ${cards} ${t(lang, "cardsCount")}`}
          {unit === "carton" && `${quantity} ${t(lang, "cartonUnit")} = ${BOXES_PER_CARTON * quantity} ${t(lang, "boxUnit")} · ${cards} ${t(lang, "cardsCount")}`}
        </p>
      </div>
      {meaningful.length > 0 && (
        <div className="border-t border-border/40 px-3 py-2.5">
          <p className="mb-2 text-[11px] font-medium text-muted-foreground">
            {quantity} {t(lang, UNIT_I18N_KEYS[unit])} {t(lang, "estimatedYield")}
          </p>
          <div className="space-y-1">
            {meaningful.map((dr) => {
              const count =
                unit === "pack"
                  ? (dr.ratePerPack ?? 0) * quantity
                  : unit === "box"
                    ? (dr.avgPerBox ?? 0) * quantity
                    : (dr.avgPerBox ?? 0) * BOXES_PER_CARTON * quantity
              const display = count >= 10 ? Math.round(count) : count % 1 === 0 ? count : count.toFixed(1)
              return (
                <div
                  key={dr.rarity}
                  className="flex items-center justify-between rounded-md bg-muted/30 px-2.5 py-1.5"
                >
                  <RarityBadge rarity={dr.rarity} size="sm" />
                  <span className="font-mono text-xs font-bold tabular-nums">
                    ×{display}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
