"use client"

import { Minus, Plus } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { PACKS_PER_BOX, BOXES_PER_CARTON, CARDS_PER_PACK_JP } from "@/lib/utils/pull-rate"
import { useUIStore } from "@/stores/ui-store"
import type { DropRate, Unit } from "./types"
import { UNIT_I18N_KEYS, PULL_UNITS } from "./types"
import { raritySort } from "@/lib/constants/rarities"

interface PurchaseConfigProps {
  unit: Unit
  quantity: number
  dropRates: DropRate[]
  onUnitChange: (unit: Unit) => void
  onQuantityChange: (quantity: number) => void
}

export function PurchaseConfig({ unit, quantity, dropRates, onUnitChange, onQuantityChange }: PurchaseConfigProps) {
  const lang = useUIStore((s) => s.language)

  const packs =
    unit === "pack" ? quantity
      : unit === "box" ? PACKS_PER_BOX * quantity
        : PACKS_PER_BOX * BOXES_PER_CARTON * quantity
  const cards = packs * CARDS_PER_PACK_JP

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
    .sort((a, b) => raritySort(a.rarity, b.rarity))

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-eyebrow">{t(lang, "configurePurchase")}</p>
        <div className="flex w-full rounded-lg border border-border bg-muted/40 p-0.5">
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
        <p className="text-center text-meta">
          {unit === "pack" && `${quantity} ${t(lang, "packUnit")} · ${cards} ${t(lang, "cardsCount")}`}
          {unit === "box" && `${quantity} ${t(lang, "boxUnit")} = ${packs} ${t(lang, "packUnit")} · ${cards} ${t(lang, "cardsCount")}`}
          {unit === "carton" && `${quantity} ${t(lang, "cartonUnit")} = ${BOXES_PER_CARTON * quantity} ${t(lang, "boxUnit")} · ${cards} ${t(lang, "cardsCount")}`}
        </p>
      </div>
      {meaningful.length > 0 && (
        <div>
          <p className="mb-1 text-eyebrow">
            {t(lang, "ifYouBuy")} {quantity} {t(lang, UNIT_I18N_KEYS[unit])} {t(lang, "estimatedYield")}
          </p>
          <ul className="divide-y divide-[var(--p-hair)]">
            {meaningful.map((dr) => {
              const count =
                unit === "pack"
                  ? (dr.ratePerPack ?? 0) * quantity
                  : unit === "box"
                    ? (dr.avgPerBox ?? 0) * quantity
                    : (dr.avgPerBox ?? 0) * BOXES_PER_CARTON * quantity
              const display = count >= 10 ? Math.round(count) : count % 1 === 0 ? count : count.toFixed(1)
              return (
                <li
                  key={dr.rarity}
                  className="flex items-center justify-between py-1.5"
                >
                  <RarityBadge rarity={dr.rarity} size="sm" />
                  <span className="font-mono text-xs font-bold tabular-nums">
                    ×{display}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
