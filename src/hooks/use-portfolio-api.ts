"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getCardName, getLocale, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { DEFAULT_CARD_CONDITION } from "@/lib/constants/ui"
import type { PortfolioStats, AllocationSlice, AssetRow, PortfolioMeta, TransactionRow } from "@/lib/types/portfolio"
import type { CartItem } from "@/components/portfolio/add-card-types"

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

export function usePortfolioApi() {
  const lang = useUIStore((s) => s.language)
  const [portfolios, setPortfolios] = useState<PortfolioRow[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)

  const activeIdRef = useRef(activeId)
  activeIdRef.current = activeId

  const load = useCallback(async () => {
    setError(null)
    try {
      const [portfolioRes, historyRes] = await Promise.all([
        fetch("/api/portfolio"),
        fetch("/api/portfolio/history").catch(() => null),
      ])
      if (!portfolioRes.ok) {
        setError(t(lang, "loadFailed"))
        setLoading(false)
        return
      }
      const data = (await portfolioRes.json()) as { portfolios: PortfolioRow[] }
      setPortfolios(data.portfolios ?? [])

      if (!activeIdRef.current && data.portfolios?.length) {
        setActiveId(data.portfolios[0].id)
      }

      if (historyRes?.ok) {
        const hData = (await historyRes.json()) as {
          snapshots: { totalJpy: number; snapshotAt: string }[]
        }
        const locale = getLocale(lang)
        setHistory(
          (hData.snapshots ?? []).map((s) => ({
            label: new Date(s.snapshotAt).toLocaleDateString(locale, {
              month: "short",
              day: "numeric",
            }),
            value: s.totalJpy,
          }))
        )
      }
    } catch {
      setError(t(lang, "loadFailed"))
    }
    setLoading(false)
  }, [lang])

  const loadTransactions = useCallback(async () => {
    if (!activeId) return
    try {
      const res = await fetch(`/api/portfolio/transactions?portfolioId=${activeId}`)
      if (!res.ok) {
        setTransactions([])
        return
      }
      const data = (await res.json()) as { transactions: TransactionRow[] }
      setTransactions(data.transactions ?? [])
    } catch (err) {
      console.error("Failed to load transactions:", err)
      setTransactions([])
    }
  }, [activeId])

  useEffect(() => {
    void load()
  }, [load])

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
      result.push({ name: t(lang, "other"), value: otherValue, percent: (otherValue / stats.totalValueJpy) * 100 })
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

  const createPortfolio = async (name: string): Promise<boolean> => {
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.ok) { void load(); return true }
    return false
  }

  const renamePortfolio = async (id: number, name: string): Promise<boolean> => {
    const res = await fetch(`/api/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.ok) { void load(); return true }
    return false
  }

  const deletePortfolio = async (id: number): Promise<boolean> => {
    const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" })
    if (res.ok) {
      if (activeId === id) setActiveId(null)
      void load()
      return true
    }
    return false
  }

  const addCardsBatch = async (cartItems: CartItem[]): Promise<{ ok: boolean; failed: number }> => {
    if (cartItems.length === 0) return { ok: true, failed: 0 }

    let targetId = activeId
    if (!targetId) {
      const createRes = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Default" }),
      })
      if (!createRes.ok) return { ok: false, failed: cartItems.length }
      const created = (await createRes.json()) as { portfolio: { id: number } }
      targetId = created.portfolio.id
      setActiveId(targetId)
    }

    const results = await Promise.all(
      cartItems.map((item) =>
        fetch("/api/portfolio/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portfolioId: targetId,
            cardId: item.card.id,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            condition: DEFAULT_CARD_CONDITION,
          }),
        })
      )
    )
    const failed = results.filter((r) => !r.ok).length
    void load()
    return { ok: failed === 0, failed }
  }

  const updateItem = async (itemId: number, data: { quantity?: number; purchasePrice?: number | null }): Promise<boolean> => {
    const res = await fetch(`/api/portfolio/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) return false
    void load()
    return true
  }

  const removeItem = async (itemId: number): Promise<boolean> => {
    const res = await fetch(`/api/portfolio/items/${itemId}`, { method: "DELETE" })
    if (!res.ok) return false
    void load()
    return true
  }

  return {
    portfolios,
    history,
    transactions,
    loading,
    error,
    activeId,
    setActiveId,
    activePortfolio,
    stats,
    allocation,
    assets,
    portfolioMetas,
    totalAllPortfolios,
    createPortfolio,
    renamePortfolio,
    deletePortfolio,
    addCardsBatch,
    updateItem,
    removeItem,
    loadTransactions,
  }
}
