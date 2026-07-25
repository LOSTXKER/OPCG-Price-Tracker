"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Briefcase, Check, Globe, Lock } from "lucide-react"

import {
  PortfolioCreateForm,
  shouldAcceptPortfolioDialogOpenChange,
} from "@/components/portfolio/portfolio-create-dialog"
import { getPortfolioCreateCopy } from "@/components/portfolio/portfolio-create-copy"
import { CardAcquisitionForm } from "@/components/portfolio/card-acquisition-form"
import {
  buildAcquisitionCartItems,
  createCardAcquisitionDraft,
  type CardAcquisitionDraft,
  type CardAcquisitionDrafts,
} from "@/components/portfolio/card-acquisition"
import type { CardWithSet } from "@/components/portfolio/add-card-types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ResponsiveDialogContent } from "@/components/ui/responsive-dialog-content"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { DEFAULT_CARD_CONDITION } from "@/lib/constants/ui"
import { ApiError, apiGet, apiPost } from "@/lib/api/client"
import { t } from "@/lib/i18n"
import type { PortfolioMutationResult } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"
import { localDateInputValue } from "@/lib/utils/time"
import { useUIStore } from "@/stores/ui-store"

type PortfolioItemSummary = {
  cardId: number
  quantity: number
  condition: string
}

type PortfolioOption = {
  id: number
  name: string
  isPublic: boolean
  items?: PortfolioItemSummary[]
}

export function getAutomaticPortfolioId(
  portfolios: ReadonlyArray<Pick<PortfolioOption, "id">>,
): number | null {
  return portfolios.length === 1 ? (portfolios[0]?.id ?? null) : null
}

export function getPortfolioCardQuantity(
  portfolio: PortfolioOption | null,
  cardId: number,
  condition: string = DEFAULT_CARD_CONDITION,
): number {
  return (
    portfolio?.items?.find(
      (item) => item.cardId === cardId && item.condition === condition,
    )?.quantity ?? 0
  )
}

