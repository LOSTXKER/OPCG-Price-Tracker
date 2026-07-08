"use client"

import { useEffect, useState } from "react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CardPickerForm } from "@/components/shared/card-picker-form"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

import { type CardWithSet, type CartItem } from "./add-card-types"

export type { CartItem }

/**
 * Add cards to a portfolio. Multi-pick (เบส: เลือกการ์ดแบบหลายใบ) — tapping a card
 * toggles it into a pending selection you can see in the preview strip, then the
 * footer commits the whole batch at qty 1 (edit qty / purchase price afterwards in
 * the holdings table). Mirrors the watchlist add-dialog.
 */
export function AddCardDialog({
  open,
  onOpenChange,
  onAddBatch,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBatch: (items: CartItem[]) => Promise<unknown>
}) {
  const lang = useUIStore((s) => s.language)
  const [pending, setPending] = useState<CardWithSet[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Drop the pending picks whenever the dialog closes.
  useEffect(() => {
    if (!open) setPending([])
  }, [open])

  const toggle = (card: CardWithSet) => {
    setPending((prev) =>
      prev.some((c) => c.id === card.id)
        ? prev.filter((c) => c.id !== card.id)
        : [...prev, card],
    )
  }

  const commit = async () => {
    if (submitting || pending.length === 0) return
    setSubmitting(true)
    try {
      await onAddBatch(
        pending.map((card) => ({ card, quantity: 1, purchasePrice: null })),
      )
      setPending([])
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col gap-0 overflow-hidden p-0 max-md:!inset-0 max-md:!max-h-none max-md:!max-w-none max-md:!translate-x-0 max-md:!translate-y-0 max-md:!rounded-none md:h-auto md:max-h-[85dvh] md:w-full md:max-w-[34rem]"
      >
        <CardPickerForm
          onSelect={toggle}
          isSelected={(c) => pending.some((p) => p.id === c.id)}
          selected={pending}
          footer={
            <div className="border-t border-hair p-3">
              <button
                type="button"
                onClick={() => void commit()}
                disabled={pending.length === 0 || submitting}
                className="ease-chrome h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending.length === 0
                  ? t(lang, "selectCardsToAdd")
                  : `${t(lang, "addToPortfolio")} (${pending.length})`}
              </button>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
