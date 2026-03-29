"use client"

import { useState } from "react"
import { Briefcase, Check } from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { displayValueToJpy } from "@/lib/utils/currency"
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
}: {
  cardId: number
  cardName: string
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

      const portfolioRes = await fetch("/api/portfolio")
      if (portfolioRes.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        return
      }
      if (!portfolioRes.ok) { setError(t(lang, "loadFailed")); return }
      const pData = (await portfolioRes.json()) as { portfolios: { id: number }[] }

      if (pData.portfolios?.length) {
        portfolioId = pData.portfolios[0].id
      } else {
        const createRes = await fetch("/api/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Default" }),
        })
        if (!createRes.ok) { setError(t(lang, "createPortfolioFailed")); return }
        const created = (await createRes.json()) as { portfolio: { id: number } }
        portfolioId = created.portfolio.id
      }

      const res = await fetch("/api/portfolio/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId,
          cardId,
          quantity: qty,
          purchasePrice: pp,
          condition: DEFAULT_CARD_CONDITION,
        }),
      })
      if (!res.ok) {
        const j = (await res.json()) as { error?: string }
        setError(j.error ?? t(lang, "addFailed"))
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
        variant="outline"
        size="sm"
        onClick={() => { setOpen(true); setQuantity("1"); setPrice(""); setDone(false); setError(null) }}
        className="gap-1.5"
      >
        <Briefcase className="size-3.5" />
        {t(lang, "addToPort")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t(lang, "addToPort")}</DialogTitle>
            <DialogDescription className="truncate">{cardName}</DialogDescription>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Check className="size-8 text-price-up" />
              <p className="text-sm font-medium">{t(lang, "added")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">{t(lang, "quantity")}</label>
                  <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">{t(lang, "purchasePrice")}</label>
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
