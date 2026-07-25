"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import { Loader2, Package } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QtyStepper } from "@/components/ui/qty-stepper"
import { Surface } from "@/components/ui/surface"
import { Textarea } from "@/components/ui/textarea"
import { t } from "@/lib/i18n"
import {
  currencySymbol,
  formatDisplayValue,
} from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { parseCostValue } from "./assets-table/utils"
import type { CardWithSet } from "./add-card-types"
import {
  getCardAcquisitionDraft,
  getRemainingHoldingCapacity,
  isCardAcquisitionDraftValid,
  type CardAcquisitionDraft,
  type CardAcquisitionDrafts,
} from "./card-acquisition"

const NOTES_MAX = 2000

export type CardAcquisitionFormProps = {
  cards: CardWithSet[]
  drafts: CardAcquisitionDrafts
  onDraftChange: (
    cardId: number,
    patch: Partial<CardAcquisitionDraft>,
  ) => void
  defaultAcquiredAt: string
  existingHoldingQuantities?: Record<number, number>
  submitting: boolean
  onSubmit: () => void
  header?: ReactNode
  beforeCards?: ReactNode
  feedback?: ReactNode
  onCancel?: () => void
  cancelLabel?: ReactNode
  submitLabel?: ReactNode
}

const EMPTY_HOLDING_QUANTITIES: Record<number, number> = {}

/**
 * Canonical acquisition form for both a preselected card and a multi-card
 * portfolio batch. Callers own only the surrounding picker/portfolio chooser.
 */
