"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Eye, EyeOff, Plus } from "lucide-react"

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state"
import { PortfolioSidebar, type PortfolioMeta } from "@/components/portfolio/portfolio-selector"
import { PortfolioStatsStrip, type PortfolioStats } from "@/components/portfolio/portfolio-stats-strip"
import { PortfolioHero } from "@/components/portfolio/portfolio-hero"
import { PortfolioCharts } from "@/components/portfolio/portfolio-charts"
import { type AllocationSlice } from "@/components/portfolio/portfolio-allocation-chart"
import { PortfolioAssetsTable, type AssetRow } from "@/components/portfolio/portfolio-assets-table"
import { PortfolioTransactions, type TransactionRow } from "@/components/portfolio/portfolio-transactions"
import { AddCardDialog, type CartItem } from "@/components/portfolio/add-card-dialog"
import { Price } from "@/components/shared/price-inline"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

type TabId = "overview" | "transactions"

type CardData = {
  id: number
  cardCode: string
  baseCode: string | null
  nameJp: string
  nameEn: string | null
  imageUrl: string | null
  rarity: string
  latestPriceJpy: number | null
  priceChange24h: number | null
  priceChange7d: number | null
}

type ItemRow = {
  id: number
  quantity: number
  purchasePrice: number | null
  condition: string
  card: CardData
}

type PortfolioRow = {
  id: number
  name: string
  items: ItemRow[]
}

type HistoryPoint = { label: string; value: number }

