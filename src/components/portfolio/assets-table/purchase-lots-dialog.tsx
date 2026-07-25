"use client"

import { useState, type ReactNode } from "react"
import Image from "next/image"
import {
  CalendarDays,
  ChevronLeft,
  Loader2,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Price } from "@/components/shared/price-inline"
import { useConfirm } from "@/components/shared/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GroupedSection } from "@/components/ui/grouped-list"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { QtyStepper } from "@/components/ui/qty-stepper"
import { ResponsiveDialogContent } from "@/components/ui/responsive-dialog-content"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Surface } from "@/components/ui/surface"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_CARD_CONDITION,
  MASKED,
  MAX_LISTING_QUANTITY,
} from "@/lib/constants/ui"
import {
  getCardName,
  getLocale,
  t,
  type Language,
  type TranslationKey,
} from "@/lib/i18n"
import type {
  AssetRow,
  PortfolioLot,
} from "@/lib/types/portfolio"
import type {
  CreatePortfolioLotInput,
  UpdatePortfolioLotInput,
} from "@/lib/portfolio/schemas"
import {
  currencySymbol,
  jpyToDisplayValue,
} from "@/lib/utils/currency"
import { localDateInputValue } from "@/lib/utils/time"
import { useUIStore } from "@/stores/ui-store"

import {
  getPurchaseRowLabel,
  getStablePurchaseLotNumber,
  parseCostValue,
  resolveUnitCostJpy,
} from "./utils"

const NOTES_MAX = 2000
const HOLDING_CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const
type HoldingCondition = (typeof HOLDING_CONDITIONS)[number]
const CONDITION_LABEL_KEYS = {
  NM: "mktPriceConditionNM",
  LP: "mktPriceConditionLP",
  MP: "mktPriceConditionMP",
  HP: "mktPriceConditionHP",
  DMG: "mktPriceConditionDMG",
} as const satisfies Record<HoldingCondition, TranslationKey>

type LotFormValue = Pick<
  PortfolioLot,
  "quantity" | "unitCostJpy" | "acquiredAt" | "note"
>

type LotEditor =
  | { kind: "new" }
  | { kind: "edit"; lot: PortfolioLot }
  | { kind: "compatibility"; lot: LotFormValue }

export type PortfolioItemUpdateInput = {
  quantity?: number
  purchasePrice?: number | null
  acquiredAt?: string | null
  lotNote?: string | null
  condition?: string
  notes?: string | null
  isPrivate?: boolean
}

export function getMaxPurchaseLotQuantity(
  holdingQuantity: number,
  editingQuantity = 0,
): number {
  return Math.max(
    0,
    MAX_LISTING_QUANTITY - (holdingQuantity - editingQuantity),
  )
}

export function isPurchaseLotFormValid({
  creating,
  parsedCost,
  acquiredAt,
  quantity,
  maxQuantity,
}: {
  creating: boolean
  parsedCost: number | null | undefined
  acquiredAt: string
  quantity: number
  maxQuantity: number
}): boolean {
  return (
    parsedCost !== undefined &&
    (parsedCost === null || parsedCost >= 0) &&
    (!creating || (parsedCost !== null && acquiredAt !== "")) &&
    quantity >= 1 &&
    quantity <= maxQuantity
  )
}

export function getDirectCostLotId(
  row: Pick<AssetRow, "lots">,
): number | null {
  return row.lots.length === 1 && row.lots[0]?.unitCostJpy == null
    ? row.lots[0].id
    : null
}

export function isDirectPurchaseLotEdit(
  initialLotId: number | null | undefined,
  initialCompatibilityRow = false,
): boolean {
  return initialLotId != null || initialCompatibilityRow
}

export function getInitialPurchaseLotEditor(
  row: Pick<AssetRow, "lots" | "quantity" | "purchasePrice">,
  initialLotId: number | null | undefined,
  initialCompatibilityRow: boolean,
): LotEditor | null {
  if (initialCompatibilityRow) {
    return {
      kind: "compatibility",
      lot: {
        quantity: row.quantity,
        unitCostJpy: row.purchasePrice,
        acquiredAt: null,
        note: null,
      },
    }
  }

  const initialLot = row.lots.find((lot) => lot.id === initialLotId)
  return initialLot ? { kind: "edit", lot: initialLot } : null
}

