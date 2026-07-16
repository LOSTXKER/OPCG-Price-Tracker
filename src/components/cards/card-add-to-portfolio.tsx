"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Briefcase, Check, Globe, Lock } from "lucide-react"
import { ApiError, apiGet, apiPost } from "@/lib/api/client"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { displayValueToJpy } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import { DEFAULT_CARD_CONDITION } from "@/lib/constants/ui"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  PortfolioCreateForm,
  shouldAcceptPortfolioDialogOpenChange,
} from "@/components/portfolio/portfolio-create-dialog"
import { getPortfolioCreateCopy } from "@/components/portfolio/portfolio-create-copy"
import type { PortfolioMutationResult } from "@/lib/types/portfolio"

type PortfolioOption = {
  id: number
  name: string
  isPublic: boolean
}

export function getAutomaticPortfolioId(
  portfolios: ReadonlyArray<Pick<PortfolioOption, "id">>,
): number | null {
  return portfolios.length === 1 ? (portfolios[0]?.id ?? null) : null
}

export function CardAddToPortfolio({
  cardId,
  cardName,
  className,
  variant = "default",
  iconOnly = false,
}: {
  cardId: number
  cardName: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  iconOnly?: boolean
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState("1")
  const [price, setPrice] = useState("")
  const [adding, setAdding] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [portfolios, setPortfolios] = useState<PortfolioOption[] | null>(null)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null)
  const [loadingPortfolios, setLoadingPortfolios] = useState(false)
  const [creatingPortfolio, setCreatingPortfolio] = useState(false)
  const loadRequest = useRef(0)
  const addRequestId = useRef<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dialogSession = useRef(0)
  const portfolioLabelId = useId()
  const quantityId = useId()
  const priceId = useId()

  const createCopy = getPortfolioCreateCopy(lang, t(lang, "createPortfolioTitle"))
  const mutationPending = adding || creatingPortfolio

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
      const data = await apiGet<{ portfolios: PortfolioOption[] }>("/api/portfolio")
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
      if (requestId === loadRequest.current) setLoadingPortfolios(false)
    }
  }

  const openDialog = () => {
    clearCloseTimer()
    dialogSession.current += 1
    setQuantity("1")
    setPrice("")
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

  const createPortfolio = async (
    name: string,
    isPublic: boolean,
  ): Promise<PortfolioMutationResult<PortfolioOption>> => {
    try {
      const created = await apiPost<{ portfolio: PortfolioOption }>(
        "/api/portfolio",
        { name, isPublic },
      )
      return { ok: true, status: 201, error: null, data: created.portfolio }
    } catch (err) {
      return {
        ok: false,
        status: err instanceof ApiError ? err.status : 0,
        error: err instanceof ApiError ? err.message : t(lang, "createPortfolioFailed"),
      }
    }
  }

  const handleAdd = async () => {
    const session = dialogSession.current
    const qty = parseInt(quantity)
    if (!Number.isInteger(qty) || qty < 1) return
    const raw = price.trim() ? parseInt(price) : null
    const pp = raw != null ? Math.round(displayValueToJpy(raw, currency)) : null

    setAdding(true)
    setError(null)
    try {
      if (!selectedPortfolioId) {
        setError(t(lang, "selectPortfolioRequired"))
        return
      }

      try {
        const requestId = addRequestId.current ?? globalThis.crypto.randomUUID()
        addRequestId.current = requestId
        await apiPost("/api/portfolio/items/batch", {
          portfolioId: selectedPortfolioId,
          requestId,
          items: [
            {
              cardId,
              quantity: qty,
              purchasePrice: pp,
              condition: DEFAULT_CARD_CONDITION,
            },
          ],
        })
      } catch (err) {
        if (session !== dialogSession.current) return
        setError(err instanceof ApiError ? err.message : t(lang, "addFailed"))
        return
      }
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
    } catch {
      if (session === dialogSession.current) setError(t(lang, "addFailed"))
    } finally {
      if (session === dialogSession.current) setAdding(false)
    }
  }

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
        onOpenChange={(next) => {
          if (!shouldAcceptPortfolioDialogOpenChange(next, mutationPending)) return
          if (next) openDialog()
          else closeDialog()
        }}
      >
        <DialogContent className="sm:max-w-sm" showCloseButton={!mutationPending}>
          <DialogHeader>
            <DialogTitle>{t(lang, "addToPort")}</DialogTitle>
            <DialogDescription className="truncate">{cardName}</DialogDescription>
          </DialogHeader>

          {loadingPortfolios ? (
            <p className="py-6 text-center text-meta" aria-live="polite">
              {t(lang, "loading")}
            </p>
          ) : error && portfolios === null ? (
            <div className="space-y-3 py-3 text-center" role="alert">
              <p className="text-meta text-destructive">{error}</p>
              <Button type="button" variant="outline" onClick={() => void loadPortfolios()}>
                {t(lang, "retry")}
              </Button>
            </div>
          ) : portfolios?.length === 0 ? (
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
          ) : done ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Check className="size-8 text-foreground" />
              <p className="text-body-sm font-medium">{t(lang, "added")}</p>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                void handleAdd()
              }}
            >
              {portfolios && portfolios.length > 0 && (
                <div className="space-y-1.5">
                  <p id={portfolioLabelId} className="text-label">
                    {t(lang, "choosePortfolio")}
                  </p>
                  {portfolios.length === 1 ? (
                    <div className="flex min-h-11 items-center gap-2 rounded-lg border border-hair bg-muted/30 px-3 text-body-sm">
                      <Briefcase className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{portfolios[0]?.name}</span>
                      {portfolios[0]?.isPublic ? (
                        <>
                          <Globe aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                          <span className="sr-only">{t(lang, "portfolioPublic")}</span>
                        </>
                      ) : (
                        <>
                          <Lock aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                          <span className="sr-only">{t(lang, "portfolioPrivate")}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <Select
                      value={selectedPortfolioId?.toString() ?? ""}
                      onValueChange={(value) => {
                        const id = Number(value)
                        setSelectedPortfolioId(Number.isInteger(id) && id > 0 ? id : null)
                        addRequestId.current = null
                        setError(null)
                      }}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-labelledby={portfolioLabelId}
                        aria-invalid={error === t(lang, "selectPortfolioRequired") || undefined}
                      >
                        <span data-slot="select-value" className="flex min-w-0 flex-1 items-center gap-2 text-left">
                          <Briefcase className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">
                            {portfolios.find((portfolio) => portfolio.id === selectedPortfolioId)?.name ?? t(lang, "choosePortfolio")}
                          </span>
                        </span>
                      </SelectTrigger>
                      <SelectContent align="start" alignItemWithTrigger={false}>
                        {portfolios.map((portfolio) => (
                          <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                            {portfolio.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={quantityId} className="mb-1 block text-label">{t(lang, "quantity")}</label>
                  <Input id={quantityId} className="h-11 sm:h-10" type="number" min={1} value={quantity} disabled={adding} onChange={(e) => { setQuantity(e.target.value); addRequestId.current = null }} />
                </div>
                <div>
                  <label htmlFor={priceId} className="mb-1 block text-label">{t(lang, "purchasePrice")}</label>
                  <Input id={priceId} className="h-11 sm:h-10" type="number" min={0} placeholder={t(lang, "unspecified")} value={price} disabled={adding} onChange={(e) => { setPrice(e.target.value); addRequestId.current = null }} />
                </div>
              </div>
              {error && <p role="alert" className="text-meta text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={adding} aria-busy={adding}>
                {adding ? t(lang, "adding") : t(lang, "addToPort")}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
