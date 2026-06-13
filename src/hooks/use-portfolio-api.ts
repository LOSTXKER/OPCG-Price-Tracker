"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ApiError, apiDelete, apiGet, apiPatch, apiPost, apiTry } from "@/lib/api/client"
import { getCardName, getLocale, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { invalidateSettings } from "@/hooks/use-settings"
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
  isPrivate?: boolean
  notes?: string | null
  card: CardData
}

type PortfolioRow = {
  id: number
  name: string
  isPublic: boolean
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
  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  const load = useCallback(async () => {
    try {
      const [data, hData] = await Promise.all([
        apiGet<{ portfolios: PortfolioRow[] }>("/api/portfolio"),
        apiTry(apiGet<{ snapshots: { totalJpy: number; snapshotAt: string }[] }>("/api/portfolio/history")),
      ])
      setError(null)
      setPortfolios(data.portfolios ?? [])

      if (!activeIdRef.current && data.portfolios?.length) {
        setActiveId(data.portfolios[0].id)
      }

      if (hData) {
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
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        invalidateSettings()
        const supabase = createClient()
        await supabase.auth.signOut()
      }
      setError(t(lang, "loadFailed"))
    }
    setLoading(false)
  }, [lang])

  const loadTransactions = useCallback(async () => {
    if (!activeId) return
    const data = await apiTry(
      apiGet<{ transactions: TransactionRow[] }>(`/api/portfolio/transactions?portfolioId=${activeId}`)
    )
    setTransactions(data?.transactions ?? [])
  }, [activeId])

  const deleteTransaction = useCallback(async (txId: number) => {
    await apiDelete(`/api/portfolio/transactions?id=${txId}`)
    setTransactions((prev) => prev.filter((tx) => tx.id !== txId))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      void load()
    }, 0)
    return () => clearTimeout(t)
  }, [load])

  const activePortfolio = useMemo(
    () => portfolios.find((p) => p.id === activeId) ?? null,
    [portfolios, activeId]
  )

  const items = useMemo(() => activePortfolio?.items ?? [], [activePortfolio])

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
        imageUrl: it.card.imageUrl,
        cardCode: it.card.cardCode,
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
      result.push({ name: t(lang, "other"), value: otherValue, percent: (otherValue / stats.totalValueJpy) * 100, imageUrl: null, cardCode: "" })
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
      isPrivate: it.isPrivate ?? false,
      notes: it.notes ?? null,
    })),
    [items]
  )

  const portfolioMetas = useMemo((): PortfolioMeta[] =>
    portfolios.map((p) => ({
      id: p.id,
      name: p.name,
      isPublic: p.isPublic ?? true,
      totalValue: p.items.reduce((s, it) => s + (it.card.latestPriceJpy ?? 0) * it.quantity, 0),
      totalCost: p.items.reduce((s, it) => s + (it.purchasePrice ?? 0) * it.quantity, 0),
      itemCount: p.items.length,
    })),
    [portfolios]
  )

  const totalAllPortfolios = useMemo(
    () => portfolioMetas.reduce((s, p) => s + p.totalValue, 0),
    [portfolioMetas]
  )

  const createPortfolio = async (name: string): Promise<boolean> => {
    const res = await apiTry(apiPost("/api/portfolio", { name }))
    if (res !== null) { void load(); return true }
    return false
  }

  const renamePortfolio = async (id: number, name: string): Promise<boolean> => {
    const res = await apiTry(apiPatch(`/api/portfolio/${id}`, { name }))
    if (res !== null) { void load(); return true }
    return false
  }

  const setPortfolioVisibility = async (
    id: number,
    isPublic: boolean,
  ): Promise<boolean> => {
    setPortfolios((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPublic } : p)),
    )
    const res = await apiTry(apiPatch(`/api/portfolio/${id}`, { isPublic }))
    if (res === null) {
      setPortfolios((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isPublic: !isPublic } : p)),
      )
      return false
    }
    return true
  }

  const deletePortfolio = async (id: number): Promise<boolean> => {
    const res = await apiTry(apiDelete(`/api/portfolio/${id}`))
    if (res !== null) {
      if (activeId === id) setActiveId(null)
      void load()
      return true
    }
    return false
  }

  const addCardsBatch = async (
    cartItems: CartItem[],
  ): Promise<{ ok: boolean; failed: number; limitReached?: boolean }> => {
    if (cartItems.length === 0) return { ok: true, failed: 0 }

    let targetId = activeId
    if (!targetId) {
      const created = await apiTry(
        apiPost<{ portfolio: { id: number } }>("/api/portfolio", { name: "Default" })
      )
      if (!created) return { ok: false, failed: cartItems.length }
      targetId = created.portfolio.id
      setActiveId(targetId)
    }

    const results = await Promise.all(
      cartItems.map(async (item) => {
        try {
          await apiPost("/api/portfolio/items", {
            portfolioId: targetId,
            cardId: item.card.id,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            condition: DEFAULT_CARD_CONDITION,
          })
          return { ok: true as const }
        } catch (err) {
          return { ok: false as const, status: err instanceof ApiError ? err.status : 0 }
        }
      })
    )
    const failed = results.filter((r) => !r.ok).length
    const limitReached = results.some((r) => !r.ok && r.status === 403)
    void load()
    return { ok: failed === 0, failed, limitReached }
  }

  const updateItem = async (
    itemId: number,
    data: {
      quantity?: number
      purchasePrice?: number | null
      isPrivate?: boolean
      notes?: string | null
    },
  ): Promise<boolean> => {
    const res = await apiTry(apiPatch(`/api/portfolio/items/${itemId}`, data))
    if (res === null) return false
    void load()
    return true
  }

  const removeItem = async (itemId: number): Promise<boolean> => {
    const res = await apiTry(apiDelete(`/api/portfolio/items/${itemId}`))
    if (res === null) return false
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
    setPortfolioVisibility,
    deletePortfolio,
    addCardsBatch,
    updateItem,
    removeItem,
    loadTransactions,
    deleteTransaction,
  }
}
