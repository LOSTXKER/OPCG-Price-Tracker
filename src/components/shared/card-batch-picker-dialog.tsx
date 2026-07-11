"use client"

import { useEffect, useState, type ReactNode } from "react"

import { CardPickerForm, type CardWithSet } from "@/components/shared/card-picker-form"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { ResponsiveDialogContent } from "@/components/ui/responsive-dialog-content"

type CardBatchPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (cards: CardWithSet[]) => Promise<boolean | void>
  emptySubmitLabel: ReactNode
  submitLabel: (count: number) => ReactNode
}

function CardBatchPickerContent({
  open,
  onOpenChange,
  onSubmit,
  emptySubmitLabel,
  submitLabel,
}: CardBatchPickerDialogProps) {
  const [selected, setSelected] = useState<CardWithSet[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) setSelected([])
  }, [open])

  const toggleCard = (card: CardWithSet) => {
    setSelected((current) =>
      current.some((item) => item.id === card.id)
        ? current.filter((item) => item.id !== card.id)
        : [...current, card],
    )
  }

  const submit = async () => {
    if (submitting || selected.length === 0) return

    setSubmitting(true)
    try {
      const shouldClose = await onSubmit(selected)
      if (shouldClose !== false) onOpenChange(false)
    } catch {
      // The caller owns feature-specific feedback. Keep the picks open for retry.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ResponsiveDialogContent>
      <CardPickerForm
        onSelect={toggleCard}
        isSelected={(card) => selected.some((item) => item.id === card.id)}
        selected={selected}
        footer={
          <div className="border-t border-hair p-3">
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={selected.length === 0 || submitting}
              aria-busy={submitting}
              className="h-11 w-full rounded-xl font-semibold"
            >
              {selected.length === 0 ? emptySubmitLabel : submitLabel(selected.length)}
            </Button>
          </div>
        }
      />
    </ResponsiveDialogContent>
  )
}

/**
 * Canonical multi-card picker dialog. Selection stays pending until the caller's
 * submit succeeds; closing the dialog clears the batch before the next opening.
 */
export function CardBatchPickerDialog(props: CardBatchPickerDialogProps) {
  const { open, onOpenChange } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CardBatchPickerContent {...props} />
    </Dialog>
  )
}
