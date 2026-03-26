"use client"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCardSearch, type CardSearchResult } from "@/hooks/use-card-search"

export function AddCardDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (card: CardSearchResult, quantity: number, purchasePrice: number | null) => Promise<void>
}) {
  const cardSearch = useCardSearch()
  const [selected, setSelected] = useState<CardSearchResult | null>(null)
  const [quantity, setQuantity] = useState("1")
  const [price, setPrice] = useState("")
  const [adding, setAdding] = useState(false)

  const reset = () => {
    cardSearch.reset()
    setSelected(null)
    setQuantity("1")
    setPrice("")
  }

  const handleAdd = async () => {
    if (!selected) return
    const qty = parseInt(quantity)
    if (!Number.isInteger(qty) || qty < 1) return
    const pp = price.trim() ? parseInt(price) : null

    setAdding(true)
    try {
      await onAdd(selected, qty, pp)
      reset()
      onOpenChange(false)
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มการ์ดเข้าพอร์ต</DialogTitle>
          <DialogDescription>
            ค้นหาการ์ดแล้วกำหนดจำนวนและราคาที่ซื้อ
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-3">
            <Input
              placeholder="ค้นหาชื่อหรือรหัสการ์ด..."
              value={cardSearch.query}
              onChange={(e) => cardSearch.setQuery(e.target.value)}
              autoComplete="off"
            />
            <div className="max-h-60 space-y-1 overflow-auto rounded-lg border border-border/50 p-1">
              {cardSearch.query.trim().length < 2 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  พิมพ์อย่างน้อย 2 ตัวอักษร
                </p>
              ) : cardSearch.results.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">ไม่พบผลลัพธ์</p>
              ) : (
                cardSearch.results.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    onClick={() => setSelected(c)}
                  >
                    <span className="font-medium">{c.nameEn ?? c.nameJp}</span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {c.cardCode}
                      {c.latestPriceJpy != null && ` · ¥${c.latestPriceJpy.toLocaleString()}`}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-sm font-medium">{selected.nameEn ?? selected.nameJp}</p>
              <p className="font-mono text-xs text-muted-foreground">{selected.cardCode}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">จำนวน</label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">ราคาซื้อ (¥)</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="ไม่ระบุ"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelected(null)}
              >
                เลือกใหม่
              </Button>
              <Button
                className="flex-1"
                disabled={adding}
                onClick={() => void handleAdd()}
              >
                {adding ? "กำลังเพิ่ม..." : "เพิ่มเข้าพอร์ต"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