function formatLotDate(value: string | null, lang: Language): string {
  if (!value) return t(lang, "dateNotSpecified")
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return t(lang, "dateNotSpecified")
  return new Intl.DateTimeFormat(getLocale(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed)
}

function lotTitle(
  row: Pick<AssetRow, "lots">,
  lot: PortfolioLot,
  fallbackIndex: number,
  lang: Language,
): string {
  return getPurchaseRowLabel(
    {
      source: lot.source,
      lotIndex:
        getStablePurchaseLotNumber(row.lots, lot.id) ?? fallbackIndex + 1,
    },
    lang,
  )
}

function toHoldingCondition(condition: string): HoldingCondition {
  return (
    HOLDING_CONDITIONS.find((candidate) => candidate === condition) ??
    DEFAULT_CARD_CONDITION
  )
}

export function hasHoldingDetailsChanges(
  row: Pick<AssetRow, "condition" | "notes" | "isPrivate">,
  next: {
    condition: string
    notes: string | null
    isPrivate: boolean
  },
): boolean {
  return (
    next.condition !== row.condition ||
    next.notes !== (row.notes ?? null) ||
    next.isPrivate !== (row.isPrivate ?? false)
  )
}

function HoldingIdentity({
  row,
  lang,
}: {
  row: AssetRow
  lang: Language
}) {
  const name = getCardName(lang, row)
  const summary = t(lang, "holdingPurchaseSummary")
    .replace("{copies}", String(row.quantity))
    .replace("{count}", String(row.lotCount))

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative aspect-[63/88] w-11 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-hair">
        {row.imageUrl ? (
          <Image
            src={row.imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="44px"
          />
        ) : (
          <div className="size-full bg-muted" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-body-sm font-medium">{name}</p>
        <p className="mt-0.5 truncate text-meta">
          <span className="font-mono">{row.baseCode ?? row.cardCode}</span>
          <span className="mx-1.5" aria-hidden>
            ·
          </span>
          <span className="tabular-nums">{summary}</span>
        </p>
      </div>
    </div>
  )
}

function PurchaseIdentity({
  row,
  label,
  lang,
}: {
  row: AssetRow
  label: string
  lang: Language
}) {
  const name = getCardName(lang, row)

  return (
    <div
      className="flex min-w-0 items-center gap-3 rounded-xl border border-hair bg-card px-3 py-3"
      data-slot="portfolio-purchase-identity"
    >
      <div className="relative aspect-[63/88] w-9 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-hair">
        {row.imageUrl ? (
          <Image
            src={row.imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="36px"
          />
        ) : (
          <div className="size-full bg-muted" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-body-sm font-medium">{name}</p>
        <p className="mt-0.5 truncate text-meta">
          <span className="font-mono">{row.baseCode ?? row.cardCode}</span>
          <span className="mx-1.5" aria-hidden>
            ·
          </span>
          <span>{label}</span>
        </p>
      </div>
    </div>
  )
}

export function PurchaseLotsList({
  row,
  lang,
  hideBalance,
  busy,
  deletingLotId,
  onEdit,
  onDelete,
}: {
  row: AssetRow
  lang: Language
  hideBalance: boolean
  busy: boolean
  deletingLotId: number | null
  onEdit: (lot: PortfolioLot) => void
  onDelete: (lot: PortfolioLot) => void
}) {
  const cardName = getCardName(lang, row)

  return (
    <GroupedSection
      label={t(lang, "purchaseLots")}
      className="px-0 sm:px-0"
    >
      <div data-slot="portfolio-purchase-lot-list">
        {row.lots.map((lot, index) => {
          const deleting = deletingLotId === lot.id
          const purchaseLabel = lotTitle(row, lot, index, lang)
          const costLabel =
            lot.unitCostJpy == null
              ? t(lang, "costNotRecorded")
              : hideBalance
                ? MASKED
                : null

          return (
            <div
              key={lot.id}
              className="flex min-h-20 items-start gap-3 px-4 py-3"
              data-slot="portfolio-purchase-lot-row"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ReceiptText className="size-4" aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <p className="text-body-sm font-medium">
                    {purchaseLabel}
                  </p>
                  <Badge variant="neutral">×{lot.quantity}</Badge>
                </div>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-meta">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3" aria-hidden />
                    {formatLotDate(lot.acquiredAt, lang)}
                  </span>
                  <span aria-hidden>·</span>
                  <span
                    className="font-price tabular-nums"
                    data-slot="portfolio-purchase-lot-cost"
                  >
                    {costLabel ?? <Price jpy={lot.unitCostJpy ?? 0} />}
                    {lot.unitCostJpy != null && (
                      <span className="ml-1 font-sans">
                        {t(lang, "unitCost")}
                      </span>
                    )}
                  </span>
                </div>
                {lot.note && (
                  <p
                    className="mt-1 break-words text-body-sm text-muted-foreground"
                    data-slot="portfolio-purchase-lot-note"
                  >
                    {lot.note}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {lot.unitCostJpy == null ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => onEdit(lot)}
                    disabled={busy}
                    aria-label={`${t(lang, "recordCost")}: ${cardName} · ${purchaseLabel}`}
                    data-slot="portfolio-purchase-lot-record-cost"
                    className="px-2 text-primary"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    {t(lang, "recordCost")}
                  </Button>
                ) : (
                  <IconButton
                    size="sm"
                    onClick={() => onEdit(lot)}
                    disabled={busy}
                    aria-label={`${t(lang, "editPurchaseLot")}: ${cardName} · ${purchaseLabel}`}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </IconButton>
                )}
                <IconButton
                  size="sm"
                  onClick={() => onDelete(lot)}
                  disabled={busy}
                  aria-label={`${t(lang, "deletePurchaseLot")}: ${cardName} · ${purchaseLabel}`}
                  className="text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                >
                  {deleting ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="size-3.5" aria-hidden />
                  )}
                </IconButton>
              </div>
            </div>
          )
        })}
      </div>
    </GroupedSection>
  )
}

function PurchaseLotForm({
  editor,
  lang,
  hideBalance,
  busy,
  saving,
  deleting,
  maxQuantity,
  onCancel,
  onSave,
  onDelete,
  headerContent,
}: {
  editor: LotEditor
  lang: Language
  hideBalance: boolean
  busy: boolean
  saving: boolean
  deleting?: boolean
  maxQuantity: number
  onCancel: () => void
  onSave: (data: LotFormValue) => Promise<void>
  onDelete?: () => void
  headerContent?: ReactNode
}) {
  const currency = useUIStore((state) => state.currency)
  const lot = editor.kind === "new" ? null : editor.lot
  const [quantity, setQuantity] = useState(lot?.quantity ?? 1)
  const [cost, setCost] = useState(() =>
    lot?.unitCostJpy == null
      ? ""
      : String(jpyToDisplayValue(lot.unitCostJpy, currency)),
  )
  const [costEdited, setCostEdited] = useState(false)
  const [acquiredAt, setAcquiredAt] = useState(() =>
    lot?.acquiredAt
      ? lot.acquiredAt.slice(0, 10)
      : editor.kind === "new"
        ? localDateInputValue()
        : "",
  )
  const [note, setNote] = useState(lot?.note ?? "")
  const parsedCost = parseCostValue(cost)
  const maskExistingCost = hideBalance && lot?.unitCostJpy != null
  const valid = isPurchaseLotFormValid({
    creating: editor.kind === "new",
    parsedCost,
    acquiredAt,
    quantity,
    maxQuantity,
  })

  const handleSave = async () => {
    if (!valid || busy) return
    const unitCostJpy = resolveUnitCostJpy({
      parsedDisplayCost: parsedCost ?? null,
      currency,
      originalUnitCostJpy: lot?.unitCostJpy ?? null,
      costEdited: costEdited && !maskExistingCost,
    })

    await onSave({
      quantity,
      unitCostJpy,
      acquiredAt: acquiredAt || null,
      note: note.trim() || null,
    })
  }

  return (
    <>
      <div
        className="flex-1 space-y-5 overflow-y-auto px-5 py-5"
        data-slot="portfolio-purchase-lot-form"
      >
        {headerContent}

        <fieldset>
          <legend className="mb-2 block text-label">
            {t(lang, "quantity")}
          </legend>
          <QtyStepper
            value={quantity}
            onChange={setQuantity}
            max={maxQuantity}
            disabled={busy}
            decreaseLabel={`${t(lang, "decrease")} ${t(lang, "quantity")}`}
            increaseLabel={`${t(lang, "increase")} ${t(lang, "quantity")}`}
          />
        </fieldset>

        <div>
          <label htmlFor="purchase-lot-cost" className="mb-2 block text-label">
            {t(lang, "unitCost")}
            {editor.kind === "new" && (
              <span className="ml-0.5 text-destructive" aria-hidden>
                *
              </span>
            )}
          </label>
          {maskExistingCost ? (
            <Surface
              variant="subtle"
              padding="sm"
              className="font-price tabular-nums text-muted-foreground"
            >
              {MASKED}
            </Surface>
          ) : (
            <>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-body-sm text-muted-foreground">
                  {currencySymbol(currency)}
                </span>
                <Input
                  id="purchase-lot-cost"
                  aria-describedby={
                    cost === "" ? "purchase-lot-cost-help" : undefined
                  }
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={currency === "JPY" ? 1 : 0.01}
                  required={editor.kind === "new"}
                  value={cost}
                  disabled={busy}
                  onChange={(event) => {
                    setCost(event.target.value)
                    setCostEdited(true)
                  }}
                  className="pl-8 font-price tabular-nums"
                  placeholder={editor.kind === "new" ? undefined : "—"}
                />
              </div>
              {cost === "" && (
                <p id="purchase-lot-cost-help" className="mt-1.5 text-meta">
                  {t(
                    lang,
                    editor.kind === "new"
                      ? "requiredAcquisitionCostHint"
                      : "costNotRecorded",
                  )}
                </p>
              )}
            </>
          )}
        </div>

        <div>
          <label htmlFor="purchase-lot-date" className="mb-2 block text-label">
            {t(lang, "acquiredDate")}
            {editor.kind === "new" && (
              <span className="ml-0.5 text-destructive" aria-hidden>
                *
              </span>
            )}
          </label>
          <Input
            id="purchase-lot-date"
            type="date"
            required={editor.kind === "new"}
            value={acquiredAt}
            disabled={busy}
            onChange={(event) => setAcquiredAt(event.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="purchase-lot-note"
            className="mb-2 flex items-center justify-between gap-3 text-label"
          >
            <span>{t(lang, "purchaseLotNote")}</span>
            <span className="text-meta tabular-nums">
              {note.length}/{NOTES_MAX}
            </span>
          </label>
          <Textarea
            id="purchase-lot-note"
            value={note}
            maxLength={NOTES_MAX}
            disabled={busy}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t(lang, "purchaseLotNotePlaceholder")}
            rows={4}
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-hair px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            aria-busy={deleting}
            onClick={onDelete}
            className="min-h-11 justify-center text-destructive hover:bg-destructive/10 hover:text-destructive md:min-h-10 sm:justify-start"
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-4" aria-hidden />
            )}
            {t(lang, "deletePurchaseLot")}
          </Button>
        ) : (
          <span aria-hidden />
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="outline"
            disabled={busy}
            onClick={onCancel}
            className="min-h-11 md:min-h-10"
          >
            {t(lang, "cancel")}
          </Button>
          <Button
            disabled={!valid || busy}
            aria-busy={saving}
            onClick={() => void handleSave()}
            className="min-h-11 md:min-h-10"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t(lang, "saving")}
              </>
            ) : (
              t(lang, "save")
            )}
          </Button>
        </div>
      </div>
    </>
  )
}

export function HoldingDetails({
  row,
  lang,
  busy,
  saving,
  onSave,
}: {
  row: AssetRow
  lang: Language
  busy: boolean
  saving: boolean
  onSave: (data: {
    condition?: string
    notes?: string | null
    isPrivate?: boolean
  }) => Promise<void>
}) {
  const [condition, setCondition] = useState<HoldingCondition>(() =>
    toHoldingCondition(row.condition),
  )
  const [notes, setNotes] = useState(row.notes ?? "")
  const [isPrivate, setIsPrivate] = useState(row.isPrivate ?? false)
  const nextNotes = notes.trim() || null
  const dirty = hasHoldingDetailsChanges(row, {
    condition,
    notes: nextNotes,
    isPrivate,
  })
  const conditionOptions = HOLDING_CONDITIONS.map((value) => ({
    value,
    label: value,
    ariaLabel: t(lang, CONDITION_LABEL_KEYS[value]),
  }))

  return (
    <details
      className="rounded-xl border border-hair bg-card"
      data-slot="portfolio-holding-details"
    >
      <summary
        aria-disabled={busy}
        onClick={busy ? (event) => event.preventDefault() : undefined}
        className="tap-safe cursor-pointer list-none px-4 py-3 text-body-sm font-medium aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
      >
        {t(lang, "holdingDetails")}
      </summary>
      <div className="space-y-4 border-t border-hair px-4 py-4">
        <fieldset
          disabled={busy}
          data-slot="portfolio-holding-condition"
        >
          <legend className="mb-2 block text-label">
            {t(lang, "mktPriceConditionLabel")}
          </legend>
          <SegmentedControl
            options={conditionOptions}
            value={condition}
            onChange={setCondition}
            ariaLabel={t(lang, "mktPriceConditionLabel")}
            size="sm"
            fullWidth
            className="w-full"
          />
          <p className="mt-1.5 text-meta">
            {t(lang, CONDITION_LABEL_KEYS[condition])}
          </p>
        </fieldset>

        <div>
          <label htmlFor="holding-note" className="mb-2 block text-label">
            {t(lang, "watchlistNote")}
          </label>
          <Textarea
            id="holding-note"
            value={notes}
            maxLength={NOTES_MAX}
            disabled={busy}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t(lang, "watchlistNotePlaceholder")}
            rows={3}
          />
        </div>
        <div className="flex min-h-11 items-center justify-between gap-4">
          <label htmlFor="holding-private" className="text-body-sm">
            {t(lang, "privateCard")}
          </label>
          <Switch
            id="holding-private"
            checked={isPrivate}
            disabled={busy}
            onCheckedChange={setIsPrivate}
            ariaLabel={t(lang, "privateCard")}
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!dirty || busy}
            aria-busy={saving}
            onClick={() => {
              if (busy) return
              void onSave({
                condition,
                notes: nextNotes,
                isPrivate,
              })
            }}
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                {t(lang, "saving")}
              </>
            ) : (
              t(lang, "save")
            )}
          </Button>
        </div>
      </div>
    </details>
  )
}

