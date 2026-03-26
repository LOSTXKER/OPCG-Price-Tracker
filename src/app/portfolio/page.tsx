"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state"
import { PortfolioSelector, type PortfolioMeta } from "@/components/portfolio/portfolio-selector"
import { PortfolioStatsStrip, type PortfolioStats } from "@/components/portfolio/portfolio-stats-strip"
import { PortfolioHistoryChart } from "@/components/portfolio/portfolio-history-chart"
import { PortfolioAllocationChart, type AllocationSlice } from "@/components/portfolio/portfolio-allocation-chart"
import { PortfolioAssetsTable, type AssetRow } from "@/components/portfolio/portfolio-assets-table"
import { PortfolioTransactions, type TransactionRow } from "@/components/portfolio/portfolio-transactions"
import { AddCardDialog } from "@/components/portfolio/add-card-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { CardSearchResult } from "@/hooks/use-card-search"
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

  const addCard = async (card: CardSearchResult, quantity: number, purchasePrice: number | null) => {
    if (!activeId) {
      const createRes = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Default" }),
      })
      if (!createRes.ok) return
      const created = (await createRes.json()) as { portfolio: { id: number } }
      setActiveId(created.portfolio.id)
      await fetch("/api/portfolio/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId: created.portfolio.id,
          cardId: card.id,
          quantity,
          purchasePrice,
          condition: "NM",
        }),
      })
    } else {
      await fetch("/api/portfolio/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId: activeId,
          cardId: card.id,
          quantity,
          purchasePrice,
          condition: "NM",
        }),
      })
    }
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
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[200px] max-w-xs flex-1">
          <PortfolioSelector
            portfolios={portfolioMetas}
            activeId={activeId}
            onSelect={setActiveId}
            onCreate={createPortfolio}
            onRename={renamePortfolio}
            onDelete={deletePortfolio}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
            {(["overview", "transactions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "overview" ? "Overview" : "Transaction"}
              </button>
            ))}
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
            <Plus className="size-4" />
            เพิ่มการ์ด
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
          {/* Stats strip */}
          <PortfolioStatsStrip stats={stats} />

          {/* Hero value */}
          <div className="panel p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Value</p>
            <p className="mt-1 font-price text-4xl font-bold tabular-nums tracking-tight">
              ¥{stats.totalValueJpy.toLocaleString()}
            </p>
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="panel p-5 lg:col-span-8">
              <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">History</p>
              <PortfolioHistoryChart data={history} />
            </div>
            <div className="panel p-5 lg:col-span-4">
              <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Allocation</p>
              <PortfolioAllocationChart data={allocation} />
            </div>
          </div>

          {/* Assets table */}
          <div className="panel overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Assets · {assets.length} การ์ด
              </p>
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
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Transactions
            </p>
          </div>
          <PortfolioTransactions transactions={transactions} />
        </div>
      )}

      <AddCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={addCard}
      />
    </div>
  )
}