export function CardAcquisitionForm({
  cards,
  drafts,
  onDraftChange,
  defaultAcquiredAt,
  existingHoldingQuantities = EMPTY_HOLDING_QUANTITIES,
  submitting,
  onSubmit,
  header,
  beforeCards,
  feedback,
  onCancel,
  cancelLabel,
  submitLabel,
}: CardAcquisitionFormProps) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const valid = cards.every((card) =>
    isCardAcquisitionDraftValid({
      draft: getCardAcquisitionDraft(
        drafts,
        card.id,
        defaultAcquiredAt,
      ),
      existingQuantity: existingHoldingQuantities[card.id] ?? 0,
    }),
  )

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      data-slot="portfolio-acquisition-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid && !submitting) onSubmit()
      }}
    >
      {header}

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {beforeCards}

        <div className="space-y-3">
          {cards.map((card) => {
            const draft = getCardAcquisitionDraft(
              drafts,
              card.id,
              defaultAcquiredAt,
            )
            const existingQuantity =
              existingHoldingQuantities[card.id] ?? 0
            const cardName = card.nameEn ?? card.nameJp
            const cardHeadingId = `add-card-heading-${card.id}`
            const maxQuantity =
              getRemainingHoldingCapacity(existingQuantity)
            const parsedCost = parseCostValue(draft.purchasePrice)

            return (
              <Surface
                key={card.id}
                variant="outline"
                padding="md"
                className="space-y-4"
                role="group"
                aria-labelledby={cardHeadingId}
                data-slot="portfolio-acquisition-card"
              >
                <div className="flex items-start gap-3">
                  <div className="relative aspect-[63/88] w-12 shrink-0 overflow-hidden rounded-md bg-muted/60">
                    {card.imageUrl ? (
                      <Image
                        src={card.imageUrl}
                        alt={cardName}
                        fill
                        className="object-contain"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Package className="size-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p id={cardHeadingId} className="truncate text-h5">
                      {cardName}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-code">{card.cardCode}</span>
                      {card.rarity && (
                        <RarityBadge rarity={card.rarity} size="sm" />
                      )}
                    </div>
                    <p className="mt-1 text-meta text-foreground">
                      {existingQuantity > 0
                        ? t(lang, "existingHoldingNewPurchase")
                        : t(lang, "newPortfolioHolding")}
                    </p>
                  </div>
                </div>

                <div
                  className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start"
                  data-slot="portfolio-acquisition-fields"
                >
                  <fieldset>
                    <legend className="mb-2 block text-label">
                      {t(lang, "quantity")}
                    </legend>
                    <QtyStepper
                      value={draft.quantity}
                      onChange={(quantity) =>
                        onDraftChange(card.id, { quantity })
                      }
                      min={1}
                      max={maxQuantity}
                      size="md"
                      disabled={submitting || maxQuantity === 0}
                      decreaseLabel={`${t(lang, "decrease")} · ${cardName} ${card.cardCode}`}
                      inputLabel={`${t(lang, "quantity")} · ${cardName} ${card.cardCode}`}
                      increaseLabel={`${t(lang, "increase")} · ${cardName} ${card.cardCode}`}
                    />
                    <p className="mt-1.5 max-w-48 text-meta">
                      {t(lang, "sameCostQuantityHint")}
                    </p>
                  </fieldset>

                  <div>
                    <label
                      htmlFor={`add-card-cost-${card.id}`}
                      className="mb-2 block text-label"
                    >
                      {t(lang, "unitCost")}
                      <span className="ml-0.5 text-destructive" aria-hidden>
                        *
                      </span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-body-sm text-muted-foreground">
                        {currencySymbol(currency)}
                      </span>
                      <Input
                        id={`add-card-cost-${card.id}`}
                        aria-describedby={`add-card-cost-help-${card.id}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={currency === "JPY" ? 1 : 0.01}
                        required
                        value={draft.purchasePrice}
                        disabled={submitting || maxQuantity === 0}
                        onChange={(event) =>
                          onDraftChange(card.id, {
                            purchasePrice: event.target.value,
                          })
                        }
                        className="pl-8 font-price tabular-nums"
                        aria-label={`${t(lang, "unitCost")} · ${cardName} ${card.cardCode}`}
                        aria-invalid={
                          parsedCost === undefined ||
                          (parsedCost != null && parsedCost < 0)
                        }
                      />
                    </div>
                    <p
                      id={`add-card-cost-help-${card.id}`}
                      className="mt-1.5 text-meta"
                    >
                      {parsedCost == null
                        ? t(lang, "requiredAcquisitionCostHint")
                        : `${t(lang, "totalCost")}: ${formatDisplayValue(
                            parsedCost * draft.quantity,
                            currency,
                          )}`}
                    </p>
                  </div>
                </div>

                <div data-slot="portfolio-acquisition-date">
                  <label
                    htmlFor={`add-card-date-${card.id}`}
                    className="mb-2 block text-label"
                  >
                    {t(lang, "acquiredDate")}
                    <span className="ml-0.5 text-destructive" aria-hidden>
                      *
                    </span>
                  </label>
                  <Input
                    id={`add-card-date-${card.id}`}
                    type="date"
                    required
                    value={draft.acquiredAt}
                    disabled={submitting || maxQuantity === 0}
                    onChange={(event) =>
                      onDraftChange(card.id, {
                        acquiredAt: event.target.value,
                      })
                    }
                    aria-label={`${t(lang, "acquiredDate")} · ${cardName} ${card.cardCode}`}
                  />
                </div>

                <details
                  className="group"
                  data-slot="portfolio-acquisition-note"
                >
                  <summary className="tap-safe -mx-2 flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-2 text-label text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                    <span
                      className="inline-flex size-4 items-center justify-center"
                      aria-hidden
                    >
                      <span className="group-open:hidden">+</span>
                      <span className="hidden group-open:inline">−</span>
                    </span>
                    <span>
                      {t(
                        lang,
                        draft.lotNote.trim()
                          ? "purchaseLotNote"
                          : "addPortfolioNote",
                      )}
                    </span>
                    <span className="sr-only">
                      {" "}
                      · {cardName} {card.cardCode}
                    </span>
                  </summary>

                  <div
                    id={`add-card-note-panel-${card.id}`}
                    className="pt-2"
                    data-slot="portfolio-acquisition-note-panel"
                  >
                    <label
                      htmlFor={`add-card-note-${card.id}`}
                      className="mb-2 flex items-center justify-between gap-3 text-label"
                    >
                      <span>{t(lang, "purchaseLotNote")}</span>
                      <span className="text-meta tabular-nums">
                        {draft.lotNote.length}/{NOTES_MAX}
                      </span>
                    </label>
                    <Textarea
                      id={`add-card-note-${card.id}`}
                      value={draft.lotNote}
                      maxLength={NOTES_MAX}
                      disabled={submitting || maxQuantity === 0}
                      onChange={(event) =>
                        onDraftChange(card.id, {
                          lotNote: event.target.value,
                        })
                      }
                      placeholder={t(lang, "purchaseLotNotePlaceholder")}
                      rows={3}
                    />
                  </div>
                </details>

                {maxQuantity === 0 && (
                  <p className="text-meta text-destructive">
                    {t(lang, "holdingQuantityLimit")}
                  </p>
                )}
              </Surface>
            )
          })}
        </div>

        {feedback}
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-hair px-5 py-4 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={onCancel}
          >
            {cancelLabel ?? t(lang, "back")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={!valid || submitting}
          aria-busy={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t(lang, "saving")}
            </>
          ) : (
            submitLabel ?? t(lang, "save")
          )}
        </Button>
      </div>
    </form>
  )
}