export default function PortfolioPage() {
  const lang = useUIStore((s) => s.language)
  const [portfolios, setPortfolios] = useState<PortfolioRow[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [tab, setTab] = useState<TabId>("overview")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [hideBalance, setHideBalance] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [portfolioRes, historyRes] = await Promise.all([
        fetch("/api/portfolio"),
        fetch("/api/portfolio/history").catch(() => null),
      ])
      if (!portfolioRes.ok) {
        setError("โหลดข้อมูลไม่สำเร็จ")
        setLoading(false)
        return
      }
      const data = (await portfolioRes.json()) as { portfolios: PortfolioRow[] }
      setPortfolios(data.portfolios ?? [])

      if (!activeId && data.portfolios?.length) {
        setActiveId(data.portfolios[0].id)
      }

      if (historyRes?.ok) {
        const hData = (await historyRes.json()) as {
          snapshots: { totalJpy: number; snapshotAt: string }[]
        }
        setHistory(
          (hData.snapshots ?? []).map((s) => ({
            label: new Date(s.snapshotAt).toLocaleDateString("th-TH", {
              month: "short",
              day: "numeric",
            }),
            value: s.totalJpy,
          }))
        )
      }
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ")
    }
    setLoading(false)
  }, [activeId])

  const loadTransactions = useCallback(async () => {
    if (!activeId) return
    try {
      const res = await fetch(`/api/portfolio/transactions?portfolioId=${activeId}`)
      if (res.ok) {
        const data = (await res.json()) as { transactions: TransactionRow[] }
        setTransactions(data.transactions ?? [])
      }
    } catch { /* ignore */ }
  }, [activeId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (tab === "transactions") void loadTransactions()
  }, [tab, loadTransactions])

  const activePortfolio = useMemo(
    () => portfolios.find((p) => p.id === activeId) ?? null,
    [portfolios, activeId]
  )

  const items = activePortfolio?.items ?? []

  const stats = useMemo((): PortfolioStats => {
    let totalValueJpy = 0
    let totalCostJpy = 0
    let best: { name: string; pnl: number; pnlPercent: number } | null = null
    let worst: { name: string; pnl: number; pnlPercent: number } | null = null

    for (const it of items) {
      const px = it.card.latestPriceJpy ?? 0
      const cost = (it.purchasePrice ?? 0) * it.quantity
      const value = px * it.quantity
      totalValueJpy += value
      totalCostJpy += cost

      if (it.purchasePrice != null && it.purchasePrice > 0) {
        const linePnl = value - cost
        const linePct = ((px - it.purchasePrice) / it.purchasePrice) * 100
        const name = getCardName(lang, it.card)
        if (!best || linePnl > best.pnl) best = { name, pnl: linePnl, pnlPercent: linePct }
        if (!worst || linePnl < worst.pnl) worst = { name, pnl: linePnl, pnlPercent: linePct }
      }
    }

    const unrealizedPnl = totalValueJpy - totalCostJpy
    const unrealizedPnlPercent = totalCostJpy > 0 ? (unrealizedPnl / totalCostJpy) * 100 : 0

    return {
      totalValueJpy,
      totalCostJpy,
      unrealizedPnl,
      unrealizedPnlPercent,
      bestPerformer: best,
      worstPerformer: worst,
    }
  }, [items, lang])

  const allocation = useMemo((): AllocationSlice[] => {
    if (stats.totalValueJpy === 0) return []
    const sorted = [...items]
      .map((it) => ({
        name: getCardName(lang, it.card),
        value: (it.card.latestPriceJpy ?? 0) * it.quantity,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)

    const top7 = sorted.slice(0, 7)
    const otherValue = sorted.slice(7).reduce((s, d) => s + d.value, 0)
    const result = top7.map((d) => ({
      ...d,
      percent: (d.value / stats.totalValueJpy) * 100,
    }))
    if (otherValue > 0) {
      result.push({ name: "อื่นๆ", value: otherValue, percent: (otherValue / stats.totalValueJpy) * 100 })
    }
    return result
  }, [items, stats.totalValueJpy, lang])

  const assets = useMemo((): AssetRow[] =>
    items.map((it) => ({
      itemId: it.id,
      cardId: it.card.id,
      cardCode: it.card.cardCode,
      baseCode: it.card.baseCode,
      nameJp: it.card.nameJp,
      nameEn: it.card.nameEn,
      rarity: it.card.rarity,
      imageUrl: it.card.imageUrl,
      quantity: it.quantity,
      purchasePrice: it.purchasePrice,
      currentPrice: it.card.latestPriceJpy,
      priceChange24h: it.card.priceChange24h,
      priceChange7d: it.card.priceChange7d,
      condition: it.condition,
    })),
    [items]
  )

  const portfolioMetas = useMemo((): PortfolioMeta[] =>
    portfolios.map((p) => ({
      id: p.id,
      name: p.name,
      totalValue: p.items.reduce((s, it) => s + (it.card.latestPriceJpy ?? 0) * it.quantity, 0),
      itemCount: p.items.length,
    })),
    [portfolios]
  )

  const totalAllPortfolios = useMemo(
    () => portfolioMetas.reduce((s, p) => s + p.totalValue, 0),
    [portfolioMetas]
  )

  const createPortfolio = async (name: string) => {
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.ok) void load()
  }

  const renamePortfolio = async (id: number, name: string) => {
    const res = await fetch(`/api/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.ok) void load()
  }

  const deletePortfolio = async (id: number) => {
    const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" })
    if (res.ok) {
      if (activeId === id) setActiveId(null)
      void load()
    }
  }

  const addCardsBatch = async (items: CartItem[]) => {
    if (items.length === 0) return

    let targetId = activeId
    if (!targetId) {
      const createRes = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Default" }),
      })
      if (!createRes.ok) return
      const created = (await createRes.json()) as { portfolio: { id: number } }
      targetId = created.portfolio.id
      setActiveId(targetId)
    }

    await Promise.all(
      items.map((item) =>
        fetch("/api/portfolio/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portfolioId: targetId,
            cardId: item.card.id,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            condition: "NM",
          }),
        })
      )
    )
    void load()
  }

  const updateItem = async (itemId: number, data: { quantity?: number; purchasePrice?: number | null }) => {
    await fetch(`/api/portfolio/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    void load()
  }

  const removeItem = async (itemId: number) => {
    await fetch(`/api/portfolio/items/${itemId}`, { method: "DELETE" })
    void load()
  }

  if (loading) {
    return (
      <div className="flex gap-6">
        <div className="hidden w-60 shrink-0 space-y-3 md:block">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
        <div className="min-w-0 flex-1 space-y-6">
          <Skeleton className="h-28 rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* ──── Sidebar ──── */}
      <aside className="w-full shrink-0 md:w-60">
        <div className="md:sticky md:top-20 md:space-y-4">
          {/* Total across all portfolios */}
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">ภาพรวม</p>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <p className="mt-1 font-price text-2xl font-bold tabular-nums tracking-tight">
              {hideBalance ? "••••••" : <Price jpy={totalAllPortfolios} />}
            </p>
          </div>

          {/* Portfolio list */}
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">พอร์ตโฟลิโอ ({portfolioMetas.length})</p>
            </div>
            <PortfolioSidebar
              portfolios={portfolioMetas}
              activeId={activeId}
              onSelect={setActiveId}
              onCreate={createPortfolio}
              onRename={renamePortfolio}
              onDelete={deletePortfolio}
              hideBalance={hideBalance}
            />
          </div>
        </div>
      </aside>

      {/* ──── Main content ──── */}
      <main className="min-w-0 flex-1 space-y-6">
        {/* Top bar: portfolio name + tabs + add button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{activePortfolio?.name ?? "พอร์ตโฟลิโอ"}</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {items.length} การ์ด
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
              {(["overview", "transactions"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                    tab === t
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "overview" ? "ภาพรวม" : "ธุรกรรม"}
                </button>
              ))}
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:inline">เพิ่มการ์ด</span>
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {items.length === 0 && tab === "overview" ? (
          <KumaEmptyState
            preset="empty-portfolio"
            action={
              <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
                <Plus className="size-4" />
                เพิ่มการ์ด
              </Button>
            }
          />
        ) : tab === "overview" ? (
          <>
            {/* Hero value card */}
            <PortfolioHero
              totalValueJpy={stats.totalValueJpy}
              totalCostJpy={stats.totalCostJpy}
              unrealizedPnl={stats.unrealizedPnl}
              unrealizedPnlPercent={stats.unrealizedPnlPercent}
              hideBalance={hideBalance}
            />

            {/* Stats strip */}
            <PortfolioStatsStrip stats={stats} hideBalance={hideBalance} />

            {/* Charts row */}
            <PortfolioCharts history={history} allocation={allocation} />

            {/* Assets table */}
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
                <p className="text-sm font-semibold">สินทรัพย์</p>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {assets.length} การ์ด
                </span>
              </div>
              <PortfolioAssetsTable
                assets={assets}
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            </div>
          </>
        ) : (
          <div className="panel overflow-hidden">
            <div className="border-b border-border/40 px-5 py-3.5">
              <p className="text-sm font-semibold">ธุรกรรม</p>
            </div>
            <PortfolioTransactions transactions={transactions} />
          </div>
        )}
      </main>

      <AddCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddBatch={addCardsBatch}
      />
    </div>
  )
}
