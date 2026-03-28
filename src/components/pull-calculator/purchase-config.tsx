"use client"

import { Minus, Plus } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { cn } from "@/lib/utils"
import { PACKS_PER_BOX, BOXES_PER_CARTON, CARDS_PER_PACK_JP } from "@/lib/utils/pull-rate"
import type { DropRate, Unit } from "./types"
import { UNIT_LABELS, tierSort } from "./types"

interface PurchaseConfigProps {
  unit: Unit
  quantity: number
  dropRates: DropRate[]
  onUnitChange: (unit: Unit) => void
  onQuantityChange: (quantity: number) => void
}

export function PurchaseConfig({ unit, quantity, dropRates, onUnitChange, onQuantityChange }: PurchaseConfigProps) {
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

  const packs =
    unit === "pack" ? quantity
      : unit === "box" ? PACKS_PER_BOX * quantity
        : PACKS_PER_BOX * BOXES_PER_CARTON * quantity
  const cards = packs * CARDS_PER_PACK_JP

  return (
    <section className="panel overflow-hidden">
      <div className="space-y-3 p-3">
        <div className="flex w-full rounded-lg border border-border bg-muted/50 p-0.5">
          {(["pack", "box", "carton"] as Unit[]).map((u) => (
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
              {UNIT_LABELS[u]}
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
          {unit === "pack" && `${quantity} ซอง · ${cards} ใบ`}
          {unit === "box" && `${quantity} กล่อง = ${packs} ซอง · ${cards} ใบ`}
          {unit === "carton" && `${quantity} คาตั้น = ${BOXES_PER_CARTON * quantity} กล่อง · ${cards} ใบ`}
        </p>
      </div>
      {meaningful.length > 0 && (
        <div className="border-t border-border/40 px-3 py-2.5">
          <p className="mb-2 text-[11px] font-medium text-muted-foreground">
            {quantity} {UNIT_LABELS[unit]} จะได้ประมาณ
          </p>
          <div className="flex flex-wrap gap-2">
            {meaningful.map((dr) => {
              const count =
                unit === "pack"
                  ? (dr.ratePerPack ?? 0) * quantity
                  : unit === "box"
                    ? (dr.avgPerBox ?? 0) * quantity
                    : (dr.avgPerBox ?? 0) * BOXES_PER_CARTON * quantity
              const display = count >= 10 ? Math.round(count) : count % 1 === 0 ? count : count.toFixed(1)
              return (
                <span
                  key={dr.rarity}
                  className="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1"
                >
                  <RarityBadge rarity={dr.rarity} size="sm" />
                  <span className="font-mono text-xs font-bold tabular-nums">
                    ×{display}
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
