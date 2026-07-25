"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Price } from "@/components/shared/price-inline"
import { useConfirm } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { getCardName, t, type Language } from "@/lib/i18n"
import { MASKED } from "@/lib/constants/ui"
import type { AssetRow } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"
import { currencySymbol, displayValueToJpy, formatPct, jpyToDisplayValue } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { parseCostValue, pnlCalc } from "./utils"

const NOTES_MAX = 2000

function CardEditFull({
  row,
  lang,
  qty,
  onQtyChange,
  cost,
  onCostChange,
  costSymbol,
  hideBalance,
  notes,
  onNotesChange,
  isPrivate,
  onPrivateChange,
  onRemove,
}: {
  row: AssetRow
  lang: Language
  qty: string
  onQtyChange: (v: string) => void
  cost: string
  onCostChange: (v: string) => void
  costSymbol: string
  hideBalance: boolean
  notes: string
  onNotesChange: (v: string) => void
  isPrivate: boolean
  onPrivateChange: (v: boolean) => void
  onRemove: (itemId: number) => void
}) {
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const confirm = useConfirm()
  const pnlResult = pnlCalc(row)

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
    <div className="space-y-5">
      <div className="flex gap-4">
        <Link href={`/opcg/cards/${row.cardCode}`} className="shrink-0">
          <div className="relative aspect-[5/7] w-[72px] overflow-hidden rounded-lg bg-muted shadow-md">
            {row.imageUrl ? (
              <Image src={row.imageUrl} alt={name} fill className="object-cover" sizes="72px" />
            ) : (
              <div className="flex size-full items-center justify-center text-overlay text-muted-foreground">
                {row.baseCode ?? row.cardCode}
              </div>
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1 py-0.5">
          <p className="text-sm font-semibold leading-snug">{name}</p>
          <p className="mt-0.5 font-mono text-meta text-muted-foreground/70">
            {row.baseCode ?? row.cardCode}
          </p>
          {row.currentPrice != null && (
            <div className="mt-3 flex items-center gap-2">
              <span className="font-price tabular-nums text-lg font-bold leading-none">
                {hideBalance ? MASKED : <Price jpy={row.currentPrice} />}
              </span>
              {pnlResult?.pct != null && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-price tabular-nums text-micro",
                    pnlResult.pnl >= 0
                      ? "bg-price-up/10 text-price-up-on-soft"
                      : "bg-price-down/10 text-price-down-on-soft",
                  )}
                >
                  {pnlResult.pnl >= 0 ? "+" : ""}
                  {formatPct(pnlResult.pct)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-eyebrow text-muted-foreground/60">
            {t(lang, "quantity")}
          </label>
          <input
            className="w-full rounded-lg border border-hair bg-muted/20 px-3 py-2.5 text-sm tabular-nums outline-none transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/20"
            value={qty}
            onChange={(e) => onQtyChange(e.target.value)}
            type="number"
            min={1}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-eyebrow text-muted-foreground/60">
            {t(lang, "costBasis")}
          </label>
          {hideBalance ? (
            <div className="flex min-h-10 items-center rounded-lg border border-hair bg-muted/20 px-3 text-sm font-price tabular-nums text-muted-foreground">
              {MASKED}
            </div>
          ) : (
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/50">
                {costSymbol}
              </span>
              <input
                className="w-full rounded-lg border border-hair bg-muted/20 py-2.5 pl-7 pr-3 text-sm tabular-nums outline-none transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/20"
                value={cost}
                onChange={(e) => onCostChange(e.target.value)}
                type="number"
                step="1"
                min={0}
                placeholder="—"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1.5 flex items-center justify-between text-eyebrow text-muted-foreground/60">
          <span>{t(lang, "watchlistNote")}</span>
          <span className="font-mono normal-case tracking-normal text-meta text-muted-foreground/50">
            {notes.length}/{NOTES_MAX}
          </span>
        </label>
        <textarea
          className="w-full resize-none rounded-lg border border-hair bg-muted/20 px-3 py-2.5 text-sm outline-none transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/20"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value.slice(0, NOTES_MAX))}
          rows={3}
          placeholder={t(lang, "watchlistNotePlaceholder")}
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center justify-between rounded-lg border border-hair px-3 py-2.5">
          <div className="flex items-center gap-2">
            {isPrivate ? (
              <EyeOff className="size-3.5 text-muted-foreground/60" />
            ) : (
              <Eye className="size-3.5 text-primary" />
            )}
            <span className="text-xs text-foreground/70">
              {isPrivate ? t(lang, "privateCard") : t(lang, "unmarkPrivate")}
            </span>
          </div>
          <Switch
            checked={!isPrivate}
            onCheckedChange={(checked) => onPrivateChange(!checked)}
            ariaLabel={isPrivate ? t(lang, "privateCard") : t(lang, "unmarkPrivate")}
          />
        </div>
        <button
          onClick={() => void handleRemove()}
          className="tap-safe shrink-0 rounded-lg border border-destructive/15 p-2.5 text-destructive/50 transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          title={t(lang, "remove")}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function SingleEditDialog({
  open,
  onOpenChange,
  assets,
  focusItemId,
  hideBalance = false,
  onUpdate,
  onRemove,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: AssetRow[]
  focusItemId: number
  hideBalance?: boolean
  onUpdate: (
    itemId: number,
    data: {
      quantity?: number
      purchasePrice?: number | null
      isPrivate?: boolean
      notes?: string | null
    },
  ) => Promise<boolean>
  onRemove: (itemId: number) => void
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const row = assets.find((a) => a.itemId === focusItemId)
  const [qty, setQty] = useState("")
  const [cost, setCost] = useState("")
  const [notes, setNotes] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState<number | null>(null)

  // Cost is stored in JPY but edited in the user's display currency, matching the
  // add-card flow. Compare against the initial *display* string (not a re-derived
  // JPY value) so a THB→JPY→THB round-trip's ±1 rounding never reads as "dirty".
  const initialCost =
    row?.purchasePrice != null
      ? String(Math.round(jpyToDisplayValue(row.purchasePrice, currency)))
      : ""

  if (row && initialized !== row.itemId) {
    setQty(String(row.quantity))
    setCost(initialCost)
    setNotes(row.notes ?? "")
    setIsPrivate(row.isPrivate ?? false)
    setInitialized(row.itemId)
  }

  const dirty = useMemo(() => {
    if (!row) return false
    const parsedQty = parseInt(qty)
    const qtyChanged = Number.isInteger(parsedQty) && parsedQty >= 1 && parsedQty !== row.quantity
    const costChanged =
      !hideBalance && cost !== initialCost && parseCostValue(cost) !== undefined
    const privacyChanged = isPrivate !== row.isPrivate
    const trimmedNotes = notes.trim()
    const nextNotes = trimmedNotes.length === 0 ? null : trimmedNotes
    const notesChanged = nextNotes !== (row.notes ?? null)
    return qtyChanged || costChanged || privacyChanged || notesChanged
  }, [qty, cost, initialCost, notes, isPrivate, row, hideBalance])

  const handleSave = async () => {
    if (!row || saving) return
    const data: {
      quantity?: number
      purchasePrice?: number | null
      isPrivate?: boolean
      notes?: string | null
    } = {}
    const q = parseInt(qty)
    if (Number.isInteger(q) && q >= 1 && q !== row.quantity) data.quantity = q
    if (!hideBalance && cost !== initialCost) {
      const costVal = parseCostValue(cost)
      if (costVal !== undefined) {
        data.purchasePrice = costVal === null ? null : displayValueToJpy(costVal, currency)
      }
    }
    if (isPrivate !== row.isPrivate) data.isPrivate = isPrivate
    const trimmedNotes = notes.trim()
    const nextNotes = trimmedNotes.length === 0 ? null : trimmedNotes
    if (nextNotes !== (row.notes ?? null)) data.notes = nextNotes
    if (Object.keys(data).length === 0) return

    setSaving(true)
    try {
      const saved = await onUpdate(row.itemId, data)
      if (!saved) {
        toast.error(t(lang, "saveFailed"))
        return
      }
      toast.success(t(lang, "saved"))
      onOpenChange(false)
    } catch {
      toast.error(t(lang, "saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  if (!row) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen || !saving) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-sm" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>{t(lang, "edit")}</DialogTitle>
        </DialogHeader>

        <CardEditFull
          row={row}
          lang={lang}
          qty={qty}
          onQtyChange={setQty}
          cost={cost}
          onCostChange={setCost}
          costSymbol={currencySymbol(currency)}
          hideBalance={hideBalance}
          notes={notes}
          onNotesChange={setNotes}
          isPrivate={isPrivate}
          onPrivateChange={setIsPrivate}
          onRemove={(id) => {
            onRemove(id)
            onOpenChange(false)
          }}
        />

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            {t(lang, "cancel")}
          </Button>
          <Button
            size="sm"
            disabled={!dirty || saving}
            aria-busy={saving}
            onClick={() => void handleSave()}
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                {t(lang, "saving")}
              </>
            ) : (
              t(lang, "save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
