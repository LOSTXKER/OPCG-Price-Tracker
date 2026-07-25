"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Loader2 } from "lucide-react"

import { CardPickerForm, type CardWithSet } from "@/components/shared/card-picker-form"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { ResponsiveDialogContent } from "@/components/ui/responsive-dialog-content"

type CardBatchPickerDialogBaseProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  emptySubmitLabel: ReactNode
  submitLabel: (count: number) => ReactNode
  submittingLabel?: ReactNode
  maxSelection?: number
  selectionLimitLabel?: ReactNode
}

type CardBatchPickerDirectSubmitProps = CardBatchPickerDialogBaseProps & {
  onSubmit: (cards: CardWithSet[]) => Promise<boolean | void>
  reviewLabel?: never
  renderReview?: never
}

export type CardBatchPickerReviewContext = {
  cards: CardWithSet[]
  submitting: boolean
  onBack: () => void
  onSubmit: (submitter: () => Promise<boolean | void>) => void
}

type CardBatchPickerReviewProps = CardBatchPickerDialogBaseProps & {
  onSubmit?: never
  reviewLabel: (count: number) => ReactNode
  renderReview: (context: CardBatchPickerReviewContext) => ReactNode
}

type CardBatchPickerDialogProps =
  | CardBatchPickerDirectSubmitProps
  | CardBatchPickerReviewProps

function CardBatchPickerContent({
  open,
  onOpenChange,
  onSubmit,
  emptySubmitLabel,
  submitLabel,
  submittingLabel,
  reviewLabel,
  renderReview,
  maxSelection = Number.POSITIVE_INFINITY,
  selectionLimitLabel,
}: CardBatchPickerDialogProps) {
  const [selected, setSelected] = useState<CardWithSet[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    if (!open) {
      setSelected([])
      setReviewing(false)
    }
  }, [open])

  const toggleCard = (card: CardWithSet) => {
    if (submitting) return
    setSelected(
      (current) =>
        getNextCardBatchSelection(current, card, maxSelection).cards,
    )
  }

  const runSubmission = async (submitter: () => Promise<boolean | void>) => {
    if (submitting) return

    setSubmitting(true)
    try {
      const shouldClose = await submitter()
      if (shouldClose !== false) onOpenChange(false)
    } catch {
      // The caller owns feature-specific feedback. Keep the current step open
      // with every pick and field intact so the user can retry.
    } finally {
      setSubmitting(false)
    }
  }

  const submitDirectly = () => {
    if (selected.length === 0 || !onSubmit) return
    void runSubmission(() => onSubmit(selected))
  }

  const content =
    reviewing && renderReview
      ? renderReview({
          cards: selected,
          submitting,
          onBack: () => {
            if (!submitting) setReviewing(false)
          },
          onSubmit: (submitter) => void runSubmission(submitter),
        })
      : (
          <CardPickerForm
            onSelect={toggleCard}
            isSelected={(card) => selected.some((item) => item.id === card.id)}
            selected={selected}
            footer={
              <div className="border-t border-hair p-3">
                {selected.length >= maxSelection && selectionLimitLabel ? (
                  <p
                    className="mb-2 text-center text-meta text-destructive"
                    role="status"
                  >
                    {selectionLimitLabel}
                  </p>
                ) : null}
                <Button
                  type="button"
                  onClick={() => {
                    if (selected.length === 0) return
                    if (renderReview) {
                      setReviewing(true)
                      return
                    }
                    submitDirectly()
                  }}
                  disabled={selected.length === 0 || submitting}
                  aria-busy={submitting}
                  className="h-11 w-full rounded-xl font-semibold"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2" aria-live="polite">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      {submittingLabel ?? submitLabel(selected.length)}
                    </span>
                  ) : selected.length === 0 ? (
                    emptySubmitLabel
                  ) : renderReview ? (
                    reviewLabel(selected.length)
                  ) : (
                    submitLabel(selected.length)
                  )}
                </Button>
              </div>
            }
          />
        )

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (shouldAcceptCardBatchPickerOpenChange(nextOpen, submitting)) {
          onOpenChange(nextOpen)
        }
      }}
    >
      <ResponsiveDialogContent showCloseButton={!submitting}>
        {content}
      </ResponsiveDialogContent>
    </Dialog>
  )
}

export function getNextCardBatchSelection(
  current: CardWithSet[],
  card: CardWithSet,
  maxSelection: number,
): { cards: CardWithSet[]; limitReached: boolean } {
  if (current.some((item) => item.id === card.id)) {
    return {
      cards: current.filter((item) => item.id !== card.id),
      limitReached: false,
    }
  }
  if (current.length >= maxSelection) {
    return { cards: current, limitReached: true }
  }
  return { cards: [...current, card], limitReached: false }
}

export function shouldAcceptCardBatchPickerOpenChange(
  nextOpen: boolean,
  submitting: boolean,
): boolean {
  return nextOpen || !submitting
}

/**
 * Canonical multi-card picker dialog. Selection stays pending until the caller's
 * submit succeeds; feature flows may insert a review/details step before commit.
 * Closing the dialog clears the batch before the next opening.
 */
export function CardBatchPickerDialog(props: CardBatchPickerDialogProps) {
  return <CardBatchPickerContent {...props} />
}
