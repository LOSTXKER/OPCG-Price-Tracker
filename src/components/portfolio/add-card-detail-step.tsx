"use client"

import { ArrowLeft } from "lucide-react"

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconButton } from "@/components/ui/icon-button"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

import type { CardWithSet } from "./add-card-types"
import { CardAcquisitionForm } from "./card-acquisition-form"
import type {
  CardAcquisitionDraft,
  CardAcquisitionDrafts,
} from "./card-acquisition"

export function AddCardDetailStep({
  cards,
  drafts,
  onDraftChange,
  defaultAcquiredAt,
  existingHoldingQuantities,
  submitting,
  onBack,
  onSubmit,
}: {
  cards: CardWithSet[]
  drafts: CardAcquisitionDrafts
  onDraftChange: (
    cardId: number,
    patch: Partial<CardAcquisitionDraft>,
  ) => void
  defaultAcquiredAt: string
  existingHoldingQuantities: Record<number, number>
  submitting: boolean
  onBack: () => void
  onSubmit: () => void
}) {
  const lang = useUIStore((s) => s.language)

  return (
    <CardAcquisitionForm
      cards={cards}
      drafts={drafts}
      onDraftChange={onDraftChange}
      defaultAcquiredAt={defaultAcquiredAt}
      existingHoldingQuantities={existingHoldingQuantities}
      submitting={submitting}
      onCancel={onBack}
      onSubmit={onSubmit}
      header={
        <DialogHeader className="border-b border-hair px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t(lang, "back")}
              onClick={onBack}
              disabled={submitting}
            >
              <ArrowLeft className="size-4" />
            </IconButton>
            <div className="min-w-0">
              <DialogTitle>{t(lang, "newPurchaseLot")}</DialogTitle>
              <DialogDescription className="text-meta">
                {t(lang, "addToPortfolioDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
      }
    />
  )
}