export function CardAddToPortfolio({
  card,
  cardName,
  className,
  variant = "default",
  iconOnly = false,
}: {
  card: CardWithSet
  cardName: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  iconOnly?: boolean
}) {
  const lang = useUIStore((state) => state.language)
  const currency = useUIStore((state) => state.currency)
  const [open, setOpen] = useState(false)
  const [drafts, setDrafts] = useState<CardAcquisitionDrafts>({})
  const [defaultAcquiredAt, setDefaultAcquiredAt] =
    useState(localDateInputValue)
  const [adding, setAdding] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [portfolios, setPortfolios] = useState<PortfolioOption[] | null>(
    null,
  )
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<
    number | null
  >(null)
  const [loadingPortfolios, setLoadingPortfolios] = useState(false)
  const [creatingPortfolio, setCreatingPortfolio] = useState(false)
  const loadRequest = useRef(0)
  const addRequestId = useRef<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dialogSession = useRef(0)
  const portfolioLabelId = useId()

  const createCopy = getPortfolioCreateCopy(
    lang,
    t(lang, "createPortfolioTitle"),
  )
  const mutationPending = adding || creatingPortfolio
  const selectedPortfolio =
    portfolios?.find((portfolio) => portfolio.id === selectedPortfolioId) ??
    null
  const existingHoldingQuantities = {
    [card.id]: getPortfolioCardQuantity(selectedPortfolio, card.id),
  }

  const clearCloseTimer = () => {
    if (closeTimer.current === null) return
    clearTimeout(closeTimer.current)
    closeTimer.current = null
  }

  useEffect(() => {
    return () => {
      dialogSession.current += 1
      if (closeTimer.current !== null) clearTimeout(closeTimer.current)
    }
  }, [])

  const loadPortfolios = async () => {
    const requestId = ++loadRequest.current
    setLoadingPortfolios(true)
    setError(null)
    try {
      const data = await apiGet<{ portfolios: PortfolioOption[] }>(
        "/api/portfolio",
      )
      if (requestId !== loadRequest.current) return
      const next = data.portfolios ?? []
      setPortfolios(next)
      setSelectedPortfolioId(getAutomaticPortfolioId(next))
    } catch (err) {
      if (requestId !== loadRequest.current) return
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        return
      }
      setPortfolios(null)
      setError(t(lang, "loadFailed"))
    } finally {
      if (requestId === loadRequest.current) {
        setLoadingPortfolios(false)
      }
    }
  }

  const openDialog = () => {
    const today = localDateInputValue()
    clearCloseTimer()
    dialogSession.current += 1
    setDefaultAcquiredAt(today)
    setDrafts({ [card.id]: createCardAcquisitionDraft(today) })
    setDone(false)
    setError(null)
    setPortfolios(null)
    setSelectedPortfolioId(null)
    setCreatingPortfolio(false)
    addRequestId.current = null
    setOpen(true)
    void loadPortfolios()
  }

  const closeDialog = () => {
    clearCloseTimer()
    dialogSession.current += 1
    loadRequest.current += 1
    setOpen(false)
  }

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
    addRequestId.current = null
    setError(null)
  }

  const createPortfolio = async (
    name: string,
    isPublic: boolean,
  ): Promise<PortfolioMutationResult<PortfolioOption>> => {
    try {
      const created = await apiPost<{ portfolio: PortfolioOption }>(
        "/api/portfolio",
        { name, isPublic },
      )
      return {
        ok: true,
        status: 201,
        error: null,
        data: created.portfolio,
      }
    } catch (err) {
      return {
        ok: false,
        status: err instanceof ApiError ? err.status : 0,
        error:
          err instanceof ApiError
            ? err.message
            : t(lang, "createPortfolioFailed"),
      }
    }
  }

  const handleAdd = async () => {
    const session = dialogSession.current
    const cartItems = buildAcquisitionCartItems({
      cards: [card],
      drafts,
      defaultAcquiredAt,
      currency,
      existingHoldingQuantities,
    })
    if (!cartItems) {
      setError(t(lang, "requiredFields"))
      return
    }
    if (!selectedPortfolioId) {
      setError(t(lang, "selectPortfolioRequired"))
      return
    }

    setAdding(true)
    setError(null)
    try {
      const requestId =
        addRequestId.current ?? globalThis.crypto.randomUUID()
      addRequestId.current = requestId
      const item = cartItems[0]
      if (!item) return

      await apiPost("/api/portfolio/items/batch", {
        portfolioId: selectedPortfolioId,
        requestId,
        items: [
          {
            cardId: item.card.id,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            acquiredAt: item.acquiredAt,
            lotNote: item.lotNote,
            condition: DEFAULT_CARD_CONDITION,
          },
        ],
      })
      if (session !== dialogSession.current) return

      addRequestId.current = null
      setDone(true)
      clearCloseTimer()
      closeTimer.current = setTimeout(() => {
        closeTimer.current = null
        if (session !== dialogSession.current) return
        setDone(false)
        closeDialog()
      }, 1200)
    } catch (err) {
      if (session !== dialogSession.current) return
      setError(err instanceof ApiError ? err.message : t(lang, "addFailed"))
    } finally {
      if (session === dialogSession.current) setAdding(false)
    }
  }

  const portfolioChooser =
    portfolios && portfolios.length > 0 ? (
      <div className="space-y-1.5">
        <p id={portfolioLabelId} className="text-label">
          {t(lang, "choosePortfolio")}
        </p>
        {portfolios.length === 1 ? (
          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-hair bg-muted/30 px-3 text-body-sm">
            <Briefcase className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">
              {portfolios[0]?.name}
            </span>
            {portfolios[0]?.isPublic ? (
              <>
                <Globe
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="sr-only">
                  {t(lang, "portfolioPublic")}
                </span>
              </>
            ) : (
              <>
                <Lock
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="sr-only">
                  {t(lang, "portfolioPrivate")}
                </span>
              </>
            )}
          </div>
        ) : (
          <Select
            value={selectedPortfolioId?.toString() ?? ""}
            disabled={adding}
            onValueChange={(value) => {
              const id = Number(value)
              setSelectedPortfolioId(
                Number.isInteger(id) && id > 0 ? id : null,
              )
              addRequestId.current = null
              setError(null)
            }}
          >
            <SelectTrigger
              className="w-full"
              aria-labelledby={portfolioLabelId}
              aria-invalid={
                error === t(lang, "selectPortfolioRequired") || undefined
              }
            >
              <span
                data-slot="select-value"
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <Briefcase className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {selectedPortfolio?.name ?? t(lang, "choosePortfolio")}
                </span>
              </span>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              {portfolios.map((portfolio) => (
                <SelectItem
                  key={portfolio.id}
                  value={portfolio.id.toString()}
                >
                  {portfolio.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    ) : null

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        onClick={openDialog}
        aria-label={iconOnly ? t(lang, "addToPort") : undefined}
        title={iconOnly ? t(lang, "addToPort") : undefined}
        className={cn("gap-1.5", className)}
      >
        <Briefcase className={iconOnly ? "size-4" : "size-3.5"} />
        {!iconOnly && t(lang, "addToPort")}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (
            !shouldAcceptPortfolioDialogOpenChange(
              nextOpen,
              mutationPending,
            )
          ) {
            return
          }
          if (nextOpen) openDialog()
          else closeDialog()
        }}
      >
        <ResponsiveDialogContent showCloseButton={!mutationPending}>
          {loadingPortfolios ? (
            <>
              <DialogHeader className="border-b border-hair px-5 pt-5 pb-4 pr-12">
                <DialogTitle>{t(lang, "addToPort")}</DialogTitle>
                <DialogDescription className="truncate">
                  {cardName}
                </DialogDescription>
              </DialogHeader>
              <p
                className="flex flex-1 items-center justify-center px-5 py-12 text-meta"
                aria-live="polite"
              >
                {t(lang, "loading")}
              </p>
            </>
          ) : error && portfolios === null ? (
            <>
              <DialogHeader className="border-b border-hair px-5 pt-5 pb-4 pr-12">
                <DialogTitle>{t(lang, "addToPort")}</DialogTitle>
                <DialogDescription className="truncate">
                  {cardName}
                </DialogDescription>
              </DialogHeader>
              <div
                className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-12 text-center"
                role="alert"
              >
                <p className="text-meta text-destructive">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadPortfolios()}
                >
                  {t(lang, "retry")}
                </Button>
              </div>
            </>
          ) : portfolios?.length === 0 ? (
            <>
              <DialogHeader className="border-b border-hair px-5 pt-5 pb-4 pr-12">
                <DialogTitle>{t(lang, "addToPort")}</DialogTitle>
                <DialogDescription className="truncate">
                  {cardName}
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto px-5 py-5">
                <PortfolioCreateForm
                  onCreate={createPortfolio}
                  onCreated={(result) => {
                    setPortfolios([result.data])
                    setSelectedPortfolioId(result.data.id)
                    setError(null)
                  }}
                  onCancel={closeDialog}
                  onPendingChange={setCreatingPortfolio}
                  copy={createCopy}
                />
              </div>
            </>
          ) : done ? (
            <>
              <DialogHeader className="border-b border-hair px-5 pt-5 pb-4 pr-12">
                <DialogTitle>{t(lang, "newPurchaseLot")}</DialogTitle>
                <DialogDescription className="truncate">
                  {cardName}
                </DialogDescription>
              </DialogHeader>
              <div
                className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-12"
                role="status"
                aria-live="polite"
              >
                <Check className="size-8 text-foreground" aria-hidden />
                <p className="text-body-sm font-medium">
                  {t(lang, "added")}
                </p>
              </div>
            </>
          ) : (
            <CardAcquisitionForm
              cards={[card]}
              drafts={drafts}
              onDraftChange={updateDraft}
              defaultAcquiredAt={defaultAcquiredAt}
              existingHoldingQuantities={existingHoldingQuantities}
              submitting={adding}
              onCancel={closeDialog}
              cancelLabel={t(lang, "cancel")}
              onSubmit={() => void handleAdd()}
              beforeCards={portfolioChooser}
              feedback={
                error ? (
                  <p role="alert" className="text-meta text-destructive">
                    {error}
                  </p>
                ) : null
              }
              header={
                <DialogHeader className="border-b border-hair px-5 pt-5 pb-4 pr-12">
                  <DialogTitle>{t(lang, "newPurchaseLot")}</DialogTitle>
                  <DialogDescription className="truncate">
                    {cardName}
                  </DialogDescription>
                </DialogHeader>
              }
            />
          )}
        </ResponsiveDialogContent>
      </Dialog>
    </>
  )
}
