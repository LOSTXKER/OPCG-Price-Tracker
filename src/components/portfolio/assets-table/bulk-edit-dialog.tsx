"use client"

import { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import { Search, Trash2, X } from "lucide-react"

import { useConfirm } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getCardName, t, type Language } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

import { parseCostValue } from "./utils"

type RowEditState = { qty: string; cost: string; isPrivate: boolean }

function CardEditCompact({
  row,
  lang,
  qty,
  cost,
  isPrivate,
  onFieldChange,
  onRemove,
}: {
  row: AssetRow
  lang: Language
  qty: string
  cost: string
  isPrivate: boolean
  onFieldChange: (
    itemId: number,
    field: "qty" | "cost" | "isPrivate",
    value: string | boolean,
  ) => void
  onRemove: (itemId: number) => void
}) {
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const confirm = useConfirm()

  const handleRemove = async () => {
    const ok = await confirm({
      title: `${t(lang, "remove")} ${name}`,
      description: t(lang, "confirmRemoveCard"),
      confirmLabel: t(lang, "remove"),
      cancelLabel: t(lang, "cancel"),
      variant: "destructive",
    })
    if (ok) onRemove(row.itemId)
  }

  return (
    <div className="group rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/20 hover:bg-muted/20">
      <div className="flex items-center gap-3">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
          {row.imageUrl ? (
            <Image src={row.imageUrl} alt={name} fill className="object-contain" sizes="40px" />
          ) : (
            <div className="flex size-full items-center justify-center text-overlay text-muted-foreground">
              {row.baseCode ?? row.cardCode}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium leading-tight">{name}</p>
          <p className="font-mono text-overlay text-muted-foreground/60">
            {row.baseCode ?? row.cardCode}
          </p>
        </div>

        <button
          onClick={() => void handleRemove()}
          className="shrink-0 rounded-md p-1 text-muted-foreground/25 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 pl-[52px]">
        <div className="flex items-center gap-1.5">
          <span className="text-overlay text-muted-foreground/60">{t(lang, "quantity")}</span>
          <input
            className="w-14 shrink-0 rounded-md border border-border/30 bg-muted/30 px-2 py-1 text-center text-xs tabular-nums outline-none transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/20"
            value={qty}
            onChange={(e) => onFieldChange(row.itemId, "qty", e.target.value)}
            type="number"
            min={1}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-overlay text-muted-foreground/60">{t(lang, "costBasis")}</span>
          <input
            className="w-20 shrink-0 rounded-md border border-border/30 bg-muted/30 px-2 py-1 text-center text-xs tabular-nums outline-none transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/20"
            value={cost}
            onChange={(e) => onFieldChange(row.itemId, "cost", e.target.value)}
            type="number"
            step="1"
            min={0}
            placeholder="—"
          />
        </div>
        <div className="ml-auto">
          <button
            onClick={() => onFieldChange(row.itemId, "isPrivate", !isPrivate)}
            className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/50"
            title={isPrivate ? t(lang, "unmarkPrivate") : t(lang, "markAsPrivate")}
          >
            <span
              className={cn(
                "text-overlay",
                isPrivate ? "text-muted-foreground/50" : "text-primary/80",
              )}
            >
              {isPrivate ? t(lang, "privateCard") : t(lang, "unmarkPrivate")}
            </span>
            <div
              className={cn(
                "relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors",
                isPrivate ? "bg-muted-foreground/25" : "bg-primary",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute top-0.5 inline-block size-3 rounded-full bg-white shadow-sm transition-transform",
                  isPrivate ? "left-0.5" : "left-[14px]",
                )}
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export function BulkEditDialog({
  open,
  onOpenChange,
  assets,
  onUpdate,
  onRemove,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: AssetRow[]
  onUpdate: (
    itemId: number,
    data: { quantity?: number; purchasePrice?: number | null; isPrivate?: boolean },
  ) => void
  onRemove: (itemId: number) => void
}) {
  const lang = useUIStore((s) => s.language)
  const [bulkSearch, setBulkSearch] = useState("")
  const [edits, setEdits] = useState<Record<number, RowEditState>>({})

  const getRowState = useCallback(
    (row: AssetRow): RowEditState => {
      if (edits[row.itemId]) return edits[row.itemId]
      return {
        qty: String(row.quantity),
        cost: row.purchasePrice != null ? String(row.purchasePrice) : "",
        isPrivate: row.isPrivate ?? false,
      }
    },
    [edits],
  )

  const handleFieldChange = useCallback(
    (
      itemId: number,
      field: "qty" | "cost" | "isPrivate",
      value: string | boolean,
    ) => {
      setEdits((prev) => {
        const row = assets.find((a) => a.itemId === itemId)
        if (!row) return prev
        const current =
          prev[itemId] ?? {
            qty: String(row.quantity),
            cost: row.purchasePrice != null ? String(row.purchasePrice) : "",
            isPrivate: row.isPrivate,
          }
        return { ...prev, [itemId]: { ...current, [field]: value } }
      })
    },
    [assets],
  )

  const dirty = useMemo(() => {
    return assets.some((row) => {
      const local = edits[row.itemId]
      if (!local) return false
      const parsedQty = parseInt(local.qty)
      const qtyChanged =
        Number.isInteger(parsedQty) && parsedQty >= 1 && parsedQty !== row.quantity
      const costVal = parseCostValue(local.cost)
      const costChanged = costVal !== undefined && costVal !== row.purchasePrice
      const privacyChanged = local.isPrivate !== row.isPrivate
      return qtyChanged || costChanged || privacyChanged
    })
  }, [edits, assets])

  const handleSave = () => {
    for (const row of assets) {
      const local = edits[row.itemId]
      if (!local) continue
      const data: { quantity?: number; purchasePrice?: number | null; isPrivate?: boolean } = {}
      const q = parseInt(local.qty)
      if (Number.isInteger(q) && q >= 1 && q !== row.quantity) data.quantity = q
      const costVal = parseCostValue(local.cost)
      if (costVal !== undefined && costVal !== row.purchasePrice) data.purchasePrice = costVal
      if (local.isPrivate !== row.isPrivate) data.isPrivate = local.isPrivate
      if (Object.keys(data).length > 0) onUpdate(row.itemId, data)
    }
    setEdits({})
    setBulkSearch("")
    onOpenChange(false)
  }

  const handleClose = () => {
    setEdits({})
    setBulkSearch("")
    onOpenChange(false)
  }

  const filteredBulk = useMemo(() => {
    if (!bulkSearch.trim()) return assets
    const q = bulkSearch.toLowerCase()
    return assets.filter((row) => {
      const name = getCardName(lang as "TH" | "EN" | "JP", row).toLowerCase()
      const code = (row.baseCode ?? row.cardCode).toLowerCase()
      return name.includes(q) || code.includes(q)
    })
  }, [assets, bulkSearch, lang])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose()
        else onOpenChange(v)
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(lang, "bulkEdit")}</DialogTitle>
          <DialogDescription>
            {assets.length} {t(lang, "card")}
          </DialogDescription>
        </DialogHeader>

        {assets.length > 5 && (
          <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/20 px-3 py-2">
            <Search className="size-3.5 shrink-0 text-muted-foreground/50" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
              placeholder={t(lang, "searchByNameOrCode")}
              value={bulkSearch}
              onChange={(e) => setBulkSearch(e.target.value)}
            />
            {bulkSearch && (
              <button
                onClick={() => setBulkSearch("")}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )}

        <div className="-mx-6 max-h-[50vh] overflow-y-auto px-4">
          {filteredBulk.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t(lang, "noResults")}
            </p>
          ) : (
            <div className="space-y-1 py-1">
              {filteredBulk.map((row) => {
                const state = getRowState(row)
                return (
                  <CardEditCompact
                    key={row.itemId}
                    row={row}
                    lang={lang}
                    qty={state.qty}
                    cost={state.cost}
                    isPrivate={state.isPrivate}
                    onFieldChange={handleFieldChange}
                    onRemove={onRemove}
                  />
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            {t(lang, "cancel")}
          </Button>
          <Button size="sm" disabled={!dirty} onClick={handleSave}>
            {t(lang, "save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