export function PurchaseLotsDialog({
  open,
  onOpenChange,
  row,
  initialLotId = null,
  initialCompatibilityRow = false,
  hideBalance,
  onUpdateItem,
  onAddLot,
  onUpdateLot,
  onRemoveLot,
  onRemoveItem,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: AssetRow
  initialLotId?: number | null
  initialCompatibilityRow?: boolean
  hideBalance: boolean
  onUpdateItem: (
    itemId: number,
    data: PortfolioItemUpdateInput,
  ) => Promise<boolean>
  onAddLot: (itemId: number, data: CreatePortfolioLotInput) => Promise<boolean>
  onUpdateLot: (lotId: number, data: UpdatePortfolioLotInput) => Promise<boolean>
  onRemoveLot: (lotId: number) => Promise<boolean>
  onRemoveItem: (itemId: number) => Promise<boolean>
}) {
  const lang = useUIStore((state) => state.language)
  const [editor, setEditor] = useState<LotEditor | null>(() =>
    getInitialPurchaseLotEditor(
      row,
      initialLotId,
      initialCompatibilityRow,
    ),
  )
  const [saving, setSaving] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)
  const [deletingLotId, setDeletingLotId] = useState<number | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)
  const confirm = useConfirm()
  const directEdit = isDirectPurchaseLotEdit(
    initialLotId,
    initialCompatibilityRow,
  )
  const busy =
    saving || savingDetails || deletingLotId != null || deletingItem
  const editorKey = editor?.kind === "edit"
    ? `edit-${editor.lot.id}`
    : (editor?.kind ?? "list")
  const maxEditorQuantity = getMaxPurchaseLotQuantity(
    row.quantity,
    editor && editor.kind !== "new" ? editor.lot.quantity : 0,
  )
  const canAddLot = row.quantity < MAX_LISTING_QUANTITY
  const directPurchaseLabel =
    editor?.kind === "edit"
      ? lotTitle(
          row,
          editor.lot,
          row.lots.findIndex((lot) => lot.id === editor.lot.id),
          lang,
        )
      : editor?.kind === "compatibility"
        ? t(lang, "openingBalance")
        : null

  const knownCostLabel = t(lang, "costCoverage")
    .replace("{known}", String(row.costedCopyCount))
    .replace("{total}", String(row.quantity))

  const handleClose = (nextOpen: boolean) => {
    if (busy) return
    if (!nextOpen) setEditor(null)
    onOpenChange(nextOpen)
  }

  const handleSaveLot = async (data: LotFormValue) => {
    if (!editor || busy) return
    setSaving(true)
    try {
      let saved: boolean
      if (editor.kind === "new") {
        if (data.unitCostJpy == null || data.acquiredAt == null) return
        saved = await onAddLot(row.itemId, {
          ...data,
          unitCostJpy: data.unitCostJpy,
          acquiredAt: data.acquiredAt,
        })
      } else if (editor.kind === "edit") {
        saved = await onUpdateLot(editor.lot.id, data)
      } else {
        saved = await onUpdateItem(row.itemId, {
          quantity: data.quantity,
          purchasePrice: data.unitCostJpy,
          acquiredAt: data.acquiredAt,
          lotNote: data.note,
        })
      }
      if (!saved) {
        toast.error(t(lang, "purchaseLotSaveFailed"))
        return
      }
      toast.success(t(lang, "purchaseLotSaved"))
      if (directEdit) {
        onOpenChange(false)
      } else {
        setEditor(null)
      }
    } catch {
      toast.error(t(lang, "purchaseLotSaveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteLastPurchase = async (
    openingBalance = false,
  ): Promise<boolean> =>
    confirm({
      title: t(lang, "deletePurchaseLot"),
      description: openingBalance
        ? `${t(lang, "openingBalance")}: ${t(lang, "confirmDeleteLastPurchaseLotDesc")}`
        : t(lang, "confirmDeleteLastPurchaseLotDesc"),
      confirmLabel: t(lang, "remove"),
      cancelLabel: t(lang, "cancel"),
      variant: "destructive",
    })

  const handleDeleteLot = async (lot: PortfolioLot) => {
    if (busy) return
    const deletingLast = row.lotCount <= 1
    const approved = deletingLast
      ? await confirmDeleteLastPurchase()
      : await confirm({
          title: t(lang, "deletePurchaseLot"),
          description: t(lang, "confirmDeletePurchaseLotDesc"),
          confirmLabel: t(lang, "remove"),
          cancelLabel: t(lang, "cancel"),
          variant: "destructive",
        })
    if (!approved) return

    setDeletingLotId(lot.id)
    try {
      const deleted = await onRemoveLot(lot.id)
      if (!deleted) {
        toast.error(t(lang, "purchaseLotDeleteFailed"))
        return
      }
      toast.success(t(lang, "purchaseLotDeleted"))
      if (deletingLast || directEdit) onOpenChange(false)
    } catch {
      toast.error(t(lang, "purchaseLotDeleteFailed"))
    } finally {
      setDeletingLotId(null)
    }
  }

  const handleDeleteCompatibilityRow = async () => {
    if (busy) return
    const approved = await confirmDeleteLastPurchase(true)
    if (!approved) return

    setDeletingItem(true)
    try {
      const deleted = await onRemoveItem(row.itemId)
      if (!deleted) {
        toast.error(t(lang, "purchaseLotDeleteFailed"))
        return
      }
      toast.success(t(lang, "purchaseLotDeleted"))
      onOpenChange(false)
    } catch {
      toast.error(t(lang, "purchaseLotDeleteFailed"))
    } finally {
      setDeletingItem(false)
    }
  }

  const handleSaveDetails = async (data: {
    condition?: string
    notes?: string | null
    isPrivate?: boolean
  }) => {
    if (busy) return
    setSavingDetails(true)
    try {
      const saved = await onUpdateItem(row.itemId, data)
      if (!saved) {
        toast.error(t(lang, "saveFailed"))
        return
      }
      toast.success(t(lang, "saved"))
    } catch {
      toast.error(t(lang, "saveFailed"))
    } finally {
      setSavingDetails(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent
        className="md:max-w-[38rem]"
        showCloseButton={!busy}
        data-slot="portfolio-purchase-lots-dialog"
      >
        <div className="shrink-0 border-b border-hair px-5 py-4 pr-14">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {editor && !directEdit && (
                <IconButton
                  size="sm"
                  onClick={() => setEditor(null)}
                  disabled={busy}
                  aria-label={t(lang, "back")}
                  className="-ml-2"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </IconButton>
              )}
              <div className="min-w-0">
                <DialogTitle>
                  {editor
                    ? editor.kind === "new"
                      ? t(lang, "newPurchaseLot")
                      : t(lang, "editPurchaseLot")
                    : t(lang, "purchaseLots")}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {t(lang, "editHoldingDetails")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {editor ? (
          <PurchaseLotForm
            key={editorKey}
            editor={editor}
            lang={lang}
            hideBalance={hideBalance}
            busy={busy}
            saving={saving}
            deleting={
              (editor.kind === "edit" &&
                deletingLotId === editor.lot.id) ||
              (editor.kind === "compatibility" && deletingItem)
            }
            maxQuantity={maxEditorQuantity}
            onCancel={() =>
              directEdit ? handleClose(false) : setEditor(null)
            }
            onSave={handleSaveLot}
            onDelete={
              directEdit
                ? editor.kind === "edit"
                  ? () => void handleDeleteLot(editor.lot)
                  : editor.kind === "compatibility"
                    ? () => void handleDeleteCompatibilityRow()
                    : undefined
                : undefined
            }
            headerContent={
              directEdit && directPurchaseLabel ? (
                <PurchaseIdentity
                  row={row}
                  label={directPurchaseLabel}
                  lang={lang}
                />
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <HoldingIdentity row={row} lang={lang} />

              <Surface
                variant="subtle"
                padding="md"
                data-slot="portfolio-holding-cost-coverage"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-meta">{t(lang, "knownCost")}</p>
                    <p className="mt-1 whitespace-nowrap text-body-sm font-price font-medium tabular-nums">
                      {row.costedCopyCount === 0
                        ? "—"
                        : hideBalance
                          ? MASKED
                          : <Price jpy={row.recordedCostJpy} />}
                    </p>
                  </div>
                  <div>
                    <p className="text-meta">{t(lang, "costCoverageLabel")}</p>
                    <p className="mt-1 text-body-sm font-medium tabular-nums">
                      {knownCostLabel}
                    </p>
                  </div>
                </div>
              </Surface>

              <PurchaseLotsList
                row={row}
                lang={lang}
                hideBalance={hideBalance}
                busy={busy}
                deletingLotId={deletingLotId}
                onEdit={(lot) => setEditor({ kind: "edit", lot })}
                onDelete={(lot) => void handleDeleteLot(lot)}
              />

              <HoldingDetails
                key={`${row.itemId}-${row.condition}-${row.notes ?? ""}-${row.isPrivate ?? false}`}
                row={row}
                lang={lang}
                busy={busy}
                saving={savingDetails}
                onSave={handleSaveDetails}
              />
            </div>

            <div className="shrink-0 border-t border-hair px-5 py-4">
              <Button
                className="w-full sm:w-auto"
                onClick={() => setEditor({ kind: "new" })}
                disabled={busy || !canAddLot}
                title={!canAddLot ? t(lang, "holdingQuantityLimit") : undefined}
                data-slot="portfolio-purchase-lot-add"
              >
                <Plus className="size-4" aria-hidden />
                {t(lang, "addPurchaseLot")}
              </Button>
              {!canAddLot && (
                <p className="mt-2 text-meta">
                  {t(lang, "holdingQuantityLimit")}
                </p>
              )}
            </div>
          </>
        )}
      </ResponsiveDialogContent>
    </Dialog>
  )
}
