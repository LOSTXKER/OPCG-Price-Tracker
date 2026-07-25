"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { CardBatchPickerDialog } from "@/components/shared/card-batch-picker-dialog"
import { MAX_PORTFOLIO_BATCH_ITEMS } from "@/lib/constants/ui"
import { t } from "@/lib/i18n"
import type { PortfolioBatchResult } from "@/lib/types/portfolio"
import { localDateInputValue } from "@/lib/utils/time"
import { useUIStore } from "@/stores/ui-store"

import {
  buildAcquisitionCartItems,
  createCardAcquisitionDraft,
  type CardAcquisitionDraft,
  type CardAcquisitionDrafts,
} from "./card-acquisition"
import { AddCardDetailStep } from "./add-card-detail-step"
import { type CartItem } from "./add-card-types"

export type { CartItem }

type AddCardDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolioName?: string
  onAddBatch: (
    items: CartItem[],
    requestScopeId: string,
  ) => Promise<PortfolioBatchResult>
  onEndSession?: (requestScopeId: string) => void
  existingHoldingQuantities?: Record<number, number>
}

const EMPTY_HOLDING_QUANTITIES: Record<number, number> = {}

/**
 * Add cards to a portfolio. Picks stay pending until the acquisition review
 * captures quantity, per-card cost, date, and note. Holdings stay grouped only
 * in the data contract; Overview renders every submitted purchase as its own row.
 */
export function AddCardDialog(props: AddCardDialogProps) {
  // Remounting the stateful content at each open/close boundary clears pending
  // acquisition details without an effect-driven cascade.
  return (
    <AddCardDialogContent
      key={props.open ? "open" : "closed"}
      {...props}
    />
  )
}

function AddCardDialogContent({
  open,
  onOpenChange,
  onAddBatch,
  onEndSession,
  portfolioName,
  existingHoldingQuantities = EMPTY_HOLDING_QUANTITIES,
}: AddCardDialogProps) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const [drafts, setDrafts] = useState<CardAcquisitionDrafts>({})
  const [defaultAcquiredAt] = useState(localDateInputValue)
  const [requestScopeId] = useState(() => globalThis.crypto.randomUUID())

  useEffect(
    () => () => {
      onEndSession?.(requestScopeId)
    },
    [onEndSession, requestScopeId],
  )

  const updateDraft = (
    cardId: number,
    patch: Partial<CardAcquisitionDraft>,
  ) => {
    setDrafts((current) => ({
      ...current,
      [cardId]: {
        ...(current[cardId] ??
          createCardAcquisitionDraft(defaultAcquiredAt)),
        ...patch,
      },
    }))
  }

  return (
    <CardBatchPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      maxSelection={MAX_PORTFOLIO_BATCH_ITEMS}
      selectionLimitLabel={t(lang, "portfolioBatchSelectionLimit").replace(
        "{count}",
        String(MAX_PORTFOLIO_BATCH_ITEMS),
      )}
      emptySubmitLabel={t(lang, "selectCardsToAdd")}
      submittingLabel={t(lang, "saving")}
      submitLabel={(count) => {
        const label = portfolioName
          ? t(lang, "addCardsToPortfolio").replace("{name}", portfolioName)
          : t(lang, "addToPortfolio")
        return `${label} (${count})`
      }}
      reviewLabel={(count) =>
        `${t(lang, "continueToPurchaseDetails")} (${count})`
      }
      renderReview={({ cards, submitting, onBack, onSubmit }) => (
        <AddCardDetailStep
          cards={cards}
          drafts={drafts}
          onDraftChange={updateDraft}
          defaultAcquiredAt={defaultAcquiredAt}
          existingHoldingQuantities={existingHoldingQuantities}
          submitting={submitting}
          onBack={onBack}
          onSubmit={() => {
            const cartItems = buildAcquisitionCartItems({
              cards,
              drafts,
              defaultAcquiredAt,
              currency,
              existingHoldingQuantities,
            })
            if (!cartItems) return

            onSubmit(async () => {
              const result = await onAddBatch(cartItems, requestScopeId)
              if (!result.ok && !result.limitReached) {
                toast.error(t(lang, "purchaseLotSaveFailed"), {
                  description: result.error || undefined,
                })
              }
              if (result.ok) {
                toast.success(t(lang, "purchaseLotSaved"), {
                  description: t(lang, "portfolioCardsAddedHint").replace(
                    "{name}",
                    portfolioName ?? t(lang, "portfolio"),
                  ),
                })
              }
              return result.ok
            })
          }}
        />
      )}
    />
  )
}
