"use client"

import { useId } from "react"
import { X } from "lucide-react"

import {
  CardPickerForm,
  type CardWithSet,
} from "@/components/shared/card-picker-form"
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
  const titleId = useId()

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

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
      />

      <div className="relative mx-auto mt-[5vh] flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-popover shadow-[var(--elev-overlay)] ring-1 ring-border/50 animate-in fade-in-0 slide-in-from-bottom-4 duration-[var(--dur-base)] md:mt-[8vh] md:h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hair px-4 py-3">
          <h2 id={titleId} className="text-h3">
            {t(lang, "addCardToCompare")}
          </h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* The one shared card picker — multi-pick (selected rows show a Check). */}
        <CardPickerForm
          onSelect={handleToggle}
          isSelected={(c) => selectedCodes.has(c.cardCode)}
          showHeader={false}
        />

        {/* Footer with count */}
        <div className="flex items-center justify-between border-t border-hair px-4 py-2.5">
          <div className="flex items-center gap-2">
            <p className="text-meta">
              {storeItems.length}/{tierMax} {t(lang, "card")}
            </p>
            {atLimit && isFinite(limits.compareCards) && (
              <UpgradeBadge featureKey="comparePlus" />
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground motion-base hover:bg-primary/90"
          >
            {t(lang, "compareNow")}
          </button>
        </div>
      </div>
    </div>
  )
}
