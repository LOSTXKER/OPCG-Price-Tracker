"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, Edit2, Trash2, X } from "lucide-react"

import { Price } from "@/components/shared/price-inline"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

export type AssetRow = {
  itemId: number
  cardId: number
  cardCode: string
  baseCode: string | null
  nameJp: string
  nameEn: string | null
  rarity: string
  imageUrl: string | null
  quantity: number
  purchasePrice: number | null
  currentPrice: number | null
  priceChange24h: number | null
  priceChange7d: number | null
  condition: string
}

function pnlCalc(row: AssetRow) {
  if (row.purchasePrice == null || row.currentPrice == null) return null
  const pnl = (row.currentPrice - row.purchasePrice) * row.quantity
  const pct = row.purchasePrice > 0
    ? ((row.currentPrice - row.purchasePrice) / row.purchasePrice) * 100
    : 0
  return { pnl, pct }
}

export function PortfolioAssetsTable({
  assets,
  onUpdate,
  onRemove,
}: {
  assets: AssetRow[]
  onUpdate: (itemId: number, data: { quantity?: number; purchasePrice?: number | null }) => void
  onRemove: (itemId: number) => void
}) {
  const lang = useUIStore((s) => s.language)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th className="py-2.5 pl-4 pr-3 font-medium">การ์ด</th>
            <th className="py-2.5 pr-3 text-right font-medium">ราคา</th>
            <th className="hidden py-2.5 pr-3 text-right font-medium sm:table-cell">24h</th>
            <th className="hidden py-2.5 pr-3 text-right font-medium md:table-cell">7d</th>
            <th className="py-2.5 pr-3 text-right font-medium">มูลค่า</th>
            <th className="hidden py-2.5 pr-3 text-right font-medium sm:table-cell">ต้นทุน</th>
            <th className="py-2.5 pr-3 text-right font-medium">กำไร/ขาดทุน</th>
            <th className="w-20 py-2.5 pr-4 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {assets.map((row) => (
            <AssetRowComponent
              key={row.itemId}
              row={row}
              lang={lang}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AssetRowComponent({
  row,
  lang,
  onUpdate,
  onRemove,
}: {
  row: AssetRow
  lang: string
  onUpdate: (itemId: number, data: { quantity?: number; purchasePrice?: number | null }) => void
  onRemove: (itemId: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(String(row.quantity))
  const [cost, setCost] = useState(row.purchasePrice != null ? String(row.purchasePrice) : "")
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const holdingValue = (row.currentPrice ?? 0) * row.quantity
  const pnlResult = pnlCalc(row)

  const saveEdit = () => {
    const q = parseInt(qty)
    const p = cost.trim() === "" ? null : parseInt(cost)
    if (!Number.isInteger(q) || q < 1) return
    onUpdate(row.itemId, {
      quantity: q,
      purchasePrice: p,
    })
    setEditing(false)
  }

  return (
    <tr className="border-b border-border/40 transition-colors hover:bg-muted/40">
      <td className="py-2.5 pl-4 pr-3 align-middle">
        <Link href={`/cards/${row.cardCode}`} className="flex items-center gap-3">
          <div className="relative size-9 shrink-0 overflow-hidden rounded bg-muted">
            {row.imageUrl ? (
              <Image src={row.imageUrl} alt={name} fill className="object-contain" sizes="36px" />
            ) : (
              <div className="size-full bg-muted" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">{name}</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {row.baseCode ?? row.cardCode}
              <span className="ml-1.5 text-foreground/60">×{row.quantity}</span>
            </p>
          </div>
        </Link>
      </td>
      <td className="py-2.5 pr-3 text-right align-middle font-price text-sm font-semibold">
        {row.currentPrice != null ? <Price jpy={row.currentPrice} /> : "—"}
      </td>
      <td className="hidden py-2.5 pr-3 text-right align-middle sm:table-cell">
        <ChangeCell value={row.priceChange24h} />
      </td>
      <td className="hidden py-2.5 pr-3 text-right align-middle md:table-cell">
        <ChangeCell value={row.priceChange7d} />
      </td>
      <td className="py-2.5 pr-3 text-right align-middle font-price text-sm font-semibold">
        <Price jpy={holdingValue} />
      </td>
      <td className="hidden py-2.5 pr-3 text-right align-middle sm:table-cell">
        {editing ? (
          <input
            className="w-20 rounded bg-muted px-2 py-0.5 text-right text-xs outline-none"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            type="number"
          />
        ) : (
          <span className="font-price text-xs text-muted-foreground">
            {row.purchasePrice != null ? `¥${(row.purchasePrice * row.quantity).toLocaleString()}` : "—"}
          </span>
        )}
      </td>
      <td className="py-2.5 pr-3 text-right align-middle">
        {pnlResult ? (
          <span className={cn(
            "font-price text-xs font-medium tabular-nums",
            pnlResult.pnl >= 0 ? "text-price-up" : "text-price-down"
          )}>
            {pnlResult.pnl >= 0 ? "+" : ""}¥{pnlResult.pnl.toLocaleString()}
            <br />
            <span className="text-[11px]">
              ({pnlResult.pct >= 0 ? "+" : ""}{pnlResult.pct.toFixed(1)}%)
            </span>
          </span>
        ) : (
          <span className="font-price text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2.5 pr-4 text-right align-middle">
        {editing ? (
          <div className="flex items-center justify-end gap-1">
            <input
              className="w-14 rounded bg-muted px-2 py-0.5 text-right text-xs outline-none"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              type="number"
              min={1}
            />
            <button onClick={saveEdit} className="text-muted-foreground hover:text-foreground">
              <Check className="size-3.5" />
            </button>
            <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => {
                setQty(String(row.quantity))
                setCost(row.purchasePrice != null ? String(row.purchasePrice) : "")
                setEditing(true)
              }}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="size-3.5" />
            </button>
            <button
              onClick={() => onRemove(row.itemId)}
              className="rounded p-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

function ChangeCell({ value }: { value?: number | null }) {
  if (value == null) return <span className="font-price text-xs text-muted-foreground">—</span>
  return (
    <span className={cn(
      "font-price text-xs font-medium tabular-nums",
      value > 0 ? "text-price-up" : value < 0 ? "text-price-down" : "text-muted-foreground"
    )}>
      {value > 0 ? "+" : ""}{value.toFixed(1)}%
    </span>
  )
}
