"use client"

import { useState } from "react"
import { Briefcase, Check } from "lucide-react"
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

  const handleAdd = async () => {
    const qty = parseInt(quantity)
    if (!Number.isInteger(qty) || qty < 1) return
    const raw = price.trim() ? parseInt(price) : null
    const pp = raw != null ? Math.round(displayValueToJpy(raw, currency)) : null

    setAdding(true)
    setError(null)
    try {
      let portfolioId: number

      let pData: { portfolios: { id: number }[] }
      try {
        pData = await apiGet<{ portfolios: { id: number }[] }>("/api/portfolio")
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
          return
        }
        setError(t(lang, "loadFailed"))
        return
      }

      if (pData.portfolios?.length) {
        portfolioId = pData.portfolios[0].id
      } else {
        try {
          const created = await apiPost<{ portfolio: { id: number } }>("/api/portfolio", { name: "Default" })
          portfolioId = created.portfolio.id
        } catch {
          setError(t(lang, "createPortfolioFailed"))
          return
        }
      }

      try {
        await apiPost("/api/portfolio/items", {
          portfolioId,
          cardId,
          quantity: qty,
          purchasePrice: pp,
          condition: DEFAULT_CARD_CONDITION,
        })
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t(lang, "addFailed"))
        return
      }
      setDone(true)
      setTimeout(() => { setDone(false); setOpen(false) }, 1200)
    } catch {
      setError(t(lang, "addFailed"))
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        onClick={() => { setOpen(true); setQuantity("1"); setPrice(""); setDone(false); setError(null) }}
        aria-label={iconOnly ? t(lang, "addToPort") : undefined}
        title={iconOnly ? t(lang, "addToPort") : undefined}
        className={cn("gap-1.5", className)}
      >
        <Briefcase className={iconOnly ? "size-4" : "size-3.5"} />
        {!iconOnly && t(lang, "addToPort")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t(lang, "addToPort")}</DialogTitle>
            <DialogDescription className="truncate">{cardName}</DialogDescription>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Check className="size-8 text-foreground" />
              <p className="text-sm font-medium">{t(lang, "added")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-meta">{t(lang, "quantity")}</label>
                  <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-meta">{t(lang, "purchasePrice")}</label>
                  <Input type="number" min={0} placeholder={t(lang, "unspecified")} value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button className="w-full" disabled={adding} onClick={() => void handleAdd()}>
                {adding ? t(lang, "adding") : t(lang, "addToPort")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
