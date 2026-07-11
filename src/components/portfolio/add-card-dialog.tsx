"use client"

import { toast } from "sonner"

import { CardBatchPickerDialog } from "@/components/shared/card-batch-picker-dialog"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

import { type CartItem } from "./add-card-types"

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
  onAddBatch: (items: CartItem[]) => Promise<{
    ok: boolean
    failed: number
    limitReached?: boolean
  }>
}) {
  const lang = useUIStore((s) => s.language)

  return (
    <CardBatchPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={async (cards) => {
        const result = await onAddBatch(
          cards.map((card) => ({ card, quantity: 1, purchasePrice: null })),
        )
        if (!result.ok && !result.limitReached) {
          toast.error(t(lang, "addFailed"))
        }
        return result.ok
      }}
      emptySubmitLabel={t(lang, "selectCardsToAdd")}
      submitLabel={(count) => `${t(lang, "addToPortfolio")} (${count})`}
    />
  )
}
