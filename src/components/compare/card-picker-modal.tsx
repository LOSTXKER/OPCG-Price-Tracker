"use client"

import { X } from "lucide-react"

import {
  CardPickerForm,
  type CardWithSet,
} from "@/components/shared/card-picker-form"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCompareStore, type CompareItem } from "@/stores/compare-store"
import { useUIStore } from "@/stores/ui-store"
import { getCardName, t } from "@/lib/i18n"
import { useTierLimits } from "@/hooks/use-tier-limits"
import { UpgradeBadge } from "@/components/shared/upgrade-badge"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"

/**
 * Add cards to the comparison. Uses the app-wide CardPickerForm (search +
 * filters + value list) in multi-pick mode — tapping a row toggles it in the
 * compare store; the tier cap is enforced here (upgrade prompt) rather than
 * inside the picker. Formerly a bespoke search/set/sort/paginated grid.
 */
export function CardPickerModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const lang = useUIStore((s) => s.language)
  const storeItems = useCompareStore((s) => s.items)
  const toggle = useCompareStore((s) => s.toggle)
  const { limits } = useTierLimits()
  const { openUpgradeDialog } = useUpgradeDialog()
  const tierMax = isFinite(limits.compareCards) ? limits.compareCards : 6
  const atLimit = storeItems.length >= tierMax
  const selectedCodes = new Set(storeItems.map((i) => i.cardCode))

  const handleToggle = (card: CardWithSet) => {
    const already = selectedCodes.has(card.cardCode)
    // Adding a NEW card past the tier cap → upgrade prompt (removing is fine).
    if (!already && atLimit) {
      openUpgradeDialog({ featureKey: "comparePlus" })
      return
    }
    const item: CompareItem = {
      cardCode: card.cardCode,
      name: getCardName(lang, card),
      imageUrl: card.imageUrl ?? null,
      rarity: card.rarity,
    }
    toggle(item)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[90dvh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl md:h-[80dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hair px-4 py-3">
          <DialogTitle className="text-h3">
            {t(lang, "addCardToCompare")}
          </DialogTitle>
          <DialogClose
            aria-label={t(lang, "close")}
            className="tap-safe flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </DialogClose>
        </div>

        {/* The one shared card picker — multi-pick (selected rows show a Check).
            The count/commit footer is passed in so the filter overlay covers it. */}
        <CardPickerForm
          onSelect={handleToggle}
          isSelected={(c) => selectedCodes.has(c.cardCode)}
          showHeader={false}
          footer={
            <div className="flex items-center justify-between border-t border-hair px-4 py-2.5">
              <div className="flex items-center gap-2">
                <p className="text-meta">
                  {storeItems.length}/{tierMax} {t(lang, "card")}
                </p>
                {atLimit && isFinite(limits.compareCards) && (
                  <UpgradeBadge featureKey="comparePlus" />
                )}
              </div>
              <DialogClose
                className="min-h-11 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground motion-base hover:bg-primary/90 sm:min-h-0"
              >
                {t(lang, "compareNow")}
              </DialogClose>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
