"use client"

import Image from "next/image"
import { X } from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useCardPreviewStore } from "@/stores/card-preview-store"
import { useUIStore } from "@/stores/ui-store"
import { getCardName } from "@/lib/i18n"
import { BLUR_DATA_URL } from "@/lib/constants/ui"

/**
 * Lightweight image lightbox shown when a card image is clicked anywhere in
 * the app. Intentionally minimal — no metadata, no CTAs — just an enlarged
 * image with a close button. Use the card detail page for full info.
 */
export function CardMiniPreviewDialog() {
  const open = useCardPreviewStore((s) => s.open)
  const card = useCardPreviewStore((s) => s.card)
  const close = useCardPreviewStore((s) => s.close)

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? close() : null)}>
      <DialogContent
        showCloseButton={false}
        className="block w-[min(86vw,calc((100vh-4rem)*63/88),420px)] max-w-[calc(100%-2rem)] overflow-visible rounded-2xl border-0 bg-transparent p-0 shadow-none"
      >
        {card ? (
          <LightboxBody onClose={close} />
        ) : (
          <DialogTitle className="sr-only">Card preview</DialogTitle>
        )}
      </DialogContent>
    </Dialog>
  )
}

function LightboxBody({ onClose }: { onClose: () => void }) {
  const card = useCardPreviewStore((s) => s.card)!
  const lang = useUIStore((s) => s.language)
  const displayName = getCardName(lang, card)

  return (
    <>
      <DialogTitle className="sr-only">{displayName}</DialogTitle>
      <div className="relative aspect-[63/88] w-full overflow-hidden rounded-2xl bg-muted shadow-2xl">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={displayName}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 90vw, 560px"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            priority
          />
        ) : (
          <div className="flex size-full items-center justify-center text-meta">
            {card.cardCode}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute -top-3 -right-3 inline-flex size-9 items-center justify-center rounded-full bg-background text-foreground shadow-lg ring-1 ring-border transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:-top-4 sm:-right-4 sm:size-10"
      >
        <X className="size-4 sm:size-5" />
      </button>
    </>
  )
}
