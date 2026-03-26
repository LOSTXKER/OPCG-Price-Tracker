"use client"

import { useState } from "react"
import { Briefcase, Check } from "lucide-react"

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
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState("1")
  const [price, setPrice] = useState("")
  const [adding, setAdding] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    const qty = parseInt(quantity)
    if (!Number.isInteger(qty) || qty < 1) return
    const pp = price.trim() ? parseInt(price) : null

    setAdding(true)
    setError(null)
    try {
      let portfolioId: number

      const portfolioRes = await fetch("/api/portfolio")
      if (portfolioRes.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        return
      }
      const pData = (await portfolioRes.json()) as { portfolios: { id: number }[] }

      if (pData.portfolios?.length) {
        portfolioId = pData.portfolios[0].id
      } else {
        const createRes = await fetch("/api/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Default" }),
        })
        if (!createRes.ok) { setError("สร้างพอร์ตไม่สำเร็จ"); return }
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
          condition: "NM",
        }),
      })
      if (!res.ok) {
        const j = (await res.json()) as { error?: string }
        setError(j.error ?? "เพิ่มไม่สำเร็จ")
        return
      }
      setDone(true)
      setTimeout(() => { setDone(false); setOpen(false) }, 1200)
    } catch {
      setError("เพิ่มไม่สำเร็จ")
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
        เพิ่มเข้าพอร์ต
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>เพิ่มเข้าพอร์ต</DialogTitle>
            <DialogDescription className="truncate">{cardName}</DialogDescription>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Check className="size-8 text-price-up" />
              <p className="text-sm font-medium">เพิ่มแล้ว!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">จำนวน</label>
                  <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">ราคาซื้อ (¥)</label>
                  <Input type="number" min={0} placeholder="ไม่ระบุ" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button className="w-full" disabled={adding} onClick={() => void handleAdd()}>
                {adding ? "กำลังเพิ่ม..." : "เพิ่มเข้าพอร์ต"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
