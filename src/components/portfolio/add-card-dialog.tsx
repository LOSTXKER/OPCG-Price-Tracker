"use client"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { useUIStore } from "@/stores/ui-store"
import { displayValueToJpy } from "@/lib/utils/currency"
import { CardPickerForm } from "@/components/shared/card-picker-form"

import { DetailStep } from "./add-card-detail-step"
import {
  type CardWithSet,
  type CartItem,
} from "./add-card-types"

export type { CartItem }

export function AddCardDialog({
  open,
  onOpenChange,
  onAddBatch,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBatch: (items: CartItem[]) => Promise<unknown>
}) {
  const [step, setStep] = useState<"select" | "detail">("select")
  const [selectedCard, setSelectedCard] = useState<CardWithSet | null>(null)

  const [quantity, setQuantity] = useState(1)
  const [purchasePrice, setPurchasePrice] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const currency = useUIStore((s) => s.currency)

  const reset = () => {
    setStep("select")
    setSelectedCard(null)
    setQuantity(1)
    setPurchasePrice("")
  }

  const goToDetail = (card: CardWithSet) => {
    setSelectedCard(card)
    setQuantity(1)
    setPurchasePrice("")
    setStep("detail")
  }

  const goBackToSelect = () => {
    setStep("select")
    setSelectedCard(null)
  }

  const handleSubmit = async () => {
    if (!selectedCard) return
    setSubmitting(true)
    try {
      const raw = purchasePrice.trim() === "" ? null : parseInt(purchasePrice)
      const priceJpy = raw != null ? Math.round(displayValueToJpy(raw, currency)) : null
      await onAddBatch([{ card: selectedCard, quantity, purchasePrice: priceJpy }])
      reset()
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent
        className="flex flex-col gap-0 overflow-hidden p-0 max-md:!inset-0 max-md:!max-h-none max-md:!max-w-none max-md:!translate-x-0 max-md:!translate-y-0 max-md:!rounded-none md:h-auto md:max-h-[85dvh] md:w-full md:max-w-[34rem]"
      >
        {step === "select" ? (
          <CardPickerForm onSelect={goToDetail} />
        ) : selectedCard ? (
          <DetailStep
            card={selectedCard}
            quantity={quantity}
            setQuantity={setQuantity}
            purchasePrice={purchasePrice}
            setPurchasePrice={setPurchasePrice}
            submitting={submitting}
            onBack={goBackToSelect}
            onSubmit={() => void handleSubmit()}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
